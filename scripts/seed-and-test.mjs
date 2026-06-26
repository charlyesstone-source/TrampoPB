// Semeia dados de demonstração e TESTA a RLS de ponta a ponta.
// Usa só a chave pública (anon/publishable) + contas reais — o mesmo caminho do app.
//
// Uso (PowerShell):
//   $env:SB_URL='https://...supabase.co'; $env:SB_KEY='sb_publishable_...'; node scripts/seed-and-test.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SB_URL;
const KEY = process.env.SB_KEY;
if (!URL || !KEY) {
  console.error("Defina SB_URL e SB_KEY.");
  process.exit(1);
}

const cliente = () =>
  createClient(URL, KEY, { auth: { persistSession: false } });

let falhas = 0;
function checa(desc, ok) {
  console.log(`${ok ? "✅" : "❌"} ${desc}`);
  if (!ok) falhas++;
}

/** Garante a conta (cadastra; se já existe, entra). Retorna client autenticado + id. */
async function conta(email, senha, papel, nome) {
  const c = cliente();
  const { data, error } = await c.auth.signUp({
    email,
    password: senha,
    options: { data: { papel, nome } },
  });
  if (error && /already/i.test(error.message)) {
    const r = await c.auth.signInWithPassword({ email, password: senha });
    return { c, id: r.data.user.id };
  }
  if (error) throw new Error(`${email}: ${error.message}`);
  return { c, id: data.user.id };
}

async function publicarVaga(c, empresaId, v) {
  const agora = new Date();
  const expira = new Date(agora.getTime() + 15 * 86400000);
  const { data, error } = await c
    .from("vagas")
    .insert({
      empresa_id: empresaId,
      empresa_nome: v.empresa,
      titulo: v.titulo,
      bairro: v.bairro,
      salario: v.salario,
      tipo: v.tipo,
      categoria: v.categoria,
      descricao: v.descricao,
      requisitos: v.requisitos,
      beneficios: v.beneficios ?? [],
      email_contato: v.email,
      whatsapp_contato: v.whats,
      status: "ativa",
      data_publicacao: agora.toISOString(),
      data_expiracao: expira.toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error("publicar: " + error.message);
  return data.id;
}

const main = async () => {
  // 1) Empresa A (demo) + vagas
  const A = await conta("demo.padaria@trampopb.test", "Demo123456", "empresa", "Padaria Pão Nosso");
  const B = await conta("demo.loja@trampopb.test", "Demo123456", "empresa", "Loja Bessa Modas");
  const M = await conta("demo.maria@trampopb.test", "Demo123456", "candidato", "Maria Oliveira");

  // Preenche o currículo da candidata (na tabela candidatos)
  await M.c.from("candidatos").update({
    whatsapp: "(83) 99888-1122",
    area: "Atendimento",
    bairro: "Mangabeira",
    sobre: "Experiência em atendimento e caixa.",
    experiencia: "Atendente em padaria (2 anos)",
  }).eq("id", M.id);

  const vagaA = await publicarVaga(A.c, A.id, {
    empresa: "Padaria Pão Nosso", titulo: "Atendente de balcão", bairro: "Bessa",
    salario: "1.500", tipo: "CLT", categoria: "Atendimento",
    descricao: "Atendimento no balcão da padaria, organização e vendas.",
    requisitos: ["Ensino médio", "Boa comunicação"], beneficios: ["Vale-transporte"],
    email: "rh@paonosso.com", whats: "(83) 3232-0000",
  });
  await publicarVaga(A.c, A.id, {
    empresa: "Padaria Pão Nosso", titulo: "Padeiro(a)", bairro: "Bessa",
    salario: "1.800", tipo: "CLT", categoria: "Serviços Gerais",
    descricao: "Produção de pães e confeitaria pela manhã.",
    requisitos: ["Experiência como padeiro"], beneficios: ["Vale-alimentação"],
    email: "rh@paonosso.com", whats: "(83) 3232-0000",
  });
  const vagaB = await publicarVaga(B.c, B.id, {
    empresa: "Loja Bessa Modas", titulo: "Vendedor(a)", bairro: "Manaíra",
    salario: "1.412 + comissão", tipo: "CLT", categoria: "Comércio",
    descricao: "Vendas em loja de roupas no shopping.",
    requisitos: ["Experiência com vendas"], beneficios: ["Comissão"],
    email: "rh@bessamodas.com", whats: "(83) 3030-1111",
  });

  // 2) Candidata se candidata à vaga da empresa A
  const snap = { nome: "Maria Oliveira", area: "Atendimento", bairro: "Mangabeira",
    whatsapp: "(83) 99888-1122", email: "demo.maria@trampopb.test", sobre: "Experiência em atendimento e caixa." };
  const ap = await M.c.from("candidaturas").insert({
    vaga_id: vagaA, candidato_id: M.id, status: "novo", snapshot_curriculo: snap,
  });
  checa("candidato consegue se candidatar (insert RLS)", !ap.error);

  // 3) Leitura pública das vagas ativas
  const anon = cliente();
  const pub = await anon.from("vagas").select("id").eq("status", "ativa");
  checa("anônimo lê vagas ativas", !pub.error && pub.data.length >= 3);

  // 4) RLS de candidaturas: empresa A vê a sua; empresa B NÃO vê nada
  const candA = await A.c.from("candidaturas").select("id, vaga_id");
  checa("empresa A vê a candidatura da sua vaga", !candA.error && candA.data.length === 1);
  const candB = await B.c.from("candidaturas").select("id, vaga_id");
  checa("empresa B NÃO vê candidaturas de outra empresa (isolamento)", !candB.error && candB.data.length === 0);

  // 5) Empresa B não consegue ler a vaga da A como dona — mas vê como pública (ativa). Testa update cruzado:
  const tentativa = await B.c.from("vagas").update({ titulo: "HACK" }).eq("id", vagaA).select("id");
  checa("empresa B NÃO consegue editar vaga da empresa A", (tentativa.data?.length ?? 0) === 0);

  // 6) Métrica: marca contratado e confere o total público
  await A.c.from("candidaturas").update({ status: "contratado" }).eq("vaga_id", vagaA);
  const { data: total } = await anon.rpc("total_contratados");
  checa("total_contratados reflete o status real", total >= 1);

  console.log(`\n${falhas === 0 ? "TODOS OS TESTES PASSARAM ✅" : falhas + " FALHA(S) ❌"}`);
  console.log(`Vagas semeadas: A(${vagaA},+1) B(${vagaB}). Candidata: Maria Oliveira.`);
  process.exitCode = falhas === 0 ? 0 : 1;
};

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
