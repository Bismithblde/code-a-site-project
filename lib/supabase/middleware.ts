import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGE_PATHS = new Set(["/", "/login", "/register", "/signup"]);
const PUBLIC_PAGE_PREFIXES = ["/auth"];
const PUBLIC_API_PREFIXES = ["/api/auth"];

function isPublicPagePath(pathname: string) {
  if (PUBLIC_PAGE_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicApiPath(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicApiRoute = isPublicApiPath(pathname);
  const isPublicPageRoute = isPublicPagePath(pathname);

  // Refresh cookie-based session state for browser requests.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Backend protection: every API route except auth endpoints requires auth.
  if (isApiRoute && !isPublicApiRoute) {
    let authenticatedUser = user;

    // Allow token auth for API clients in addition to session cookies.
    if (!authenticatedUser) {
      const token = getBearerToken(request);
      if (token) {
        const {
          data: { user: tokenUser },
        } = await supabase.auth.getUser(token);
        authenticatedUser = tokenUser;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Frontend protection: only home + auth pages are publicly accessible.
  if (!isApiRoute && !isPublicPageRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Email verification check for tracker routes
  if (user && !user.email_confirmed_at && pathname.startsWith("/tracker")) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
