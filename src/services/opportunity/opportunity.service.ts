import type { OpportunityStatus } from "@prisma/client";
import { AppError } from "@/lib/errors/app-error";
import {
  opportunityRepository,
  type OpportunityRepository
} from "@/repositories/opportunity.repository";
import { matchService, type MatchService } from "@/services/matching/match.service";
import {
  notificationEvents,
  type NotificationEventsService
} from "@/services/notifications/notification-events.service";
import type {
  CreateOpportunityInput,
  OpportunityApplicationInput,
  OpportunityInput,
  OpportunityReviewInput
} from "@/types/opportunity.types";

type OpportunityServiceDeps = {
  opportunities?: OpportunityRepository;
  matches?: Pick<MatchService, "createOpportunityMatchFromAcceptedApplication">;
  notifications?: Pick<
    NotificationEventsService,
    "applicationReceived" | "applicationAccepted" | "applicationRejected"
  >;
};

const allowedStatusTransitions: Record<OpportunityStatus, OpportunityStatus[]> = {
  OPEN: ["OPEN", "PAUSED", "CLOSED"],
  PAUSED: ["PAUSED", "OPEN", "CLOSED"],
  FILLED: ["FILLED", "CLOSED"],
  CLOSED: ["CLOSED"]
};

function assertUniqueIds(ids: string[] | undefined, label: string) {
  if (!ids) return;

  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError("VALIDATION_ERROR", `Duplicate ${label} are not allowed.`, 400);
  }
}

function assertStatusTransition(currentStatus: OpportunityStatus, nextStatus?: OpportunityStatus) {
  if (!nextStatus) return;

  if (!allowedStatusTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Cannot transition opportunity from ${currentStatus} to ${nextStatus}.`,
      400
    );
  }
}

export class OpportunityService {
  private readonly opportunities: OpportunityRepository;
  private readonly matches: Pick<MatchService, "createOpportunityMatchFromAcceptedApplication">;
  private readonly notifications: Pick<
    NotificationEventsService,
    "applicationReceived" | "applicationAccepted" | "applicationRejected"
  >;

  constructor(deps: OpportunityServiceDeps = {}) {
    this.opportunities = deps.opportunities ?? opportunityRepository;
    this.matches = deps.matches ?? matchService;
    this.notifications = deps.notifications ?? notificationEvents;
  }

  async createOpportunity(ownerId: string, input: CreateOpportunityInput) {
    await this.ensureStartupOwner(input.startupId, ownerId);
    assertUniqueIds(input.skillIds, "skills");
    return this.opportunities.create(input);
  }

  async getOpportunity(ownerId: string, opportunityId: string) {
    await this.ensureOpportunityOwner(opportunityId, ownerId);
    const opportunity = await this.opportunities.findPrivateById(opportunityId);

    if (!opportunity) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return opportunity;
  }

  async getPublicOpportunity(opportunityId: string) {
    const opportunity = await this.opportunities.findPublicById(opportunityId);

    if (!opportunity) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return opportunity;
  }

  listStartupOpportunities(startupId: string) {
    return this.opportunities.listByStartupId(startupId);
  }

  async updateOpportunity(ownerId: string, opportunityId: string, input: OpportunityInput) {
    await this.ensureOpportunityOwner(opportunityId, ownerId);
    assertUniqueIds(input.skillIds, "skills");

    const current = await this.requireOpportunity(opportunityId);
    assertStatusTransition(current.status, input.status);

    const opportunity = await this.opportunities.update(opportunityId, input);

    if (!opportunity) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return opportunity;
  }

  async deleteOpportunity(ownerId: string, opportunityId: string) {
    await this.ensureOpportunityOwner(opportunityId, ownerId);
    const deleted = await this.opportunities.close(opportunityId);

    if (!deleted) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return { deleted: true as const };
  }

  async incrementView(opportunityId: string, actorUserId?: string | null) {
    const incremented = await this.opportunities.incrementView(opportunityId, actorUserId);

    if (!incremented) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return { incremented: true as const };
  }

  async getAnalytics(ownerId: string, opportunityId: string) {
    await this.ensureOpportunityOwner(opportunityId, ownerId);
    const analytics = await this.opportunities.getAnalytics(opportunityId);

    if (!analytics) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return analytics;
  }

  async apply(applicantId: string, opportunityId: string, input: OpportunityApplicationInput) {
    await this.ensureActiveUser(applicantId);
    const opportunity = await this.opportunities.findPrivateById(opportunityId);

    if (!opportunity || opportunity.status !== "OPEN") {
      throw new AppError("VALIDATION_ERROR", "Opportunity is not open for applications.", 400);
    }

    if (opportunity.startup.ownerId === applicantId) {
      throw new AppError("FORBIDDEN", "Startup owners cannot apply to their own opportunity.", 403);
    }

    if (await this.opportunities.hasActiveApplication(opportunityId, applicantId)) {
      throw new AppError("CONFLICT", "You already have an active application for this opportunity.", 409);
    }

    const application = await this.opportunities.createApplication(opportunityId, applicantId, input);

    await this.notifications.applicationReceived({
      ownerId: opportunity.startup.ownerId,
      opportunityId,
      applicationId: application.id,
      applicantId
    });

    return application;
  }

  async withdraw(applicantId: string, opportunityId: string, applicationId: string) {
    const existing = await this.opportunities.findApplicationForApplicant(opportunityId, applicationId, applicantId);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    if (existing.status !== "PENDING" || existing.withdrawnAt) {
      throw new AppError("VALIDATION_ERROR", "Only pending applications can be withdrawn.", 400);
    }

    const application = await this.opportunities.withdrawApplication(opportunityId, applicationId, applicantId);

    if (!application) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    return application;
  }

  async accept(ownerId: string, opportunityId: string, applicationId: string, input: OpportunityReviewInput) {
    return this.review(ownerId, opportunityId, applicationId, "accept", input);
  }

  async reject(ownerId: string, opportunityId: string, applicationId: string, input: OpportunityReviewInput) {
    return this.review(ownerId, opportunityId, applicationId, "reject", input);
  }

  private async review(
    ownerId: string,
    opportunityId: string,
    applicationId: string,
    action: "accept" | "reject",
    input: OpportunityReviewInput
  ) {
    const existing = await this.opportunities.findApplicationForOwner(opportunityId, applicationId, ownerId);

    if (!existing) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    if (existing.status !== "PENDING" || existing.withdrawnAt) {
      throw new AppError("VALIDATION_ERROR", "Only pending applications can be reviewed.", 400);
    }

    const application = action === "accept"
      ? await this.opportunities.acceptApplication(opportunityId, applicationId, ownerId, input)
      : await this.opportunities.rejectApplication(opportunityId, applicationId, ownerId, input);

    if (!application) {
      throw new AppError("NOT_FOUND", "Application not found.", 404);
    }

    if (action === "accept") {
      await this.matches.createOpportunityMatchFromAcceptedApplication(application.id, ownerId);
      await this.notifications.applicationAccepted({
        applicantId: application.applicantId,
        opportunityId,
        applicationId
      });
    } else {
      await this.notifications.applicationRejected({
        applicantId: application.applicantId,
        opportunityId,
        applicationId
      });
    }

    return application;
  }

  private async ensureStartupOwner(startupId: string, userId: string) {
    if (!await this.opportunities.isStartupOwner(startupId, userId)) {
      throw new AppError("FORBIDDEN", "Only the startup owner can perform this action.", 403);
    }
  }

  private async ensureOpportunityOwner(opportunityId: string, userId: string) {
    if (!await this.opportunities.isOpportunityOwner(opportunityId, userId)) {
      throw new AppError("FORBIDDEN", "Only the startup owner can perform this action.", 403);
    }
  }

  private async ensureActiveUser(userId: string) {
    const user = await this.opportunities.findActiveUserById(userId);

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }
  }

  private async requireOpportunity(opportunityId: string) {
    const opportunity = await this.opportunities.findPrivateById(opportunityId);

    if (!opportunity) {
      throw new AppError("NOT_FOUND", "Opportunity not found.", 404);
    }

    return opportunity;
  }
}

export const opportunityService = new OpportunityService();
