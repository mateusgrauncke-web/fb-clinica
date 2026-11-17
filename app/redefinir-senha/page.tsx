"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Estado = "verificando" | "valido" | "invalido" | "salvo";

export default function RedefinirSenhaPage() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensagem, setMensagem] = useState(
    "Validando o link de recuperação..."
  );
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarSessaoDeRecuperacao() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          throw new Error(
            "Não foi possível validar o link. Ele pode ter expirado ou já ter sido usado. Solicite uma nova recuperação e abra o e-mail mais recente."
          );
        }

        if (ativo) {
          setEstado("valido");
          setMensagem("Crie e confirme sua nova senha para acessar a FB Clínica.");
        }
      } catch (err) {
        if (ativo) {
          setEstado("invalido");
          setMensagem(
            err instanceof Error
              ? err.message
              : "Não foi possível validar o link de recuperação."
          );
        }
      }
    }

    void verificarSessaoDeRecuperacao();

    return () => {
      ativo = false;
    };
  }, []);

  async function salvarNovaSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (senha.length < 8) {
      setMensagem("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setMensagem("As duas senhas digitadas não são iguais.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error(
          "Sua sessão de recuperação expirou. Solicite um novo link."
        );
      }

      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;

      await supabase.auth.signOut({ scope: "local" });
      setSenha("");
      setConfirmacao("");
      setEstado("salvo");
      setMensagem("Senha alterada com sucesso. Agora entre usando sua nova senha.");
    } catch (err) {
      setMensagem(
        err instanceof Error
          ? `Não foi possível alterar a senha: ${err.message}`
          : "Não foi possível alterar a senha. Solicite um novo link."
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

        <span className="eyebrow">SEGURANÇA DA CONTA</span>
        <h1>Redefinir senha</h1>

        <div
          role={estado === "invalido" ? "alert" : "status"}
          className={estado === "invalido" ? "login-error" : "recovery-message"}
        >
          {mensagem}
        </div>

        {estado === "verificando" && (
          <p className="login-footnote">
            Aguarde enquanto validamos seu acesso.
          </p>
        )}

        {estado === "valido" && (
          <form onSubmit={salvarNovaSenha} className="login-form">
            <label>
              <span>Nova senha</span>
              <div className="login-field">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                />
              </div>
            </label>

            <label>
              <span>Confirme a nova senha</span>
              <div className="login-field">
                <KeyRound size={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  placeholder="Digite a senha novamente"
                />
              </div>
            </label>

            <button
              className="primary-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {estado === "invalido" && (
          <Link className="primary-button recovery-action" href="/recuperar-senha">
            Solicitar outro link
          </Link>
        )}

        {estado === "salvo" && (
          <Link
            className="primary-button recovery-action"
            href="/login?senha-redefinida=1"
          >
            Ir para o login
          </Link>
        )}

        {estado !== "salvo" && (
          <Link className="login-back-link" href="/login">
            <ArrowLeft size={16} /> Voltar para o login
          </Link>
        )}
      </section>
    </main>
  );
}
