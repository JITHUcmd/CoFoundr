import type { UserType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AuthUser } from "@/types/auth.types";

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  username: true,
  profilePhotoUrl: true,
  roles: {
    select: {
      type: true
    }
  }
} as const;

type SelectedAuthUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  profilePhotoUrl: string | null;
  roles: Array<{ type: UserType }>;
};

function toAuthUser(user: SelectedAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    profilePhotoUrl: user.profilePhotoUrl,
    roles: user.roles.map((role) => role.type)
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export class UserRepository {
  async findAuthUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: authUserSelect
    });

    return user ? toAuthUser(user) : null;
  }

  async findAuthUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: authUserSelect
    });

    return user ? toAuthUser(user) : null;
  }

  async usernameExists(username: string) {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizeUsername(username),
          mode: "insensitive"
        }
      },
      select: { id: true }
    });

    return Boolean(user);
  }

  async emailExists(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true }
    });

    return Boolean(user);
  }

  async createAuthUser(input: {
    email: string;
    username: string;
    name: string;
    profilePhotoUrl?: string | null;
    roles: UserType[];
  }) {
    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(input.email),
        username: normalizeUsername(input.username),
        name: input.name,
        profilePhotoUrl: input.profilePhotoUrl,
        roles: {
          create: input.roles.map((type) => ({ type }))
        }
      },
      select: authUserSelect
    });

    return toAuthUser(user);
  }

}

export const userRepository = new UserRepository();
