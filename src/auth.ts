import NextAuth from "next-auth";
import { headers } from "next/headers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import {
  assertRateLimit,
  authRateLimits,
  buildRateLimitKey,
  getClientIpFromHeaders
} from "@/lib/rate-limit/limiter";
import { authService } from "@/services/auth/auth.service";
import { loginSchema } from "@/validators/auth.validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const requestHeaders = await headers();
        const ip = getClientIpFromHeaders(requestHeaders);

        assertRateLimit({
          key: buildRateLimitKey(["auth", "login", ip]),
          ...authRateLimits.login
        });

        return authService.authorizeCredentials(parsed.data);
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = profile?.email;
      const googleProfile = profile as
        | { email_verified?: boolean; picture?: string | null; sub?: string }
        | undefined;
      const providerAccountId = account.providerAccountId || googleProfile?.sub;

      if (!email || !providerAccountId) {
        return false;
      }

      await authService.handleGoogleSignIn({
        provider: account.provider,
        providerAccountId,
        email,
        name: profile?.name,
        image: googleProfile?.picture,
        emailVerified: Boolean(googleProfile?.email_verified)
      });

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user?.email) {
        const googleProfile = profile as
          | { email_verified?: boolean; sub?: string }
          | undefined;
        const providerAccountId = account?.providerAccountId || googleProfile?.sub;
        const sessionUser =
          account?.provider === "google" && providerAccountId
            ? await authService.handleGoogleSignIn({
                provider: account.provider,
                providerAccountId,
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: Boolean(googleProfile?.email_verified ?? true)
              })
            : await authService.getSessionUserByEmail(user.email);

        if (sessionUser) {
          token.id = sessionUser.id;
          token.username = sessionUser.username;
          token.roles = sessionUser.roles;
          token.picture = sessionUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.username = String(token.username);
        session.user.roles = Array.isArray(token.roles) ? token.roles : [];
        session.user.image = typeof token.picture === "string" ? token.picture : null;
      }

      return session;
    }
  }
});
