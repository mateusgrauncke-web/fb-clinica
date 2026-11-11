import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  if (!url || !key) {
    if (pathname === "/login") return response;
    return NextResponse.redirect(new URL("/login?erro=configuracao", request.url));
  }
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (pathname === "/login") {
    if (!error && user) {
      const { data: profile } = await supabase.from("perfis_usuarios")
        .select("ativo,perfil").eq("id", user.id).maybeSingle();
      if (profile?.ativo && ["administradora", "administrador", "secretaria", "fisioterapeuta", "profissional"].includes(profile.perfil))
        return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }
  if (error || !user) return NextResponse.redirect(new URL("/login", request.url));
  const { data: profile, error: profileError } = await supabase.from("perfis_usuarios")
    .select("ativo,perfil").eq("id", user.id).maybeSingle();
  if (profileError || !profile?.ativo || !["administradora", "administrador", "secretaria", "fisioterapeuta", "profissional"].includes(profile.perfil))
    return NextResponse.redirect(new URL("/login?erro=sem-permissao", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|logo-fb.png|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)"] };
