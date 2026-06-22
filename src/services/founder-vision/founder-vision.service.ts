import { AppError } from "@/lib/errors/app-error";
import {
  founderVisionRepository,
  type FounderVisionRepository
} from "@/repositories/founder-vision.repository";
import type {
  FounderVisionCompatibility,
  FounderVisionInput
} from "@/types/founder-vision.types";

type FounderVisionRecord = NonNullable<Awaited<ReturnType<FounderVisionRepository["findByUserId"]>>>;

type FounderVisionServiceDeps = {
  founderVisions?: FounderVisionRepository;
};

type CompatibilityField = {
  name: string;
  weight: number;
  source: unknown;
  target: unknown;
  matches?: (source: unknown, target: unknown) => boolean;
};

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function valuesMatch(source: unknown, target: unknown) {
  return normalizeText(source) === normalizeText(target);
}

function teamSizeMatches(source: unknown, target: unknown) {
  return typeof source === "number" && typeof target === "number" && Math.abs(source - target) <= 1;
}

export class FounderVisionService {
  private readonly founderVisions: FounderVisionRepository;

  constructor(deps: FounderVisionServiceDeps = {}) {
    this.founderVisions = deps.founderVisions ?? founderVisionRepository;
  }

  async getMyVision(userId: string) {
    const vision = await this.founderVisions.findByUserId(userId);

    if (!vision) {
      throw new AppError("NOT_FOUND", "Founder vision not found.", 404);
    }

    return vision;
  }

  async createVision(userId: string, input: FounderVisionInput) {
    await this.ensureActiveUser(userId);

    const exists = await this.founderVisions.existsByUserId(userId);

    if (exists) {
      throw new AppError("CONFLICT", "Founder vision already exists.", 409);
    }

    return this.founderVisions.create(userId, input);
  }

  async updateVision(userId: string, input: FounderVisionInput) {
    await this.ensureActiveUser(userId);

    const vision = await this.founderVisions.update(userId, input);

    if (!vision) {
      throw new AppError("NOT_FOUND", "Founder vision not found.", 404);
    }

    return vision;
  }

  async deleteVision(userId: string) {
    await this.ensureActiveUser(userId);

    const deleted = await this.founderVisions.delete(userId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Founder vision not found.", 404);
    }

    return { deleted: true as const };
  }

  async calculateCompatibilityForUsers(userId: string, targetUserId: string) {
    const [source, target] = await Promise.all([
      this.founderVisions.findByUserId(userId),
      this.founderVisions.findByUserId(targetUserId)
    ]);

    if (!source || !target) {
      throw new AppError("NOT_FOUND", "Founder vision not found.", 404);
    }

    return this.calculateCompatibility(source, target);
  }

  calculateCompatibility(
    source: FounderVisionRecord,
    target: FounderVisionRecord
  ): FounderVisionCompatibility {
    const fields: CompatibilityField[] = [
      { name: "startupGoal", weight: 20, source: source.startupGoal, target: target.startupGoal },
      { name: "fundingPreference", weight: 15, source: source.fundingPreference, target: target.fundingPreference },
      { name: "riskAppetite", weight: 15, source: source.riskAppetite, target: target.riskAppetite },
      { name: "commitmentLevel", weight: 15, source: source.commitmentLevel, target: target.commitmentLevel },
      { name: "workStyle", weight: 15, source: source.workStyle, target: target.workStyle },
      {
        name: "preferredTeamSize",
        weight: 10,
        source: source.preferredTeamSize,
        target: target.preferredTeamSize,
        matches: teamSizeMatches
      },
      {
        name: "preferredCoFounderType",
        weight: 5,
        source: source.preferredCoFounderType,
        target: target.preferredCoFounderType
      },
      { name: "remotePreference", weight: 5, source: source.remotePreference, target: target.remotePreference }
    ];

    const matchedFields: string[] = [];
    const mismatchedFields: string[] = [];
    const missingFields: string[] = [];
    let score = 0;

    for (const field of fields) {
      if (!hasValue(field.source) || !hasValue(field.target)) {
        missingFields.push(field.name);
        continue;
      }

      const matches = field.matches ?? valuesMatch;

      if (matches(field.source, field.target)) {
        matchedFields.push(field.name);
        score += field.weight;
      } else {
        mismatchedFields.push(field.name);
      }
    }

    return {
      score,
      matchedFields,
      mismatchedFields,
      missingFields
    };
  }

  private async ensureActiveUser(userId: string) {
    const user = await this.founderVisions.findActiveUserById(userId);

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }
  }
}

export const founderVisionService = new FounderVisionService();
