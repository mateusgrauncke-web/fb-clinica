"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function solicitarRecuperacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setEnviado(false);

    try {
      const supabase = createClient();
      const retorno = new URL("/auth/confirm", window.location.origin);
      retorno.searchParams.set("next", "/redefinir-senha");

      const { error: recoveryError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: retorno.toString() }
        );

      if (recoveryError) {
        throw new Error(recoveryError.message);
      }

      setEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível solicitar a recuperação: ${err.message}`
          : "Não foi possível solicitar a recuperação. Tente novamente."
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

        <span className="eyebrow">RECUPERAÇÃO DE ACESSO</span>
        <h1>Esqueceu sua senha?</h1>
        <p className="login-intro">
          Informe o e-mail cadastrado. Enviaremos uma mensagem para você criar
          uma nova senha.
        </p>

        {error && (
          <div role="alert" className="login-error">
            {error}
          </div>
        )}

        {enviado ? (
          <div role="status" className="recovery-success">
            <strong>Solicitação enviada.</strong>
            <p>
              Confira a caixa de entrada e também a pasta de spam. Abra a
              mensagem mais recente de recuperação da FB Clínica.
            </p>
            <p className="recovery-email">{email.trim().toLowerCase()}</p>
            <p>
              Por segurança, o link é de uso único e pode expirar. Se não
              funcionar, solicite um novo link e utilize somente o e-mail mais
              recente.
            </p>
          </div>
        ) : (
          <form onSubmit={solicitarRecuperacao} className="login-form">
            <label>
              <span>E-mail cadastrado</span>
              <div className="login-field">
                <Mail size={18} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seuemail@clinica.com"
                />
              </div>
            </label>

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              <Send size={18} />
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}

        <Link className="login-back-link" href="/login">
          <ArrowLeft size={16} /> Voltar para o login
        </Link>
      </section>
    </main>
  );
}
