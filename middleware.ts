import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PERFIS_PERMITIDOS = [
  "administradora",
  "administrador",
  "secretaria",
  "fisioterapeuta",
  "profissional",
];

function redirecionarComCookies(
  responseAtual: NextResponse,
  destino: URL
) {
  const response = NextResponse.redirect(destino);

  // Preserva no redirecionamento os cookies que o Supabase renovou ou removeu.
  responseAtual.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const estaNaTelaLogin = pathname === "/login";

  // Sem as variáveis, não libera as páginas internas.
  if (!url || !anonKey) {
    if (estaNaTelaLogin) {
      return NextResponse.next();
    }

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "?erro=configuracao";
    return NextResponse.redirect(destino);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        items: {
          name: string;
          value: string;
          options?: Parameters<typeof supabaseResponse.cookies.set>[2];
        }[]
      ) {
        items.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        items.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser valida a sessão no servidor; não confiamos apenas em dados do navegador.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (estaNaTelaLogin) {
      return supabaseResponse;
    }

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    return redirecionarComCookies(supabaseResponse, destino);
  }

  // O usuário precisa ter um perfil ativo e autorizado no cadastro interno.
  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfis_usuarios")
    .select("ativo, perfil")
    .eq("id", user.id)
    .maybeSingle();

  const acessoAutorizado =
    !erroPerfil &&
    perfil?.ativo === true &&
    PERFIS_PERMITIDOS.includes(perfil.perfil);

  if (!acessoAutorizado) {
    // Encerra a sessão local para que uma conta sem autorização não permaneça logada.
    await supabase.auth.signOut({ scope: "local" });

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set("erro", "sem-permissao");

    return redirecionarComCookies(supabaseResponse, destino);
  }

  // Usuário já autenticado e autorizado não precisa visualizar o formulário de login.
  if (estaNaTelaLogin) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return redirecionarComCookies(supabaseResponse, destino);
  }

  // Todas as demais páginas do sistema só são entregues após a validação acima.
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
