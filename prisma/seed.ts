import {
  AnalyticsEntityType,
  AnalyticsEventType,
  ApplicationStatus,
  ConversationType,
  MatchStatus,
  MessageType,
  NotificationType,
  ParticipantRole,
  PortfolioLinkType,
  PrismaClient,
  SwipeAction,
} from "@prisma/client";
import type { Prisma, Startup, StartupOpportunity, User } from "@prisma/client";
import {
  buildFounderVisionData,
  buildOpportunityData,
  buildStartupData,
  buildUserData,
  buildUserRoles,
  communitySeedData,
  industrySeedData,
  interestSeedData,
  notificationCopy,
  skillSeedData,
  userSkillConnections,
} from "./seed/factories";
import { daysAgo, pick, scoreBundle, slugify, takeRotating } from "./seed/helpers";

const prisma = new PrismaClient();

type SeedUser = User;
type SeedStartup = Startup;
type SeedOpportunity = StartupOpportunity;

type MatchKind = "user" | "startup" | "opportunity";

async function resetDevelopmentData() {
  await prisma.$transaction([
    prisma.analyticsDailyMetric.deleteMany(),
    prisma.analyticsEvent.deleteMany(),
    prisma.messageReadReceipt.deleteMany(),
    prisma.messageAttachment.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.reputationEvent.deleteMany(),
    prisma.userMilestone.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.userVerification.deleteMany(),
    prisma.startupVerification.deleteMany(),
    prisma.moderationAction.deleteMany(),
    prisma.report.deleteMany(),
    prisma.userBlock.deleteMany(),
    prisma.userOpportunityMatch.deleteMany(),
    prisma.userStartupMatch.deleteMany(),
    prisma.userMatch.deleteMany(),
    prisma.opportunitySwipe.deleteMany(),
    prisma.startupSwipe.deleteMany(),
    prisma.userSwipe.deleteMany(),
    prisma.application.deleteMany(),
    prisma.savedOpportunity.deleteMany(),
    prisma.savedStartup.deleteMany(),
    prisma.savedProfile.deleteMany(),
    prisma.followStartup.deleteMany(),
    prisma.followUser.deleteMany(),
    prisma.opportunityMediaAsset.deleteMany(),
    prisma.opportunitySkill.deleteMany(),
    prisma.startupOpportunity.deleteMany(),
    prisma.startupMediaAsset.deleteMany(),
    prisma.startupMember.deleteMany(),
    prisma.startup.deleteMany(),
    prisma.userMediaAsset.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.portfolioLink.deleteMany(),
    prisma.education.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.founderVision.deleteMany(),
    prisma.communityMembership.deleteMany(),
    prisma.userSkill.deleteMany(),
    prisma.userIndustry.deleteMany(),
    prisma.userInterest.deleteMany(),
    prisma.userReputation.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.account.deleteMany(),
    prisma.authCredential.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.industry.deleteMany(),
    prisma.interest.deleteMany(),
    prisma.community.deleteMany(),
  ]);
}

async function seedReferenceData() {
  const [createdSkills, createdIndustries, createdInterests, createdCommunities] = await Promise.all([
    Promise.all(
      skillSeedData().map((skill) =>
        prisma.skill.upsert({
          where: { slug: skill.slug },
          update: { name: skill.name },
          create: skill,
        }),
      ),
    ),
    Promise.all(
      industrySeedData().map((industry) =>
        prisma.industry.upsert({
          where: { slug: industry.slug },
          update: { name: industry.name },
          create: industry,
        }),
      ),
    ),
    Promise.all(
      interestSeedData().map((interest) =>
        prisma.interest.upsert({
          where: { slug: interest.slug },
          update: { name: interest.name },
          create: interest,
        }),
      ),
    ),
    Promise.all(
      communitySeedData().map((community) =>
        prisma.community.upsert({
          where: { slug: community.slug },
          update: {
            name: community.name,
            description: community.description,
            website: community.website,
            isVerified: community.isVerified,
          },
          create: community,
        }),
      ),
    ),
  ]);

  return {
    skills: createdSkills,
    industries: createdIndustries,
    interests: createdInterests,
    communities: createdCommunities,
  };
}

async function createUsers(referenceData: Awaited<ReturnType<typeof seedReferenceData>>) {
  const skillIds = referenceData.skills.map((skill) => skill.id);
  const industryIds = referenceData.industries.map((industry) => industry.id);
  const interestIds = referenceData.interests.map((interest) => interest.id);
  const communityIds = referenceData.communities.map((community) => community.id);
  const users: SeedUser[] = [];

  for (let index = 0; index < 100; index += 1) {
    const profile = buildUserData(index);
    const user = await prisma.user.create({
      data: {
        ...profile,
        roles: {
          create: buildUserRoles(index).map((type) => ({ type })),
        },
        founderVision: {
          create: buildFounderVisionData(index),
        },
        skills: {
          create: userSkillConnections(skillIds, index),
        },
        industries: {
          create: takeRotating(industryIds, index, 2 + (index % 2)).map((industryId) => ({ industryId })),
        },
        interests: {
          create: takeRotating(interestIds, index + 1, 3).map((interestId) => ({ interestId })),
        },
        communityMemberships: {
          create: takeRotating(communityIds, index, 1 + (index % 2)).map((communityId, communityIndex) => ({
            communityId,
            role: communityIndex === 0 ? "Member" : "Volunteer",
          })),
        },
        reputation: {
          create: {
            builderScore: 45 + ((index * 7) % 50),
            trustScore: 50 + ((index * 5) % 45),
            collaborationScore: 48 + ((index * 3) % 47),
          },
        },
        portfolioLinks: {
          create: [
            {
              type: PortfolioLinkType.GITHUB,
              label: "GitHub",
              url: `https://github.com/${slugify(profile.username)}`,
              isPrimary: true,
            },
            {
              type: PortfolioLinkType.LINKEDIN,
              label: "LinkedIn",
              url: `https://linkedin.com/in/${slugify(profile.username)}`,
            },
          ],
        },
        education: {
          create: {
            institution: pick(
              [
                "Cochin University of Science and Technology",
                "IIT Madras",
                "NIT Calicut",
                "Kerala Startup Mission Fellowship",
                "BITS Pilani",
              ],
              index,
            ),
            degree: pick(["B.Tech", "MBA", "B.Des", "M.Sc", "Self-Taught"], index),
            field: pick(["Computer Science", "Product Management", "Design", "Business", "Data Science"], index),
            startDate: new Date(Date.UTC(2016 + (index % 5), 6, 1)),
            endDate: index % 4 === 0 ? null : new Date(Date.UTC(2020 + (index % 4), 5, 1)),
          },
        },
        experiences: {
          create: {
            companyName: pick(["EarlyStage Labs", "Studio Zero", "Campus Ventures", "CloudWorks", "IndieStack"], index),
            title: pick(["Founder", "Software Engineer", "Product Manager", "Growth Lead", "Designer"], index),
            startDate: new Date(Date.UTC(2020 + (index % 4), index % 12, 1)),
            isCurrent: index % 3 !== 0,
            description: "Worked on product discovery, launch execution, and cross-functional collaboration.",
          },
        },
      },
    });

    users.push(user);
  }

  return users;
}

async function createStartups(users: SeedUser[], referenceData: Awaited<ReturnType<typeof seedReferenceData>>) {
  const startups: SeedStartup[] = [];

  for (let index = 0; index < 25; index += 1) {
    const owner = users[index];
    const industry = referenceData.industries[index % referenceData.industries.length];
    const startup = await prisma.startup.create({
      data: buildStartupData(index, owner.id, industry.id),
    });

    await prisma.startupMember.create({
      data: {
        startupId: startup.id,
        userId: owner.id,
        role: "CEO",
        isFounder: true,
        joinedAt: daysAgo(300 - index),
      },
    });

    const memberRoles = ["CTO", "Product Lead", "Technical Co-Founder", "Advisor", "Investor"];
    const memberCount = 2 + (index % 3);

    for (let memberIndex = 0; memberIndex < memberCount; memberIndex += 1) {
      const member = users[25 + ((index * 3 + memberIndex) % 75)];

      await prisma.startupMember.create({
        data: {
          startupId: startup.id,
          userId: member.id,
          role: pick(memberRoles, index + memberIndex),
          isFounder: memberIndex === 0,
          joinedAt: daysAgo(250 - index - memberIndex),
        },
      });
    }

    startups.push(startup);
  }

  return startups;
}

async function createOpportunities(startups: SeedStartup[], referenceData: Awaited<ReturnType<typeof seedReferenceData>>) {
  const opportunities: SeedOpportunity[] = [];
  const skillIds = referenceData.skills.map((skill) => skill.id);

  for (let index = 0; index < 75; index += 1) {
    const startup = startups[index % startups.length];
    const opportunity = await prisma.startupOpportunity.create({
      data: {
        ...buildOpportunityData(index, startup.id),
        skills: {
          create: takeRotating(skillIds, index, 3).map((skillId) => ({ skillId })),
        },
      },
    });

    opportunities.push(opportunity);
  }

  return opportunities;
}

async function createNotification(
  userId: string,
  type: NotificationType,
  metadata: Prisma.InputJsonObject,
  createdAt = new Date(),
) {
  const copy = notificationCopy(type);

  return prisma.notification.create({
    data: {
      userId,
      type,
      title: copy.title,
      content: copy.content,
      metadata,
      isRead: createdAt.getTime() % 2 === 0,
      readAt: createdAt.getTime() % 2 === 0 ? createdAt : null,
      createdAt,
    },
  });
}

async function createConversation(params: {
  kind: MatchKind;
  matchId: string;
  participantIds: [string, string];
  seed: number;
}) {
  const relation =
    params.kind === "user"
      ? { userMatchId: params.matchId }
      : params.kind === "startup"
        ? { startupMatchId: params.matchId }
        : { opportunityMatchId: params.matchId };

  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.MATCH,
      ...relation,
      createdAt: daysAgo(45 - (params.seed % 30)),
      lastMessageAt: daysAgo(5 - (params.seed % 4)),
      participants: {
        create: params.participantIds.map((userId, participantIndex) => ({
          userId,
          role: ParticipantRole.MEMBER,
          joinedAt: daysAgo(45 - (params.seed % 30)),
          lastReadAt: participantIndex === 0 ? daysAgo(1) : daysAgo(2),
        })),
      },
    },
  });

  const messageBodies = [
    "Hey, great to match here. I liked the direction you are exploring.",
    "Likewise. I can share more context on the problem and current traction.",
    "That sounds useful. I would love to understand the roadmap and team gaps.",
    "Perfect. Let us set up a short intro call this week.",
  ];

  let lastMessageId: string | null = null;

  for (let messageIndex = 0; messageIndex < messageBodies.length; messageIndex += 1) {
    const senderId = params.participantIds[messageIndex % params.participantIds.length];
    const recipientId = params.participantIds[(messageIndex + 1) % params.participantIds.length];
    const createdAt = daysAgo(4 - messageIndex);
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        type: MessageType.TEXT,
        body: messageBodies[messageIndex],
        createdAt,
      },
    });

    lastMessageId = message.id;

    if (messageIndex < messageBodies.length - 1) {
      await prisma.messageReadReceipt.create({
        data: {
          messageId: message.id,
          userId: recipientId,
          readAt: daysAgo(3 - messageIndex),
        },
      });
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType: AnalyticsEventType.MESSAGE_SENT,
        entityType: AnalyticsEntityType.MESSAGE,
        actorUserId: senderId,
        targetUserId: recipientId,
        conversationId: conversation.id,
        messageId: message.id,
        occurredAt: createdAt,
      },
    });

    await createNotification(
      recipientId,
      NotificationType.NEW_MESSAGE,
      {
        conversationId: conversation.id,
        messageId: message.id,
        senderId,
      },
      createdAt,
    );
  }

  await Promise.all(
    params.participantIds.map((userId) =>
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId,
          },
        },
        data: {
          lastReadMessageId: lastMessageId,
        },
      }),
    ),
  );

  return conversation;
}

async function createUserSwipeOnce(
  seen: Set<string>,
  swiperId: string,
  targetUserId: string,
  action: SwipeAction,
  createdAt: Date,
) {
  const key = `${swiperId}:${targetUserId}`;

  if (swiperId === targetUserId || seen.has(key)) {
    return null;
  }

  seen.add(key);

  return prisma.userSwipe.create({
    data: {
      swiperId,
      targetUserId,
      action,
      createdAt,
    },
  });
}

async function createStartupSwipeOnce(
  seen: Set<string>,
  swiperId: string,
  targetStartupId: string,
  action: SwipeAction,
  createdAt: Date,
) {
  const key = `${swiperId}:${targetStartupId}`;

  if (seen.has(key)) {
    return null;
  }

  seen.add(key);

  return prisma.startupSwipe.create({
    data: {
      swiperId,
      targetStartupId,
      action,
      createdAt,
    },
  });
}

async function createOpportunitySwipeOnce(
  seen: Set<string>,
  swiperId: string,
  targetOpportunityId: string,
  action: SwipeAction,
  createdAt: Date,
) {
  const key = `${swiperId}:${targetOpportunityId}`;

  if (seen.has(key)) {
    return null;
  }

  seen.add(key);

  return prisma.opportunitySwipe.create({
    data: {
      swiperId,
      targetOpportunityId,
      action,
      createdAt,
    },
  });
}

async function createMatchesAndMessages(
  users: SeedUser[],
  startups: SeedStartup[],
  opportunities: SeedOpportunity[],
) {
  const userSwipeKeys = new Set<string>();
  const startupSwipeKeys = new Set<string>();
  const opportunitySwipeKeys = new Set<string>();

  for (let index = 0; index < 20; index += 1) {
    const userA = users[30 + index];
    const userB = users[55 + index];

    await createUserSwipeOnce(userSwipeKeys, userA.id, userB.id, SwipeAction.RIGHT, daysAgo(35 - index));
    await createUserSwipeOnce(userSwipeKeys, userB.id, userA.id, SwipeAction.RIGHT, daysAgo(34 - index));

    const match = await prisma.userMatch.create({
      data: {
        userAId: userA.id,
        userBId: userB.id,
        createdByUserId: userB.id,
        status: MatchStatus.ACTIVE,
        ...scoreBundle(index),
        createdAt: daysAgo(33 - index),
      },
    });

    await createConversation({
      kind: "user",
      matchId: match.id,
      participantIds: [userA.id, userB.id],
      seed: index,
    });

    await prisma.analyticsEvent.createMany({
      data: [
        {
          eventType: AnalyticsEventType.MATCH_CREATED,
          entityType: AnalyticsEntityType.MATCH,
          actorUserId: userA.id,
          targetUserId: userB.id,
          occurredAt: match.createdAt,
        },
        {
          eventType: AnalyticsEventType.MATCH_CREATED,
          entityType: AnalyticsEntityType.MATCH,
          actorUserId: userB.id,
          targetUserId: userA.id,
          occurredAt: match.createdAt,
        },
      ],
    });

    await createNotification(userA.id, NotificationType.MATCH_CREATED, { userMatchId: match.id, matchedUserId: userB.id });
    await createNotification(userB.id, NotificationType.MATCH_CREATED, { userMatchId: match.id, matchedUserId: userA.id });
  }

  for (let index = 0; index < 15; index += 1) {
    const startup = startups[index];
    const owner = users.find((user) => user.id === startup.ownerId) ?? users[index];
    const candidate = users[75 + index];

    await createStartupSwipeOnce(startupSwipeKeys, candidate.id, startup.id, SwipeAction.RIGHT, daysAgo(25 - index));
    await createUserSwipeOnce(userSwipeKeys, owner.id, candidate.id, SwipeAction.RIGHT, daysAgo(24 - index));

    const match = await prisma.userStartupMatch.create({
      data: {
        userId: candidate.id,
        startupId: startup.id,
        createdByUserId: owner.id,
        status: MatchStatus.ACTIVE,
        ...scoreBundle(index + 20),
        createdAt: daysAgo(23 - index),
      },
    });

    await createConversation({
      kind: "startup",
      matchId: match.id,
      participantIds: [candidate.id, owner.id],
      seed: index + 20,
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: AnalyticsEventType.MATCH_CREATED,
        entityType: AnalyticsEntityType.MATCH,
        actorUserId: owner.id,
        targetUserId: candidate.id,
        startupId: startup.id,
        occurredAt: match.createdAt,
      },
    });

    await createNotification(candidate.id, NotificationType.MATCH_CREATED, {
      startupMatchId: match.id,
      startupId: startup.id,
    });
    await createNotification(owner.id, NotificationType.MATCH_CREATED, {
      startupMatchId: match.id,
      matchedUserId: candidate.id,
    });
  }

  for (let index = 0; index < 15; index += 1) {
    const opportunity = opportunities[index * 2];
    const startup = startups.find((item) => item.id === opportunity.startupId) ?? startups[index];
    const owner = users.find((user) => user.id === startup.ownerId) ?? users[index];
    const applicant = users[45 + index];

    await createOpportunitySwipeOnce(
      opportunitySwipeKeys,
      applicant.id,
      opportunity.id,
      SwipeAction.RIGHT,
      daysAgo(20 - index),
    );

    const application = await prisma.application.create({
      data: {
        opportunityId: opportunity.id,
        applicantId: applicant.id,
        reviewedById: owner.id,
        status: ApplicationStatus.ACCEPTED,
        note: "I can contribute product velocity and early customer discovery.",
        reviewNote: "Strong fit for current team needs.",
        reviewedAt: daysAgo(18 - index),
        decidedAt: daysAgo(18 - index),
        createdAt: daysAgo(19 - index),
      },
    });

    const match = await prisma.userOpportunityMatch.create({
      data: {
        userId: applicant.id,
        opportunityId: opportunity.id,
        createdByUserId: owner.id,
        status: MatchStatus.ACTIVE,
        ...scoreBundle(index + 35),
        createdAt: daysAgo(17 - index),
      },
    });

    await createConversation({
      kind: "opportunity",
      matchId: match.id,
      participantIds: [applicant.id, owner.id],
      seed: index + 35,
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: AnalyticsEventType.MATCH_CREATED,
        entityType: AnalyticsEntityType.MATCH,
        actorUserId: owner.id,
        targetUserId: applicant.id,
        startupId: startup.id,
        opportunityId: opportunity.id,
        occurredAt: match.createdAt,
      },
    });

    await createNotification(owner.id, NotificationType.APPLICATION_RECEIVED, {
      applicationId: application.id,
      opportunityId: opportunity.id,
    });
    await createNotification(applicant.id, NotificationType.APPLICATION_ACCEPTED, {
      applicationId: application.id,
      opportunityMatchId: match.id,
    });
    await createNotification(applicant.id, NotificationType.MATCH_CREATED, {
      opportunityMatchId: match.id,
      opportunityId: opportunity.id,
    });
  }

  for (let index = 0; index < 60; index += 1) {
    await createUserSwipeOnce(
      userSwipeKeys,
      users[index].id,
      users[99 - index].id,
      index % 8 === 0 ? SwipeAction.SUPER_LIKE : SwipeAction.LEFT,
      daysAgo(index % 30),
    );

    await createStartupSwipeOnce(
      startupSwipeKeys,
      users[(index + 10) % users.length].id,
      startups[index % startups.length].id,
      index % 6 === 0 ? SwipeAction.SUPER_LIKE : SwipeAction.LEFT,
      daysAgo(index % 30),
    );

    await createOpportunitySwipeOnce(
      opportunitySwipeKeys,
      users[(index + 20) % users.length].id,
      opportunities[index % opportunities.length].id,
      index % 7 === 0 ? SwipeAction.SUPER_LIKE : SwipeAction.LEFT,
      daysAgo(index % 30),
    );
  }
}

async function createAdditionalApplications(users: SeedUser[], startups: SeedStartup[], opportunities: SeedOpportunity[]) {
  const usedPairs = new Set<string>();

  for (let index = 0; index < opportunities.length; index += 1) {
    const opportunity = opportunities[index];
    const startup = startups.find((item) => item.id === opportunity.startupId) ?? startups[index % startups.length];
    const owner = users.find((user) => user.id === startup.ownerId) ?? users[index % users.length];
    const applicant = users[25 + ((index * 2) % 70)];
    const pairKey = `${opportunity.id}:${applicant.id}`;

    if (applicant.id === owner.id || usedPairs.has(pairKey)) {
      continue;
    }

    usedPairs.add(pairKey);

    const status =
      index % 5 === 0
        ? ApplicationStatus.REJECTED
        : index % 9 === 0
          ? ApplicationStatus.WITHDRAWN
          : ApplicationStatus.PENDING;

    const application = await prisma.application.create({
      data: {
        opportunityId: opportunity.id,
        applicantId: applicant.id,
        reviewedById: status === ApplicationStatus.PENDING || status === ApplicationStatus.WITHDRAWN ? null : owner.id,
        status,
        note: "Interested in learning more about the role and contributing to the early roadmap.",
        reviewNote: status === ApplicationStatus.REJECTED ? "Not the right fit for this role yet." : null,
        reviewedAt: status === ApplicationStatus.REJECTED ? daysAgo(index % 20) : null,
        decidedAt: status === ApplicationStatus.REJECTED ? daysAgo(index % 20) : null,
        withdrawnAt: status === ApplicationStatus.WITHDRAWN ? daysAgo(index % 20) : null,
        createdAt: daysAgo(40 - (index % 25)),
      },
    });

    await createNotification(owner.id, NotificationType.APPLICATION_RECEIVED, {
      applicationId: application.id,
      opportunityId: opportunity.id,
      applicantId: applicant.id,
    });

    if (status === ApplicationStatus.REJECTED) {
      await createNotification(applicant.id, NotificationType.APPLICATION_REJECTED, {
        applicationId: application.id,
        opportunityId: opportunity.id,
      });
    }
  }
}

async function createDiscoveryEvents(users: SeedUser[], startups: SeedStartup[], opportunities: SeedOpportunity[]) {
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];

  for (let index = 0; index < 100; index += 1) {
    events.push({
      eventType: AnalyticsEventType.DISCOVERY_APPEARANCE,
      entityType: AnalyticsEntityType.USER,
      actorUserId: users[(index + 3) % users.length].id,
      targetUserId: users[index].id,
      occurredAt: daysAgo(index % 30),
    });
  }

  for (let index = 0; index < 50; index += 1) {
    events.push({
      eventType: AnalyticsEventType.STARTUP_VIEW,
      entityType: AnalyticsEntityType.STARTUP,
      actorUserId: users[(index + 7) % users.length].id,
      startupId: startups[index % startups.length].id,
      occurredAt: daysAgo(index % 30),
    });
  }

  for (let index = 0; index < 75; index += 1) {
    events.push({
      eventType: AnalyticsEventType.OPPORTUNITY_VIEW,
      entityType: AnalyticsEntityType.OPPORTUNITY,
      actorUserId: users[(index + 11) % users.length].id,
      opportunityId: opportunities[index].id,
      occurredAt: daysAgo(index % 30),
    });
  }

  await prisma.analyticsEvent.createMany({ data: events });
}

async function main() {
  console.log("Resetting development data...");
  await resetDevelopmentData();

  console.log("Creating seed catalogs...");
  const referenceData = await seedReferenceData();

  console.log("Creating users, profiles, founder visions, skills, industries, and interests...");
  const users = await createUsers(referenceData);

  console.log("Creating startups and startup members...");
  const startups = await createStartups(users, referenceData);

  console.log("Creating opportunities...");
  const opportunities = await createOpportunities(startups, referenceData);

  console.log("Creating applications...");
  await createAdditionalApplications(users, startups, opportunities);

  console.log("Creating swipes, valid matches, conversations, messages, and notifications...");
  await createMatchesAndMessages(users, startups, opportunities);

  console.log("Creating discovery and view analytics events...");
  await createDiscoveryEvents(users, startups, opportunities);

  const summary = await Promise.all([
    prisma.user.count(),
    prisma.startup.count(),
    prisma.startupOpportunity.count(),
    prisma.founderVision.count(),
    prisma.userSwipe.count(),
    prisma.startupSwipe.count(),
    prisma.opportunitySwipe.count(),
    prisma.userMatch.count(),
    prisma.userStartupMatch.count(),
    prisma.userOpportunityMatch.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.notification.count(),
    prisma.application.count(),
  ]);

  console.log({
    users: summary[0],
    startups: summary[1],
    opportunities: summary[2],
    founderVisions: summary[3],
    userSwipes: summary[4],
    startupSwipes: summary[5],
    opportunitySwipes: summary[6],
    userMatches: summary[7],
    startupMatches: summary[8],
    opportunityMatches: summary[9],
    conversations: summary[10],
    messages: summary[11],
    notifications: summary[12],
    applications: summary[13],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
