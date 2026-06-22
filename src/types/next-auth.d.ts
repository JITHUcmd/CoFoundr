import type { UserType } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      roles: UserType[];
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    roles?: UserType[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    roles?: UserType[];
  }
}
