import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PERFIS_PERMITIDOS = [
  "administrador",
  "secretaria",
  "profissional",
  // Mantidos por compatibilidade caso existam usuários antigos com esses perfis.
  "administradora",
  "fisioterapeuta",
];

const ROTAS_PUBLICAS = new Set([
  "/login",
  "/recuperar-senha",
  "/redefinir-senha",
  "/auth/confirm",
]);

function redirecionarComCookies(
  respostaAtual: NextResponse,
  destino: URL
): NextResponse {
  const respostaRedirecionada = NextResponse.redirect(destino);

  respostaAtual.cookies.getAll().forEach((cookie) => {
    respostaRedirecionada.cookies.set(cookie);
  });

  return respostaRedirecionada;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const rotaPublica = ROTAS_PUBLICAS.has(pathname);
  const rotaDeRecuperacao =
    pathname === "/recuperar-senha" ||
    pathname === "/redefinir-senha" ||
    pathname === "/auth/confirm";

  if (!supabaseUrl || !supabaseAnonKey) {
    if (rotaPublica) return NextResponse.next();

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "?erro=configuracao";
    return NextResponse.redirect(destino);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Parameters<typeof supabaseResponse.cookies.set>[2];
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    if (rotaPublica) return supabaseResponse;

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`
    );
    return redirecionarComCookies(supabaseResponse, destino);
  }

  // O callback e as telas de recuperação precisam funcionar antes da validação
  // do perfil. A autorização normal será aplicada ao entrar no painel.
  if (rotaDeRecuperacao) return supabaseResponse;

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
    await supabase.auth.signOut({ scope: "local" });

    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    destino.searchParams.set("erro", "sem-permissao");
    return redirecionarComCookies(supabaseResponse, destino);
  }

  if (pathname === "/login") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return redirecionarComCookies(supabaseResponse, destino);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
