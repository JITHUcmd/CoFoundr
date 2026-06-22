import { AppError } from "@/lib/errors/app-error";
import {
  startupRepository,
  type StartupRepository
} from "@/repositories/startup.repository";
import type {
  CreateStartupInput,
  StartupInput,
  StartupMemberInput,
  StartupVerificationRequestInput
} from "@/types/startup.types";

type StartupServiceDeps = {
  startups?: StartupRepository;
};

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export class StartupService {
  private readonly startups: StartupRepository;

  constructor(deps: StartupServiceDeps = {}) {
    this.startups = deps.startups ?? startupRepository;
  }

  async createStartup(ownerId: string, input: CreateStartupInput) {
    await this.ensureActiveUser(ownerId);
    const slug = normalizeSlug(input.slug);

    if (await this.startups.slugExists(slug)) {
      throw new AppError("CONFLICT", "Startup slug is already taken.", 409);
    }

    return this.startups.create(ownerId, {
      ...input,
      slug
    });
  }

  async getPublicStartup(slug: string) {
    const startup = await this.startups.findPublicBySlug(normalizeSlug(slug));

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return startup;
  }

  async getPrivateStartup(userId: string, startupId: string) {
    await this.ensureOwner(startupId, userId);
    const startup = await this.startups.findPrivateById(startupId);

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return startup;
  }

  async updateStartup(userId: string, startupId: string, input: StartupInput) {
    await this.ensureOwner(startupId, userId);

    const nextInput = {
      ...input,
      slug: input.slug ? normalizeSlug(input.slug) : undefined
    };

    if (nextInput.slug && await this.startups.slugExists(nextInput.slug, startupId)) {
      throw new AppError("CONFLICT", "Startup slug is already taken.", 409);
    }

    const startup = await this.startups.update(startupId, nextInput);

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return startup;
  }

  async deleteStartup(userId: string, startupId: string) {
    await this.ensureOwner(startupId, userId);
    const deleted = await this.startups.softDelete(startupId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return { deleted: true as const };
  }

  async addMember(ownerId: string, startupId: string, input: StartupMemberInput) {
    await this.ensureOwner(startupId, ownerId);
    await this.ensureActiveUser(input.userId);
    return this.startups.addMember(startupId, input);
  }

  async updateMember(ownerId: string, startupId: string, memberId: string, input: Omit<StartupMemberInput, "userId">) {
    await this.ensureOwner(startupId, ownerId);
    const member = await this.startups.updateMember(startupId, memberId, input);

    if (!member) {
      throw new AppError("NOT_FOUND", "Startup member not found.", 404);
    }

    return member;
  }

  async removeMember(ownerId: string, startupId: string, memberId: string) {
    await this.ensureOwner(startupId, ownerId);
    const member = await this.startups.findMemberById(startupId, memberId);

    if (!member) {
      throw new AppError("NOT_FOUND", "Startup member not found.", 404);
    }

    if (member.userId === ownerId) {
      throw new AppError("FORBIDDEN", "Transfer ownership before removing the owner.", 403);
    }

    const removed = await this.startups.removeMember(startupId, memberId);

    if (!removed) {
      throw new AppError("NOT_FOUND", "Startup member not found.", 404);
    }

    return { removed: true as const };
  }

  async transferOwnership(ownerId: string, startupId: string, newOwnerId: string) {
    await this.ensureOwner(startupId, ownerId);
    await this.ensureActiveUser(newOwnerId);

    if (ownerId === newOwnerId) {
      throw new AppError("VALIDATION_ERROR", "New owner must be different from the current owner.", 400);
    }

    const startup = await this.startups.transferOwnership(startupId, newOwnerId);

    if (!startup) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return startup;
  }

  async incrementView(startupId: string, actorUserId?: string | null) {
    await this.startups.incrementView(startupId, actorUserId);
    return { incremented: true as const };
  }

  async incrementPublicView(slug: string, actorUserId?: string | null) {
    const incremented = await this.startups.incrementViewBySlug(normalizeSlug(slug), actorUserId);

    if (!incremented) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return { incremented: true as const };
  }

  async getAnalytics(ownerId: string, startupId: string) {
    await this.ensureOwner(startupId, ownerId);
    const analytics = await this.startups.getAnalytics(startupId);

    if (!analytics) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return analytics;
  }

  async requestVerification(ownerId: string, startupId: string, input: StartupVerificationRequestInput) {
    await this.ensureOwner(startupId, ownerId);
    const status = await this.startups.requestVerification(startupId, ownerId, input);

    if (!status) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return {
      status: status.verificationStatus,
      notes: status.verificationNotes
    };
  }

  async getVerificationStatus(ownerId: string, startupId: string) {
    await this.ensureOwner(startupId, ownerId);
    const status = await this.startups.getVerificationStatus(startupId);

    if (!status) {
      throw new AppError("NOT_FOUND", "Startup not found.", 404);
    }

    return {
      status: status.verificationStatus,
      notes: status.verificationNotes
    };
  }

  private async ensureOwner(startupId: string, userId: string) {
    if (!await this.startups.isOwner(startupId, userId)) {
      throw new AppError("FORBIDDEN", "Only the startup owner can perform this action.", 403);
    }
  }

  private async ensureActiveUser(userId: string) {
    const user = await this.startups.findActiveUserById(userId);

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }
  }
}

export const startupService = new StartupService();
