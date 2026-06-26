/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Importação assistida de vaga (ex.: anúncio do OLX).
 * - parseTextoVaga: lê o TEXTO colado pela empresa (caminho garantido).
 * - parseHtmlVaga: melhor esforço a partir do HTML de uma página (link),
 *   usando JSON-LD JobPosting ou OpenGraph. O OLX costuma bloquear o fetch,
 *   então o texto colado é o caminho confiável.
 */
import { BAIRROS } from "./mock-data";

export interface VagaImportada {
  titulo: string;
  descricao: string;
  bairro: string; // "" se não identificado
  salario: string;
  tipo: string; // "" se não identificado
  categoria: string; // "" se não identificado
}

function acharNaLista(texto: string, lista: readonly string[]): string {
  const t = texto.toLowerCase();
  return lista.find((x) => t.includes(x.toLowerCase())) ?? "";
}

function detectarTipo(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("estági") || t.includes("estagi")) return "Estágio";
  if (t.includes("freela")) return "Freelancer";
  if (t.includes("temporár") || t.includes("temporari")) return "Temporário";
  if (t.includes("meio período") || t.includes("meio periodo") || t.includes("meio-perí"))
    return "Meio período";
  if (t.includes("clt") || t.includes("carteira assinada") || t.includes("efetivo"))
    return "CLT";
  return "";
}

function detectarSalario(texto: string): string {
  const m = texto.match(/r\$\s?([\d.]+(?:,\d{2})?)/i);
  return m ? m[1] : "";
}

function detectarCategoria(texto: string): string {
  // Ordem por especificidade; usa limites de palavra para evitar falsos
  // positivos (ex.: "TI" dentro de "markeTIng").
  const t = texto.toLowerCase();
  if (/estági|estagi/.test(t)) return "Estágio";
  if (
    /desenvolvedor|programador|\bti\b|suporte t[ée]cnico|analista de sistemas|front-?end|back-?end|software/.test(
      t
    )
  )
    return "TI";
  if (/enfermag|\bsa[úu]de\b|cuidador|farm[áa]c|fisioterap|t[ée]cnico de enfermagem/.test(t))
    return "Saúde";
  if (/administrat|secret[áa]ri|financeiro|escrit[óo]ri/.test(t))
    return "Administrativo";
  if (/servi[çc]os gerais|limpeza|zelador|portaria|servente|jardineiro|faxin/.test(t))
    return "Serviços Gerais";
  if (/vendedor|vendas|caixa|\bloja\b|com[ée]rci|repositor|balconist/.test(t))
    return "Comércio";
  if (/recepc|atend|call center|telemarketing|\bsac\b/.test(t)) return "Atendimento";
  return "";
}

/** Lê o texto colado da vaga e tenta extrair os campos. */
export function parseTextoVaga(texto: string): VagaImportada {
  const limpo = texto.replace(/\r/g, "").trim();
  const linhas = limpo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const titulo = (linhas[0] ?? "").slice(0, 120);
  return {
    titulo,
    descricao: limpo,
    bairro: acharNaLista(limpo, BAIRROS),
    salario: detectarSalario(limpo),
    tipo: detectarTipo(limpo),
    categoria: detectarCategoria(limpo),
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function stripHtml(s: string): string {
  return decodeEntities(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapearEmploymentType(t: any): string {
  const x = String(t).toUpperCase();
  if (x.includes("INTERN")) return "Estágio";
  if (x.includes("PART_TIME")) return "Meio período";
  if (x.includes("TEMPORARY")) return "Temporário";
  if (x.includes("CONTRACTOR")) return "Freelancer";
  if (x.includes("FULL_TIME")) return "CLT";
  return "";
}

/** Melhor esforço: extrai a vaga do HTML (JSON-LD JobPosting ou OpenGraph). */
export function parseHtmlVaga(html: string): VagaImportada | null {
  const ldMatches = [
    ...html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    ),
  ];
  for (const m of ldMatches) {
    try {
      const json = JSON.parse(m[1].trim());
      const arr: any[] = Array.isArray(json)
        ? json
        : json["@graph"] ?? [json];
      const jp = arr.find(
        (x) =>
          x &&
          (x["@type"] === "JobPosting" ||
            (Array.isArray(x["@type"]) && x["@type"].includes("JobPosting")))
      );
      if (jp) {
        const desc = stripHtml(String(jp.description ?? ""));
        const addr = jp.jobLocation?.address ?? jp.jobLocation?.[0]?.address ?? {};
        const localidade = [addr.streetAddress, addr.addressLocality]
          .filter(Boolean)
          .join(" ");
        const sal = jp.baseSalary?.value?.value ?? jp.baseSalary?.value ?? "";
        const blob = `${jp.title ?? ""} ${desc} ${localidade}`;
        return {
          titulo: String(jp.title ?? "").slice(0, 120),
          descricao: desc,
          bairro: acharNaLista(blob, BAIRROS),
          salario: sal ? String(sal) : detectarSalario(desc),
          tipo: detectarTipo(blob) || mapearEmploymentType(jp.employmentType),
          categoria: detectarCategoria(blob),
        };
      }
    } catch {
      /* tenta o próximo bloco */
    }
  }

  const og = (p: string) =>
    html.match(
      new RegExp(`<meta[^>]+property="og:${p}"[^>]+content="([^"]*)"`, "i")
    )?.[1] ?? "";
  const ogTitle = limparTituloOlx(decodeEntities(og("title")));
  const ogDesc = stripHtml(og("description"));
  if (ogTitle || ogDesc) {
    const blob = `${ogTitle} ${ogDesc}`;
    return {
      titulo: ogTitle.slice(0, 120),
      descricao: ogDesc,
      bairro: acharNaLista(blob, BAIRROS),
      salario: detectarSalario(blob),
      tipo: detectarTipo(blob),
      categoria: detectarCategoria(blob),
    };
  }
  return null;
}

/** Remove o sufixo "| OLX - O Maior Site…" que o OLX adiciona ao título. */
function limparTituloOlx(t: string): string {
  return t.replace(/\s*[|\-–]\s*OLX.*$/i, "").trim();
}

/**
 * Heurística: o título parece genérico do OLX (homepage/listagem bloqueada)?
 * Não marca pelo simples "OLX" (anúncios reais às vezes terminam com "| OLX"),
 * só pelas assinaturas da home/listagem.
 */
export function tituloGenericoOlx(titulo: string): boolean {
  return /o maior site|compra e venda|^vagas de emprego em/i.test(titulo);
}
