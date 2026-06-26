// Verifica que o consentimento LGPD é gravado na candidatura (Fase 4).
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SB_URL;
const KEY = process.env.SB_KEY;
const c = createClient(URL, KEY, { auth: { persistSession: false } });

const main = async () => {
  const login = await c.auth.signInWithPassword({
    email: "demo.maria@trampopb.test",
    password: "Demo123456",
  });
  if (login.error) throw new Error("login: " + login.error.message);
  const candidatoId = login.data.user.id;

  // Acha uma vaga da Loja Bessa Modas (empresa B).
  const { data: vagas } = await c
    .from("vagas")
    .select("id, empresa_nome")
    .eq("status", "ativa");
  const vaga = vagas.find((v) => v.empresa_nome === "Loja Bessa Modas");
  if (!vaga) throw new Error("vaga de teste não encontrada");

  // Já candidatou? Se não, candidata com consentimento (como o app faz).
  const existe = await c
    .from("candidaturas")
    .select("id")
    .eq("vaga_id", vaga.id)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  if (!existe.data) {
    const ins = await c.from("candidaturas").insert({
      vaga_id: vaga.id,
      candidato_id: candidatoId,
      status: "novo",
      snapshot_curriculo: { nome: "Maria Oliveira", area: "Atendimento", bairro: "Mangabeira", whatsapp: "(83) 99888-1122", email: "demo.maria@trampopb.test", sobre: "..." },
      consentimento_lgpd: true,
      consentimento_em: new Date().toISOString(),
    });
    if (ins.error) throw new Error("insert: " + ins.error.message);
  }

  // Lê de volta e confere o consentimento.
  const { data: cand } = await c
    .from("candidaturas")
    .select("consentimento_lgpd, consentimento_em")
    .eq("vaga_id", vaga.id)
    .eq("candidato_id", candidatoId)
    .single();

  const ok = cand.consentimento_lgpd === true && !!cand.consentimento_em;
  console.log(`${ok ? "✅" : "❌"} consentimento gravado: lgpd=${cand.consentimento_lgpd}, em=${cand.consentimento_em}`);
  process.exitCode = ok ? 0 : 1;
};

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
