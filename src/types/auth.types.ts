import type { UserType } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  profilePhotoUrl: string | null;
  roles: UserType[];
};

export type SignupInput = {
  email: string;
  password: string;
  username: string;
  name: string;
  roles?: UserType[];
};

export type LoginInput = {
  email: string;
  password: string;
};

export type GoogleProfileInput = {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
};

export type PasswordResetRequestInput = {
  email: string;
};

export type PasswordResetInput = {
  token: string;
  password: string;
};
