import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Confirma o link de recuperação no servidor e grava a sessão nos cookies.
 * Aceita tanto o token_hash (recomendado para SSR) quanto o code PKCE.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // Esta rota é usada apenas para recuperação de senha. Não permite
  // redirecionamentos para domínios externos ou outros caminhos.
  const destinationPath =
    next === "/redefinir-senha" ? next : "/redefinir-senha";

  try {
    const supabase = await createClient();

    if (tokenHash && type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error) throw error;

      return NextResponse.redirect(
        new URL(destinationPath, requestUrl.origin)
      );
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      return NextResponse.redirect(
        new URL(destinationPath, requestUrl.origin)
      );
    }

    throw new Error("O link não contém um código de recuperação válido.");
  } catch {
    const destination = new URL("/login", requestUrl.origin);
    destination.searchParams.set("erro", "link-redefinicao");
    return NextResponse.redirect(destination);
  }
}
