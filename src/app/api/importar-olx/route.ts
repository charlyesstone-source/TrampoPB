import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parseHtmlVaga,
  parseTextoVaga,
  tituloGenericoOlx,
} from "@/lib/importar-vaga";

const execFileP = promisify(execFile);

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Busca o HTML da página. O OLX (Cloudflare) bloqueia o fetch do Node pela
 * impressão digital de TLS, mas aceita o `curl` do sistema — então tentamos
 * o curl primeiro e caímos no fetch como reserva.
 */
async function buscarHtml(url: string): Promise<string | null> {
  // 1) curl do sistema (passa pelo Cloudflare na maioria dos casos).
  try {
    const { stdout } = await execFileP(
      "curl",
      [
        "-sL",
        "--compressed",
        "--max-time",
        "15",
        "-A",
        UA,
        "-H",
        "Accept-Language: pt-BR,pt;q=0.9",
        "-H",
        "Referer: https://www.google.com/",
        url,
      ],
      { maxBuffer: 12 * 1024 * 1024 }
    );
    if (stdout && stdout.length > 800) return stdout;
  } catch {
    /* curl indisponível ou falhou — tenta o fetch */
  }

  // 2) fetch do Node (pode ser bloqueado pelo Cloudflare).
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
      redirect: "follow",
    });
    if (res.ok) return await res.text();
  } catch {
    /* bloqueado */
  }
  return null;
}

export async function POST(req: Request) {
  let body: { url?: string; texto?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, erro: "Requisição inválida." }, { status: 400 });
  }

  // 1) Texto colado — sempre funciona.
  if (body.texto && body.texto.trim().length > 0) {
    return Response.json({ ok: true, vaga: parseTextoVaga(body.texto) });
  }

  // 2) Link — busca a página (curl → fetch) e extrai.
  const url = (body.url ?? "").trim();
  if (!/^https?:\/\/[^ ]+/i.test(url)) {
    return Response.json(
      { ok: false, erro: "Cole um link válido ou o texto da vaga." },
      { status: 400 }
    );
  }

  const html = await buscarHtml(url);
  if (!html) return Response.json({ ok: false, bloqueado: true });

  const vaga = parseHtmlVaga(html);
  if (!vaga || !vaga.titulo || tituloGenericoOlx(vaga.titulo)) {
    return Response.json({ ok: false, bloqueado: true });
  }
  return Response.json({ ok: true, vaga });
}
