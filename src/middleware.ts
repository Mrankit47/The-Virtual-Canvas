import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    // If no token and trying to access protected routes (this shouldn't happen with authorized callback but safety first)
    if (!token && (path.startsWith("/admin") || path.startsWith("/artist") || path.startsWith("/dashboard"))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 1. Admin Protection
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(role === "artist" ? "/artist" : "/dashboard", req.url));
    }

    // 2. Artist Protection
    if (path.startsWith("/artist") && role !== "artist") {
      return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", req.url));
    }

    // 3. User Dashboard Protection
    if (path.startsWith("/dashboard") && role !== "user") {
      return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/artist", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Logic: Only block if it's a dashboard route and no token
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const isDashboardRoute = path.startsWith("/admin") || path.startsWith("/artist") || path.startsWith("/dashboard");
        
        if (isDashboardRoute) {
            return !!token;
        }
        return true; // Allow all other routes (Landing page, Gallery, etc.)
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/artist/:path*",
  ],
};
