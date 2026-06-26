import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

/** Papéis de conta. O papel fica no user_metadata do usuário de auth. */
export type Papel = "candidato" | "empresa";

export interface PerfilSessao {
  id: string;
  email: string;
  papel: Papel | null;
  nome: string;
}

/** Extrai um perfil simples a partir do usuário do Supabase. */
export function perfilDoUsuario(user: User | null): PerfilSessao | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    papel: (meta.papel as Papel) ?? null,
    nome: (meta.nome as string) ?? "",
  };
}

/** Mensagens de erro do Supabase em português, para o público local. */
export function traduzErroAuth(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Já existe uma conta com este e-mail.";
  if (m.includes("password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (m.includes("unable to validate email")) return "E-mail inválido.";
  if (m.includes("for security purposes"))
    return "Muitas tentativas. Aguarde alguns segundos e tente de novo.";
  return msg;
}

class ErroPapel extends Error {}

/** Cadastro de candidato (papel + nome no metadata). */
export async function cadastrarCandidato(args: {
  email: string;
  senha: string;
  nome: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: args.email,
    password: args.senha,
    options: { data: { papel: "candidato", nome: args.nome } },
  });
  if (error) throw new Error(traduzErroAuth(error.message));
  return data;
}

/** Cadastro de empresa (papel + nome da empresa no metadata). */
export async function cadastrarEmpresa(args: {
  email: string;
  senha: string;
  nome: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: args.email,
    password: args.senha,
    options: { data: { papel: "empresa", nome: args.nome } },
  });
  if (error) throw new Error(traduzErroAuth(error.message));
  return data;
}

/**
 * Login exigindo um papel específico. Se a conta for do outro papel,
 * desfaz o login e avisa — mantém candidato e empresa separados.
 */
export async function entrarComoPapel(args: {
  email: string;
  senha: string;
  papelEsperado: Papel;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.senha,
  });
  if (error) throw new Error(traduzErroAuth(error.message));

  const papel = (data.user?.user_metadata?.papel as Papel) ?? null;
  if (papel && papel !== args.papelEsperado) {
    await supabase.auth.signOut();
    throw new ErroPapel(
      args.papelEsperado === "candidato"
        ? "Esta conta é de empresa. Use a entrada de empresa."
        : "Esta conta é de candidato. Use a entrada de candidato."
    );
  }
  return data;
}

/** Encerra a sessão atual. */
export async function sair() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/** Envia e-mail de recuperação de senha. */
export async function recuperarSenha(email: string) {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/redefinir-senha`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(traduzErroAuth(error.message));
}

/** Define uma nova senha (usado na tela de redefinição após o link do e-mail). */
export async function definirNovaSenha(novaSenha: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(traduzErroAuth(error.message));
}
