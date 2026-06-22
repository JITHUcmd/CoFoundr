import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { OpportunityService } from "@/services/opportunity/opportunity.service";

function createOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    id: "opportunity-1",
    startupId: "startup-1",
    roleName: "Technical Co-Founder",
    opportunityType: "TECHNICAL_CO_FOUNDER",
    description: "Build the MVP.",
    openings: 1,
    experienceLevel: "SENIOR",
    compensationType: "BOTH",
    equityMinPercent: 5,
    equityMaxPercent: 15,
    salaryMin: 50000,
    salaryMax: 100000,
    salaryCurrency: "USD",
    commitment: "FULL_TIME",
    remoteAllowed: true,
    workStyle: "REMOTE",
    country: "India",
    state: "Kerala",
    city: "Kochi",
    status: "OPEN",
    viewsCount: 0,
    savesCount: 0,
    applicationsCount: 0,
    startup: {
      id: "startup-1",
      ownerId: "owner-1",
      name: "CoFoundr Labs",
      slug: "cofoundr-labs"
    },
    skills: [],
    ...overrides
  };
}

function createApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: "application-1",
    opportunityId: "opportunity-1",
    applicantId: "applicant-1",
    reviewedById: null,
    status: "PENDING",
    note: null,
    reviewNote: null,
    reviewedAt: null,
    withdrawnAt: null,
    decidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createService(overrides: {
  startupOwner?: boolean;
  opportunityOwner?: boolean;
  activeUser?: boolean;
  opportunity?: ReturnType<typeof createOpportunity> | null;
  publicOpportunity?: ReturnType<typeof createOpportunity> | null;
  activeApplication?: boolean;
  application?: ReturnType<typeof createApplication> | null;
  deleted?: boolean;
  incremented?: boolean;
} = {}) {
  const opportunity = overrides.opportunity === undefined ? createOpportunity() : overrides.opportunity;
  const publicOpportunity = overrides.publicOpportunity === undefined ? createOpportunity() : overrides.publicOpportunity;
  const application = overrides.application === undefined ? createApplication() : overrides.application;
  const opportunities = {
    findActiveUserById: vi.fn().mockResolvedValue(overrides.activeUser === false ? null : { id: "user-1" }),
    isStartupOwner: vi.fn().mockResolvedValue(overrides.startupOwner ?? true),
    isOpportunityOwner: vi.fn().mockResolvedValue(overrides.opportunityOwner ?? true),
    findPrivateById: vi.fn().mockResolvedValue(opportunity),
    findPublicById: vi.fn().mockResolvedValue(publicOpportunity),
    listByStartupId: vi.fn().mockResolvedValue([publicOpportunity]),
    create: vi.fn().mockResolvedValue(opportunity),
    update: vi.fn().mockResolvedValue(opportunity),
    close: vi.fn().mockResolvedValue(overrides.deleted ?? true),
    incrementView: vi.fn().mockResolvedValue(overrides.incremented ?? true),
    getAnalytics: vi.fn().mockResolvedValue({ views: 1, saves: 2, applications: 3 }),
    hasActiveApplication: vi.fn().mockResolvedValue(Boolean(overrides.activeApplication)),
    createApplication: vi.fn().mockResolvedValue(application),
    findApplicationForApplicant: vi.fn().mockResolvedValue(application),
    findApplicationForOwner: vi.fn().mockResolvedValue(application),
    withdrawApplication: vi.fn().mockResolvedValue({ ...application, status: "WITHDRAWN" }),
    acceptApplication: vi.fn().mockResolvedValue({ ...application, status: "ACCEPTED" }),
    rejectApplication: vi.fn().mockResolvedValue({ ...application, status: "REJECTED" })
  };
  const matches = {
    createOpportunityMatchFromAcceptedApplication: vi.fn().mockResolvedValue(null)
  };
  const notifications = {
    applicationReceived: vi.fn().mockResolvedValue(undefined),
    applicationAccepted: vi.fn().mockResolvedValue(undefined),
    applicationRejected: vi.fn().mockResolvedValue(undefined)
  };

  return {
    service: new OpportunityService({
      opportunities: opportunities as never,
      matches,
      notifications
    }),
    opportunities,
    matches,
    notifications
  };
}

describe("OpportunityService", () => {
  it("creates opportunities only for startup owners", async () => {
    const { service, opportunities } = createService();

    await service.createOpportunity("owner-1", {
      startupId: "startup-1",
      roleName: "Technical Co-Founder",
      compensationType: "BOTH"
    });

    expect(opportunities.create).toHaveBeenCalledWith({
      startupId: "startup-1",
      roleName: "Technical Co-Founder",
      compensationType: "BOTH"
    });
  });

  it("rejects opportunity creation by non-owners", async () => {
    const { service } = createService({ startupOwner: false });

    await expect(
      service.createOpportunity("user-1", {
        startupId: "startup-1",
        roleName: "Developer",
        compensationType: "SALARY"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects invalid status transitions", async () => {
    const { service } = createService({
      opportunity: createOpportunity({ status: "CLOSED" })
    });

    await expect(
      service.updateOpportunity("owner-1", "opportunity-1", {
        status: "OPEN"
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("returns public opportunities through the public read path", async () => {
    const { service } = createService();

    const opportunity = await service.getPublicOpportunity("opportunity-1");

    expect(opportunity).toMatchObject({
      id: "opportunity-1",
      roleName: "Technical Co-Founder"
    });
  });

  it("applies only once while an active application exists", async () => {
    const { service } = createService({ activeApplication: true });

    await expect(
      service.apply("applicant-1", "opportunity-1", {
        note: "I can help."
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("notifies startup owners when applications are received", async () => {
    const { service, notifications } = createService();

    await service.apply("applicant-1", "opportunity-1", {
      note: "I can help."
    });

    expect(notifications.applicationReceived).toHaveBeenCalledWith({
      ownerId: "owner-1",
      opportunityId: "opportunity-1",
      applicationId: "application-1",
      applicantId: "applicant-1"
    });
  });

  it("allows applicants to withdraw pending applications", async () => {
    const { service, opportunities } = createService();

    await service.withdraw("applicant-1", "opportunity-1", "application-1");

    expect(opportunities.withdrawApplication).toHaveBeenCalledWith("opportunity-1", "application-1", "applicant-1");
  });

  it("allows startup owners to accept applications", async () => {
    const { service, opportunities, matches, notifications } = createService();

    await service.accept("owner-1", "opportunity-1", "application-1", {
      reviewNote: "Welcome aboard."
    });

    expect(opportunities.acceptApplication).toHaveBeenCalledWith("opportunity-1", "application-1", "owner-1", {
      reviewNote: "Welcome aboard."
    });
    expect(matches.createOpportunityMatchFromAcceptedApplication).toHaveBeenCalledWith("application-1", "owner-1");
    expect(notifications.applicationAccepted).toHaveBeenCalledWith({
      applicantId: "applicant-1",
      opportunityId: "opportunity-1",
      applicationId: "application-1"
    });
  });

  it("notifies applicants when applications are rejected", async () => {
    const { service, notifications } = createService();

    await service.reject("owner-1", "opportunity-1", "application-1", {
      reviewNote: "Not a fit."
    });

    expect(notifications.applicationRejected).toHaveBeenCalledWith({
      applicantId: "applicant-1",
      opportunityId: "opportunity-1",
      applicationId: "application-1"
    });
  });

  it("returns owner-only analytics", async () => {
    const { service } = createService();

    await expect(service.getAnalytics("owner-1", "opportunity-1")).resolves.toEqual({
      views: 1,
      saves: 2,
      applications: 3
    });
  });
});
