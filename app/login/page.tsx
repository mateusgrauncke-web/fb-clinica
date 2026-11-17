"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LockKeyhole, Mail, LogIn } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const warning =
    params.get("erro") === "sem-permissao"
      ? "Sua conta não está habilitada para acessar a clínica. Contate a administradora."
      : params.get("erro") === "configuracao"
        ? "Configuração do sistema incompleta. Contate a administradora."
        : params.get("erro") === "link-redefinicao"
          ? "O link de recuperação não é válido ou expirou. Solicite um novo link."
          : "";

  const success =
    params.get("senha-redefinida") === "1"
      ? "Senha alterada com sucesso. Entre com sua nova senha."
      : "";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError || !data.user) {
        if (/invalid login credentials/i.test(loginError?.message ?? "")) {
          throw new Error(
            "E-mail ou senha incorretos. Use ‘Esqueci minha senha’ para criar uma nova senha."
          );
        }
        if (/email not confirmed/i.test(loginError?.message ?? "")) {
          throw new Error("O e-mail desta conta ainda não foi confirmado.");
        }
        throw new Error(
          loginError?.message ?? "Não foi possível autenticar este usuário."
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from("perfis_usuarios")
        .select("ativo, perfil")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error(
          "A senha foi aceita, mas não foi possível validar o perfil de acesso. Verifique as permissões da tabela perfis_usuarios."
        );
      }

      const perfisPermitidos = [
        "administrador",
        "secretaria",
        "profissional",
        "administradora",
        "fisioterapeuta",
      ];

      if (
        !profile ||
        profile.ativo !== true ||
        !perfisPermitidos.includes(profile.perfil)
      ) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error(
          "A senha foi aceita, mas esta conta não possui um perfil ativo autorizado."
        );
      }

      const requestedPath = params.get("next");
      const safePath =
        requestedPath &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("//")
          ? requestedPath
          : "/";

      router.replace(safePath);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar no sistema."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <Image
          src="/logo-fb.png"
          alt="Fabiana Bruinsma Pilates e Fisioterapia"
          width={260}
          height={150}
          className="login-logo"
          priority
        />

        <span className="eyebrow">ACESSO INTERNO</span>
        <h1>Bem-vinda à FB Clínica</h1>
        <p className="login-intro">
          Entre com seu acesso da equipe para gerenciar pacientes, agenda e atendimentos.
        </p>

        {error && (
          <div role="alert" className="login-error">
            {error}
          </div>
        )}
        {!error && warning && (
          <div role="alert" className="login-error">
            {warning}
          </div>
        )}
        {!error && !warning && success && (
          <div role="status" className="notice success">
            {success}
          </div>
        )}

        <form onSubmit={signIn} className="login-form">
          <label>
            <span>E-mail</span>
            <div className="login-field">
              <Mail size={18} />
              <input
                type="email"
                required
                autoComplete="username"
                autoCapitalize="none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@clinica.com"
              />
            </div>
          </label>

          <label>
            <span>Senha</span>
            <div className="login-field">
              <LockKeyhole size={18} />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
              />
            </div>
          </label>

          <div className="login-forgot-row">
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
          </div>

          <button
            className="primary-button login-submit"
            type="submit"
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? "Entrando..." : "Entrar no sistema"}
          </button>
        </form>

        <p className="login-footnote">
          Acesso exclusivo à equipe autorizada. Não há cadastro público.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-screen">Carregando...</main>}>
      <LoginFormContent />
    </Suspense>
  );
}
