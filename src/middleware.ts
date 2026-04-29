import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    // 0. Admin Login Logic
    if (path === "/admin/login") {
        if (token && role === "admin") return NextResponse.redirect(new URL("/admin", req.url));
        if (token && role !== "admin") return NextResponse.redirect(new URL(role === "artist" ? "/artist" : "/dashboard", req.url));
        return NextResponse.next();
    }

    if (!token && path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // If no token and trying to access protected routes
    if (!token && (path.startsWith("/artist") || path.startsWith("/dashboard"))) {
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
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const isDashboardRoute = path.startsWith("/artist") || path.startsWith("/dashboard");
        
        // Let the main middleware handle /admin routes to allow redirects to /admin/login
        if (path.startsWith("/admin")) {
            return true;
        }

        if (isDashboardRoute) {
            return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login",
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
