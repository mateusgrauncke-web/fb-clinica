"use client";

import Image from "next/image";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Mail, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const warning = params.get("erro") === "sem-permissao"
    ? "Sua conta não está habilitada para acessar a clínica. Contate a administradora."
    : params.get("erro") === "configuracao"
      ? "Configuração do sistema incompleta. Contate a administradora."
      : "";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError || !data.user) throw new Error("E-mail ou senha inválidos.");
      const { data: profile, error: profileError } = await supabase.from("perfis_usuarios")
        .select("ativo,perfil").eq("id", data.user.id).maybeSingle();
      if (profileError || !profile?.ativo || !["administradora", "administrador", "secretaria", "fisioterapeuta", "profissional"].includes(profile.perfil)) {
        await supabase.auth.signOut();
        throw new Error("Seu acesso ainda não foi autorizado pela administradora.");
      }
      router.replace("/");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setLoading(false); }
  }

  return <main className="login-screen"><section className="login-card">
    <Image src="/logo-fb.png" alt="Fabiana Bruinsma Pilates & Fisioterapia" width={260} height={150} className="login-logo" priority />
    <span className="eyebrow">ACESSO INTERNO</span><h1>Bem-vinda à FB Clínica</h1>
    <p className="login-intro">Entre com seu acesso da equipe para gerenciar pacientes, agenda e atendimentos.</p>
    {(error || warning) && <div role="alert" className="login-error">{error || warning}</div>}
    <form onSubmit={signIn} className="login-form">
      <label><span>E-mail</span><div className="login-field"><Mail size={18}/><input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="seuemail@clinica.com" /></div></label>
      <label><span>Senha</span><div className="login-field"><LockKeyhole size={18}/><input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" /></div></label>
      <button className="primary-button login-submit" type="submit" disabled={loading}><LogIn size={18}/>{loading ? "Entrando..." : "Entrar no sistema"}</button>
    </form><p className="login-footnote">Acesso exclusivo à equipe autorizada. Não há cadastro público.</p>
  </section></main>;
}

function LoginForm() { return <Suspense fallback={<main className="login-screen"/>}><LoginForm/></Suspense>; }

export default function LoginPage() { return <Suspense fallback={<main className="login-screen">Carregando...</main>}><LoginForm /></Suspense>; }
