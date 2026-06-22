import { NextResponse } from "next/server";
import { middlewareAuth } from "@/auth.middleware";

const protectedRoutePrefixes = ["/dashboard", "/discover", "/matches", "/messages", "/notifications", "/analytics", "/settings"];
const authRoutePrefixes = ["/login", "/signup"];

export default middlewareAuth((request) => {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth?.user);
  const isProtectedRoute = protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authRoutePrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|docs).*)"]
};
