# CoFoundr Database Architecture

This design uses PostgreSQL with Prisma. The transactional side is normalized around users, startups, opportunities, discovery actions, matches, conversations, verification, reputation, safety, and analytics. The schema lives in `prisma/schema.prisma`.

## 1. Database Design Review

### Main entities

**User identity and profile**
- `User` stores account-level and public profile basics: email, username, name, photo, headline, bio, location, looking status, and availability.
- `UserRole` models user types as a many-to-many style enum table, allowing a person to be both a founder and advisor, investor and recruiter, etc.
- `Skill`, `Industry`, `Interest`, and their join tables support profile filtering and matching.
- `Experience` and `Education` capture professional background.
- `FounderVision` is a one-to-one extension for startup goal, funding preference, risk appetite, commitment, and work style.

**Portfolio and media**
- `PortfolioLink` stores GitHub, LinkedIn, website, resume, and pitch deck links.
- `MediaAsset` is the canonical upload table.
- `UserMediaAsset`, `StartupMediaAsset`, and `OpportunityMediaAsset` attach uploaded assets to the correct domain object without using weak nullable polymorphic foreign keys.

**Communities**
- `Community` and `CommunityMembership` model scalable many-to-many community membership for groups such as muLearn, TinkerHub, IEEE, IEDC, GDSC, and entrepreneurship cells.

**Startups and opportunities**
- `Startup` belongs to an owner and can have members, media, verifications, milestones, and opportunities.
- `StartupOpportunity` supports both a single-role startup listing and a multi-role hiring board. A startup can publish one opportunity or many.
- `OpportunitySkill` allows role-specific skill filtering.

**Discovery and matches**
- `UserSwipe`, `StartupSwipe`, and `OpportunitySwipe` are separate typed swipe tables. This keeps foreign keys strict and indexes compact.
- `UserMatch`, `UserStartupMatch`, and `UserOpportunityMatch` are also typed tables. This is the recommended design because each match type has different semantics and future permissions.
- `UserMatch.userAId` and `userBId` should be stored in canonical order by the application or migration logic so one pair has only one row.

**Messaging**
- `Conversation` can be linked to a user, startup, or opportunity match.
- `ConversationParticipant` supports participant state, archive/mute state, and last-read pointers.
- `Message`, `MessageAttachment`, and `MessageReadReceipt` support text, attachments, and read receipts.

**Verification and badges**
- `UserVerification` supports LinkedIn, GitHub, company email, and related user verification flows.
- `StartupVerification` handles startup-level verification evidence and review.
- `UserBadge` stores visible badges derived from verification or reputation systems.

**Reputation and execution**
- `UserReputation` stores current builder, trust, and collaboration scores for fast reads.
- `ReputationEvent` is the append-only score ledger. Scores can be recalculated if scoring rules change.
- `MilestoneDefinition` and `UserMilestone` support founder execution milestones such as idea validated, MVP built, first customer, first revenue, and raised funding.

**Reviews**
- `Review` supports collaborator feedback with communication, reliability, technical skill, overall rating, and written feedback.
- Reviews may be linked to any match type when applicable.

**Safety and moderation**
- `Report` supports spam, fake investor, fake startup, harassment, and other report reasons.
- `UserBlock` prevents unwanted interaction.
- `ModerationAction` records moderator decisions and audit history.

**Analytics**
- `AnalyticsEvent` stores high-volume event records for views, swipes received, matches, and messages sent.
- `AnalyticsDailyMetric` stores rollups for dashboards and ranking jobs.

### Key design decisions

- **PostgreSQL first:** UUID primary keys, relational constraints, JSON metadata where the shape is expected to evolve, and indexes for matching/discovery queries.
- **Multiple user roles:** `UserRole` avoids locking a person into one category.
- **Typed swipe and match tables:** This avoids a fragile generic `targetId + targetType` model for core transactions.
- **Central media assets with typed attachment tables:** Upload storage is unified, while attachments remain relationally valid.
- **Reputation as current state plus event ledger:** Reads stay fast, but score logic remains auditable and recalculable.
- **Analytics separate from product tables:** Product interactions are stored transactionally, and analytic events/rollups can be partitioned or moved to a warehouse later.

## 2. ER Diagram Description

```text
User
  1 -- * UserRole
  1 -- 1 FounderVision
  * -- * Skill through UserSkill
  * -- * Industry through UserIndustry
  * -- * Interest through UserInterest
  1 -- * Experience
  1 -- * Education
  1 -- * PortfolioLink
  1 -- * MediaAsset as uploader
  * -- * Community through CommunityMembership

User
  1 -- * Startup as owner
  * -- * Startup through StartupMember
  1 -- * FollowUser as follower
  1 -- * FollowUser as followed user
  1 -- * FollowStartup
  1 -- * SavedProfile as saver
  1 -- * SavedProfile as saved user
  1 -- * SavedStartup
  1 -- * SavedOpportunity
  1 -- * Application as applicant
  1 -- * Notification

Startup
  * -- 1 Industry
  1 -- * FollowStartup
  1 -- * SavedStartup
  1 -- * StartupMember
  1 -- * StartupOpportunity
  1 -- * StartupVerification
  1 -- * StartupMediaAsset

StartupOpportunity
  * -- * Skill through OpportunitySkill
  1 -- * OpportunityMediaAsset
  1 -- * SavedOpportunity
  1 -- * Application

Discovery
  User 1 -- * UserSwipe -- 1 target User
  User 1 -- * StartupSwipe -- 1 Startup
  User 1 -- * OpportunitySwipe -- 1 StartupOpportunity

Matches
  UserMatch links User <-> User
  UserStartupMatch links User <-> Startup
  UserOpportunityMatch links User <-> StartupOpportunity

Messaging
  Conversation 1 -- * ConversationParticipant -- 1 User
  Conversation 1 -- * Message
  Message 1 -- * MessageAttachment -- 1 MediaAsset
  Message 1 -- * MessageReadReceipt -- 1 User
  Conversation 0/1 -- 1 UserMatch
  Conversation 0/1 -- 1 UserStartupMatch
  Conversation 0/1 -- 1 UserOpportunityMatch

Verification and reputation
  User 1 -- * UserVerification
  UserVerification 0/1 -- * UserBadge
  User 1 -- 1 UserReputation
  User 1 -- * ReputationEvent
  MilestoneDefinition 1 -- * UserMilestone
  UserMilestone 0/1 -- * ReputationEvent

Safety
  User 1 -- * Report as reporter
  User 1 -- * Report as reported user
  Startup 1 -- * Report
  StartupOpportunity 1 -- * Report
  Report 1 -- * ModerationAction
  User 1 -- * UserBlock as blocker
  User 1 -- * UserBlock as blocked

Analytics
  AnalyticsEvent optionally references User, Startup, StartupOpportunity, Conversation, or Message
  AnalyticsDailyMetric stores aggregate counts by entity type, entity id, metric type, and date
```

## 3. Complete Prisma Schema

The complete production-ready Prisma schema is in:

```text
prisma/schema.prisma
```

It includes enums, relations, indexes, unique constraints, typed match tables, media attachment tables, moderation tables, and analytics event/rollup tables.

## Incremental Additions

### Updated ER diagram changes

```text
Follow system
  User 1 -- * FollowUser as follower
  User 1 -- * FollowUser as following target
  User 1 -- * FollowStartup
  Startup 1 -- * FollowStartup

Startup team
  Startup 1 -- * StartupMember
  User 1 -- * StartupMember

Saved items
  User 1 -- * SavedProfile as saver
  User 1 -- * SavedProfile as saved profile
  User 1 -- * SavedStartup
  Startup 1 -- * SavedStartup
  User 1 -- * SavedOpportunity
  StartupOpportunity 1 -- * SavedOpportunity

Applications
  StartupOpportunity 1 -- * Application
  User 1 -- * Application as applicant

Notifications
  User 1 -- * Notification
```

### New Prisma models

- `FollowUser`: stores user-to-user follows with `followerId`, `followingId`, and `createdAt`.
- `FollowStartup`: stores user-to-startup follows with `userId`, `startupId`, and `createdAt`.
- `SavedProfile`: stores profiles saved by investors, recruiters, or other users.
- `SavedStartup`: stores saved startups.
- `SavedOpportunity`: stores saved startup opportunities.
- `Application`: stores historical opportunity applications with `PENDING`, `ACCEPTED`, `REJECTED`, and `WITHDRAWN` status. Multiple applications over time are allowed, while PostgreSQL should enforce only one active pending application per applicant/opportunity pair.
- `Notification`: stores user notifications for matches, messages, verification, applications, reviews, follows, and startup updates.

### Updated existing model

- `StartupMember` now has an `id` primary key and a `role` field, while retaining the existing startup/user relations, `isFounder`, `leftAt`, and indexes. Duplicate membership is prevented with `@@unique([startupId, userId])`.

### Updated relationships

- `User.followingUsers` and `User.followers` connect both sides of `FollowUser`.
- `User.followedStartups` and `Startup.followers` connect `FollowStartup`.
- `User.savedProfiles` and `User.savedByUsers` connect both sides of `SavedProfile`.
- `User.savedStartups` and `Startup.savedByUsers` connect `SavedStartup`.
- `User.savedOpportunities` and `StartupOpportunity.savedByUsers` connect `SavedOpportunity`.
- `User.applications`, `User.applicationsReviewed`, and `StartupOpportunity.applications` connect `Application`.
- `User.notifications` connects `Notification`.

### New enums

```prisma
enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum NotificationType {
  MATCH
  MESSAGE
  VERIFICATION
  APPLICATION
  REVIEW
  FOLLOW
  STARTUP_UPDATE
}
```

### Required indexes and constraints

- `FollowUser`: `@@unique([followerId, followingId])`, `@@index([followerId, createdAt])`, `@@index([followingId, createdAt])`.
- `FollowStartup`: `@@unique([userId, startupId])`, `@@index([userId, createdAt])`, `@@index([startupId, createdAt])`.
- `StartupMember`: `@@unique([startupId, userId])`, `@@index([startupId, role])`, existing `@@index([userId])`, existing `@@index([isFounder])`.
- `SavedProfile`: `@@unique([userId, savedUserId])`, `@@index([userId, createdAt])`, `@@index([savedUserId, createdAt])`.
- `SavedStartup`: `@@unique([userId, startupId])`, `@@index([userId, createdAt])`, `@@index([startupId, createdAt])`.
- `SavedOpportunity`: `@@unique([userId, opportunityId])`, `@@index([userId, createdAt])`, `@@index([opportunityId, createdAt])`.
- `Application`: `@@index([opportunityId, status, createdAt])`, `@@index([applicantId, status, createdAt])`, `@@index([reviewedById, reviewedAt])`, `@@index([opportunityId, applicantId, createdAt])`. Enforce one active application with a PostgreSQL partial unique index, not a Prisma `@@unique`.
- `Notification`: `@@index([userId, isRead, createdAt])`, `@@index([userId, createdAt])`, `@@index([type, createdAt])`.

### Migration considerations

- Prisma cannot express self-follow prevention directly. Add a PostgreSQL check constraint such as `CHECK ("followerId" <> "followingId")` on `FollowUser`.
- Consider adding a similar `CHECK ("userId" <> "savedUserId")` to `SavedProfile` if users should not save themselves.
- `StartupMember` changes from a composite primary key to an `id` primary key plus a unique pair. Existing data needs generated UUIDs and a column rename or backfill from `roleName` to `role`.
- `Application` no longer uses a full unique constraint on `(opportunityId, applicantId)`. Drop the old generated unique constraint and replace it with a partial unique PostgreSQL index for active applications:

```sql
DROP INDEX IF EXISTS "Application_opportunityId_applicantId_key";

CREATE UNIQUE INDEX "Application_one_active_per_applicant_opportunity"
ON "Application" ("opportunityId", "applicantId")
WHERE "status" = 'PENDING';
```

- If future product rules treat more than `PENDING` as active, change the predicate to `WHERE "status" IN ('PENDING', '...')`.
- Existing rejected or accepted applications can remain as history. If duplicate `PENDING` rows already exist before this migration, resolve them before creating the partial unique index.
- Backfill `decidedAt` from `updatedAt` for existing `ACCEPTED` and `REJECTED` rows if useful for reporting. Leave `withdrawnAt` null for old rows.
- For unread notification performance at scale, consider a partial PostgreSQL index on `(userId, createdAt DESC) WHERE isRead = false` in a raw migration.
- Add raw SQL constraints for rating bounds, equity bounds, self-block prevention, and exactly-one report target as noted in the original architecture review.

### Application-related Prisma changes

```prisma
enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model User {
  applications         Application[] @relation("ApplicationsByApplicant")
  applicationsReviewed Application[] @relation("ApplicationsReviewedByUser")
}

model StartupOpportunity {
  applications Application[]
}

model Application {
  id            String            @id @default(uuid()) @db.Uuid
  opportunityId String            @db.Uuid
  applicantId   String            @db.Uuid
  reviewedById  String?           @db.Uuid
  status        ApplicationStatus @default(PENDING)
  note          String?
  reviewNote    String?
  reviewedAt    DateTime?
  withdrawnAt   DateTime?
  decidedAt     DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  opportunity StartupOpportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  applicant   User               @relation("ApplicationsByApplicant", fields: [applicantId], references: [id], onDelete: Cascade)
  reviewedBy  User?              @relation("ApplicationsReviewedByUser", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([opportunityId, status, createdAt])
  @@index([applicantId, status, createdAt])
  @@index([reviewedById, reviewedAt])
  @@index([opportunityId, applicantId, createdAt])
}
```

## 4. Scalability Review

### Potential bottlenecks

- **Swipe volume:** Swipe tables can grow quickly. Keep `UserSwipe`, `StartupSwipe`, and `OpportunitySwipe` indexed by both actor and target, then partition by time or hash if volume becomes very high.
- **Analytics write volume:** `AnalyticsEvent` will likely become the largest table. Use monthly partitioning on `occurredAt` and move long-term analytics to a warehouse when needed.
- **Message history:** `Message` should be paginated by `(conversationId, createdAt)`. Avoid offset pagination for long conversations.
- **Discovery feed queries:** Matching by role, skills, location, availability, startup stage, and funding stage can become expensive. Use precomputed candidate sets or search indexes when ranking becomes complex.
- **Reputation recalculation:** Use `ReputationEvent` as the source of truth and update `UserReputation` asynchronously after milestone, review, verification, and engagement events.

### Index recommendations already included

- User search: `country/state/city`, `status/availability`, role indexes through `UserRole`.
- Profile matching: skill, industry, interest join table indexes.
- Startup filtering: industry, stage, funding stage, remote allowed.
- Opportunity filtering: startup/status, role name, compensation type, commitment/status.
- Discovery: swiper/action/time and target/action/time on all swipe tables.
- Matches: user/startup/opportunity plus match status and created time.
- Messaging: conversation/time and sender/time.
- Moderation: status/time and target/status indexes.
- Analytics: event type/time, entity type/time, and target-specific time indexes.

### Query optimization suggestions

- Use cursor pagination with indexed timestamps or ids for swipes, matches, messages, reports, and analytics.
- Keep feed ranking outside the main transactional query once matching logic becomes sophisticated.
- Precompute daily analytics into `AnalyticsDailyMetric` instead of counting raw events for dashboard reads.
- Consider PostgreSQL full-text search or a dedicated search engine for profile, startup, and opportunity discovery.
- Add database check constraints in migrations for values Prisma cannot express, such as rating range `1..5`, equity percentage bounds, and exactly-one report target.

## 5. Architecture Review

### Strengths

- The schema separates transactional product data from analytics and reputation event streams.
- Swipe and match tables are typed, so the core matching system remains referentially safe.
- Multiple user types, communities, skills, industries, and interests are modeled with scalable join tables.
- Messaging is match-aware but still flexible enough for future direct or support conversations.
- Reputation is auditable because score inputs are not overwritten.

### Tradeoffs and critiques

- Prisma cannot express every useful PostgreSQL constraint. Add hand-written SQL migrations for exactly-one target constraints, numeric bounds, and self-swipe/self-block prevention.
- `AnalyticsEvent` intentionally uses optional foreign keys because it is an event stream. At very high scale, it may be better in a separate analytics database.
- `UserMatch` requires canonical ordering of `userAId` and `userBId`; enforce this in application logic and ideally with a database check constraint.
- Review uniqueness is not fully constrained because reviews can attach to different match types. Add tighter product rules once review eligibility is finalized.
- The schema stores current reputation scores in `UserReputation`; this is useful for reads but should be treated as derived data from `ReputationEvent`.

### Suggested improvements before implementation

- Add PostgreSQL extensions and raw SQL migration constraints for case-insensitive email/username uniqueness if desired.
- Seed canonical `MilestoneDefinition`, `Community`, `Skill`, and `Industry` records.
- Decide whether startup slugs are global or owner-scoped. This schema uses global slugs.
- Define retention policy for raw analytics and deleted messages/media.
- Define moderation visibility rules before exposing reports and blocked-user behavior to matching queries.
