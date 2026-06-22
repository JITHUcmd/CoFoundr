# CoFoundr Backend API Architecture

This document designs the backend API layer only. It does not modify the approved database schema and does not include frontend, React, UI, Prisma schema, or API implementation code.

## 1. API Folder Structure

```text
/api
  /auth
    /email
    /google
    /sessions
    /password
  /users
    /me
    /:userId
  /profiles
    /me
    /:userId
    /skills
    /experience
    /education
    /portfolio
    /vision
  /startups
    /:startupId
    /:startupId/members
    /:startupId/media
  /opportunities
    /:opportunityId
    /:opportunityId/applications
  /swipes
    /users
    /startups
    /opportunities
  /matches
    /users
    /startups
    /opportunities
  /conversations
    /:conversationId
    /:conversationId/messages
    /:conversationId/read-receipts
  /media
    /uploads
  /verification
    /linkedin
    /github
    /company-email
    /startups
  /reputation
    /me
    /:userId
    /milestones
  /reviews
    /:reviewId
  /follows
    /users
    /startups
  /saved
    /profiles
    /startups
    /opportunities
  /applications
    /:applicationId
  /notifications
    /:notificationId
  /analytics
    /events
    /metrics
  /admin
    /reports
    /moderation-actions
    /users
    /startups
    /verification
```

Recommended internal service boundaries:

- `AuthService`: identity, sessions, password reset, OAuth callbacks.
- `ProfileService`: profile, skills, education, experience, portfolio, founder vision.
- `StartupService`: startups, members, opportunities, startup media.
- `DiscoveryService`: feed candidates, swipe writes, match detection.
- `MatchService`: match lifecycle and conversation creation.
- `MessagingService`: conversations, messages, attachments, receipts.
- `VerificationService`: user and startup verification review state.
- `ReputationService`: score events, score recalculation, milestones.
- `NotificationService`: notification writes, unread counts, delivery fanout.
- `SafetyService`: reports, blocks, moderation actions.
- `AnalyticsService`: event ingestion and aggregate metric reads.

## 2. Authentication Flow

### Signup

1. Client submits email, password, username, name, and initial roles.
2. API validates email format, password strength, username uniqueness, and role enum values.
3. API creates user, password credential record in the auth provider or auth store, default profile state, and session.
4. API returns user summary plus session cookie or access token metadata.
5. API sends email verification notification if email verification is required.

### Login

1. Client submits email and password.
2. API rate-limits by IP, email, and device fingerprint.
3. API verifies credentials.
4. API creates a session and returns the authenticated user summary.
5. Failed attempts are logged for abuse detection.

### Logout

1. Client calls logout with the current session.
2. API invalidates the session token or refresh token.
3. API clears session cookie if cookie auth is used.

### Session validation

1. Auth middleware reads secure cookie or bearer token.
2. Middleware validates signature, expiry, revocation state, and user status.
3. Middleware attaches `auth.userId`, `auth.roles`, and `auth.sessionId` to the request context.
4. Route handlers apply resource-level authorization.

### Password reset

1. Client requests reset by email.
2. API always returns a neutral success response to prevent account enumeration.
3. API creates a short-lived reset token and sends email.
4. Client submits token and new password.
5. API validates token, updates password, invalidates active sessions, and logs the event.

### Google OAuth

1. Client requests Google OAuth start.
2. API returns or redirects to Google authorization URL with state and PKCE.
3. Google redirects to callback with code and state.
4. API validates state, exchanges code, verifies Google identity, and links or creates user.
5. API creates session and redirects or returns session response.

### Auth middleware

- `requireAuth`: request must have valid session.
- `optionalAuth`: request may include session for personalized reads.
- `requireRole(...roles)`: user must have one of the required roles.
- `requireAdmin`: user must be admin.
- `requireStartupOwnerOrMember`: user must own or belong to startup with required permission.
- `requireConversationParticipant`: user must belong to the conversation.
- `requireApplicationReviewer`: user must own the related startup or have startup reviewer access.

## 3. Authorization Rules

### Founder

- Can manage their own profile, founder vision, startups, startup members, startup media, and opportunities.
- Can review applications for startups they own or administrate.
- Can swipe, match, message matched users, follow, save, review collaborators, and complete milestones.
- Cannot access another startup's private applications, moderation tools, or admin analytics.

### Investor

- Can manage their own profile and investor-facing portfolio.
- Can discover, follow, and save profiles, startups, and opportunities.
- Can match and message after matching.
- Can submit verification and reviews.
- Cannot edit startups they do not own or review opportunity applications unless also a startup owner/member with permission.

### Advisor

- Can manage their own profile, portfolio, verification, and availability.
- Can discover, follow, save, match, message, review, and be added to startup teams.
- Can view startup/opportunity information available to matched or authorized users.
- Cannot manage startup opportunities unless they own or are granted startup role access.

### Recruiter

- Can manage their own profile.
- Can discover, follow, and save candidate profiles and opportunities.
- Can message after matching.
- Can create startup opportunities only for startups they own or administrate.
- Cannot access admin moderation or unrelated private applications.

### Admin

- Can read and moderate reports, users, startups, opportunities, verification submissions, and abusive content.
- Can approve or reject verification.
- Can suspend users, resolve reports, and view operational analytics.
- Should not read private message bodies unless explicitly allowed by policy and audited.

## 4. REST API Endpoints

All responses use the standard envelope described in section 13. `Auth` values:

- `Public`: no session required.
- `Optional`: session enriches response.
- `User`: valid session required.
- `Owner`: owner or authorized manager required.
- `Participant`: conversation participant required.
- `Reviewer`: startup owner or authorized reviewer required.
- `Admin`: admin required.

### Auth

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/auth/email/signup` | `{email,password,username,name,roles[]}` | `{user,session}` | Valid email, strong password, unique email/username, valid roles | Public |
| POST | `/api/auth/email/login` | `{email,password}` | `{user,session}` | Valid email, non-empty password, rate-limited | Public |
| POST | `/api/auth/logout` | `{}` | `{loggedOut:true}` | Valid session if present | User |
| GET | `/api/auth/session` | None | `{user,session}` | Session token must be valid | User |
| POST | `/api/auth/password/forgot` | `{email}` | `{accepted:true}` | Valid email, neutral response | Public |
| POST | `/api/auth/password/reset` | `{token,newPassword}` | `{reset:true}` | Valid token, strong password | Public |
| GET | `/api/auth/google/start` | None | `{authorizationUrl}` | Generates state and PKCE | Public |
| POST | `/api/auth/google/callback` | `{code,state}` | `{user,session}` | Valid state, valid Google identity | Public |

### Users

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/users/me` | None | `{user}` | Session user must exist | User |
| PATCH | `/api/users/me` | `{name,username,headline,bio,location,status,availability}` | `{user}` | Unique username, valid enum values, length limits | User |
| GET | `/api/users/:userId` | None | `{user}` | Valid UUID, public or matched visibility rules | Optional |
| DELETE | `/api/users/me` | `{reason?}` | `{deleted:true}` | Confirm active session | User |
| GET | `/api/users` | Query `{q,role,skill,industry,city,status,page}` | `{items,page}` | Bounded page size, valid filters | User |

### Profiles

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/profiles/me` | None | `{profile}` | Session user must exist | User |
| PATCH | `/api/profiles/me` | `{headline,bio,country,state,city,status,availability}` | `{profile}` | Length limits, valid enums | User |
| GET | `/api/profiles/:userId` | None | `{profile}` | Valid UUID and visibility rules | Optional |
| PUT | `/api/profiles/me/skills` | `{skills:[{skillId,proficiency,yearsExperience,isPrimary}]}` | `{skills}` | Valid skill ids, no duplicates | User |
| POST | `/api/profiles/me/experience` | `{companyName,title,industryId,startDate,endDate,isCurrent,description}` | `{experience}` | Date order, required company/title | User |
| PATCH | `/api/profiles/me/experience/:experienceId` | Same as create partial | `{experience}` | Own experience, date order | User |
| DELETE | `/api/profiles/me/experience/:experienceId` | None | `{deleted:true}` | Own experience | User |
| POST | `/api/profiles/me/education` | `{institution,degree,field,startDate,endDate,description}` | `{education}` | Required institution, date order | User |
| PATCH | `/api/profiles/me/education/:educationId` | Same as create partial | `{education}` | Own education | User |
| DELETE | `/api/profiles/me/education/:educationId` | None | `{deleted:true}` | Own education | User |
| POST | `/api/profiles/me/portfolio` | `{type,label,url,isPrimary}` | `{portfolioLink}` | Valid URL, valid type | User |
| PATCH | `/api/profiles/me/portfolio/:linkId` | Same as create partial | `{portfolioLink}` | Own link, valid URL | User |
| DELETE | `/api/profiles/me/portfolio/:linkId` | None | `{deleted:true}` | Own link | User |

### Founder Vision

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/profiles/me/vision` | None | `{founderVision}` | Session user must exist | User |
| PUT | `/api/profiles/me/vision` | `{startupGoal,fundingPreference,riskAppetite,commitmentLevel,workStyle}` | `{founderVision}` | Valid enum values | User |
| GET | `/api/profiles/:userId/vision` | None | `{founderVision}` | Valid UUID and visibility rules | Optional |

### Startups

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/startups` | Query `{q,industryId,stage,fundingStage,remoteAllowed,page}` | `{items,page}` | Bounded page size, valid filters | Optional |
| POST | `/api/startups` | `{name,slug,tagline,description,industryId,website,teamSize,remoteAllowed,startupStage,fundingStage}` | `{startup}` | Unique slug, valid URL/enums, required name | User |
| GET | `/api/startups/:startupId` | None | `{startup}` | Valid UUID, visibility rules | Optional |
| PATCH | `/api/startups/:startupId` | Same as create partial | `{startup}` | Owner or authorized member, valid fields | Owner |
| DELETE | `/api/startups/:startupId` | `{reason?}` | `{archived:true}` | Owner only, no active restricted dependencies | Owner |
| GET | `/api/startups/:startupId/members` | None | `{items}` | Valid startup id | Optional |
| POST | `/api/startups/:startupId/members` | `{userId,role,isFounder}` | `{member}` | Owner, valid user, no duplicate member | Owner |
| PATCH | `/api/startups/:startupId/members/:memberId` | `{role,isFounder,leftAt}` | `{member}` | Owner, valid member | Owner |
| DELETE | `/api/startups/:startupId/members/:memberId` | None | `{removed:true}` | Owner, cannot remove sole owner | Owner |

### Startup Opportunities

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/opportunities` | Query `{q,startupId,skillId,compensationType,commitment,status,page}` | `{items,page}` | Bounded page size, valid filters | Optional |
| POST | `/api/startups/:startupId/opportunities` | `{roleName,description,openings,compensationType,equityMinPercent,equityMaxPercent,salaryMin,salaryMax,salaryCurrency,commitment,skills[]}` | `{opportunity}` | Owner, valid compensation, openings > 0 | Owner |
| GET | `/api/opportunities/:opportunityId` | None | `{opportunity}` | Valid UUID, visibility rules | Optional |
| PATCH | `/api/opportunities/:opportunityId` | Same as create partial | `{opportunity}` | Startup owner/member, valid fields | Owner |
| POST | `/api/opportunities/:opportunityId/close` | `{reason?}` | `{opportunity}` | Owner, opportunity must be open or paused | Owner |
| DELETE | `/api/opportunities/:opportunityId` | `{reason?}` | `{closed:true}` | Owner, soft close preferred | Owner |

### Swipes

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/swipes/users` | `{targetUserId,action}` | `{swipe,match?,conversation?}` | Valid target, no self-swipe, valid action, not blocked | User |
| POST | `/api/swipes/startups` | `{targetStartupId,action}` | `{swipe,match?,conversation?}` | Valid startup, valid action | User |
| POST | `/api/swipes/opportunities` | `{targetOpportunityId,action}` | `{swipe,match?,conversation?}` | Valid opportunity, valid action | User |
| GET | `/api/swipes/me` | Query `{targetType,page}` | `{items,page}` | Valid target type, bounded page | User |

### Matches

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/matches/users` | Query `{status,page}` | `{items,page}` | Valid status, bounded page | User |
| GET | `/api/matches/startups` | Query `{status,page}` | `{items,page}` | Valid status, bounded page | User |
| GET | `/api/matches/opportunities` | Query `{status,page}` | `{items,page}` | Valid status, bounded page | User |
| GET | `/api/matches/:matchType/:matchId` | None | `{match}` | Valid type/id, participant only | User |
| POST | `/api/matches/:matchType/:matchId/unmatch` | `{reason?}` | `{match}` | Participant only, active match | User |

### Messaging

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/conversations` | Query `{page,archived}` | `{items,page}` | Bounded page | User |
| POST | `/api/conversations` | `{matchType,matchId}` | `{conversation}` | Active match, participant only | User |
| GET | `/api/conversations/:conversationId` | None | `{conversation}` | Participant only | Participant |
| PATCH | `/api/conversations/:conversationId` | `{archived,muted}` | `{conversationParticipant}` | Participant only | Participant |
| GET | `/api/conversations/:conversationId/messages` | Query `{before,limit}` | `{items,page}` | Participant, cursor pagination | Participant |
| POST | `/api/conversations/:conversationId/messages` | `{body,attachmentIds[]}` | `{message}` | Participant, non-empty body or attachment, rate-limited | Participant |
| PATCH | `/api/conversations/:conversationId/messages/:messageId` | `{body}` | `{message}` | Sender only, edit window | Participant |
| DELETE | `/api/conversations/:conversationId/messages/:messageId` | None | `{deleted:true}` | Sender or admin policy | Participant |
| POST | `/api/conversations/:conversationId/read-receipts` | `{messageId}` | `{readReceipt}` | Participant, message in conversation | Participant |
| POST | `/api/media/uploads` | `{fileName,mimeType,sizeBytes,purpose}` | `{uploadUrl,mediaAsset}` | Allowed file type/size, virus scan required | User |

### Verification

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/verification/linkedin` | `{profileUrl,evidenceUrl?}` | `{verification}` | Valid LinkedIn URL, no duplicate active request | User |
| POST | `/api/verification/github` | `{username,evidenceUrl?}` | `{verification}` | Valid username, no duplicate active request | User |
| POST | `/api/verification/company-email` | `{companyEmail}` | `{verification}` | Valid email, domain rules | User |
| POST | `/api/verification/startups` | `{startupId,evidenceUrl}` | `{verification}` | Owner, valid startup, evidence required | Owner |
| GET | `/api/verification/me` | None | `{items}` | Session user | User |

### Reputation and Milestones

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/reputation/me` | None | `{reputation,events}` | Session user | User |
| GET | `/api/reputation/:userId` | None | `{reputation}` | Valid UUID, visibility rules | Optional |
| GET | `/api/reputation/milestones` | Query `{startupId,status,page}` | `{items,page}` | Own milestones unless public profile view | User |
| POST | `/api/reputation/milestones` | `{milestoneDefinitionId,startupId,evidenceUrl}` | `{milestone}` | Valid definition, owned/linked startup | User |
| PATCH | `/api/reputation/milestones/:milestoneId` | `{status,evidenceUrl}` | `{milestone}` | Own milestone, valid status transition | User |

### Reviews

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/reviews` | Query `{userId,page}` | `{items,page}` | Valid user, public review visibility | Optional |
| POST | `/api/reviews` | `{reviewedUserId,matchType,matchId,communicationRating,reliabilityRating,technicalSkillRating,overallRating,writtenFeedback}` | `{review}` | Active or completed collaboration, ratings 1-5, no duplicate disallowed review | User |
| PATCH | `/api/reviews/:reviewId` | `{writtenFeedback,status?}` | `{review}` | Reviewer edit window or admin | User |
| DELETE | `/api/reviews/:reviewId` | `{reason?}` | `{removed:true}` | Reviewer edit window or admin | User |

### Follow System

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/follows/users` | `{followingId}` | `{follow}` | Valid user, no self-follow, no duplicate, not blocked | User |
| DELETE | `/api/follows/users/:followingId` | None | `{unfollowed:true}` | Existing follow owned by user | User |
| GET | `/api/follows/users/:userId/followers` | Query `{page}` | `{items,page}` | Valid user, bounded page | Optional |
| GET | `/api/follows/users/:userId/following` | Query `{page}` | `{items,page}` | Valid user, bounded page | Optional |
| POST | `/api/follows/startups` | `{startupId}` | `{follow}` | Valid startup, no duplicate | User |
| DELETE | `/api/follows/startups/:startupId` | None | `{unfollowed:true}` | Existing follow owned by user | User |
| GET | `/api/follows/startups/:startupId/followers` | Query `{page}` | `{items,page}` | Valid startup, bounded page | Owner |

### Save System

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/saved/profiles` | `{savedUserId}` | `{savedProfile}` | Valid user, no duplicate | User |
| DELETE | `/api/saved/profiles/:savedUserId` | None | `{removed:true}` | Existing save owned by user | User |
| GET | `/api/saved/profiles` | Query `{page}` | `{items,page}` | Bounded page | User |
| POST | `/api/saved/startups` | `{startupId}` | `{savedStartup}` | Valid startup, no duplicate | User |
| DELETE | `/api/saved/startups/:startupId` | None | `{removed:true}` | Existing save owned by user | User |
| GET | `/api/saved/startups` | Query `{page}` | `{items,page}` | Bounded page | User |
| POST | `/api/saved/opportunities` | `{opportunityId}` | `{savedOpportunity}` | Valid opportunity, no duplicate | User |
| DELETE | `/api/saved/opportunities/:opportunityId` | None | `{removed:true}` | Existing save owned by user | User |
| GET | `/api/saved/opportunities` | Query `{page}` | `{items,page}` | Bounded page | User |

### Applications

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/opportunities/:opportunityId/applications` | `{note}` | `{application}` | Opportunity open, applicant not startup owner if disallowed, no active pending application | User |
| GET | `/api/applications/me` | Query `{status,page}` | `{items,page}` | Valid status, bounded page | User |
| GET | `/api/opportunities/:opportunityId/applications` | Query `{status,page}` | `{items,page}` | Startup owner/reviewer, valid status | Reviewer |
| GET | `/api/applications/:applicationId` | None | `{application}` | Applicant or reviewer | User |
| POST | `/api/applications/:applicationId/accept` | `{reviewNote?}` | `{application}` | Reviewer, status must be pending | Reviewer |
| POST | `/api/applications/:applicationId/reject` | `{reviewNote?}` | `{application}` | Reviewer, status must be pending | Reviewer |
| POST | `/api/applications/:applicationId/withdraw` | `{reason?}` | `{application}` | Applicant, status must be pending | User |

### Notifications

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/notifications` | Query `{isRead,page}` | `{items,page,unreadCount}` | Bounded page, optional read filter | User |
| PATCH | `/api/notifications/:notificationId/read` | `{isRead:true}` | `{notification}` | Own notification | User |
| POST | `/api/notifications/read-all` | `{before?}` | `{updatedCount}` | Own notifications only | User |
| DELETE | `/api/notifications/:notificationId` | None | `{deleted:true}` | Own notification | User |

### Analytics

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| POST | `/api/analytics/events` | `{eventType,entityType,entityId,metadata}` | `{accepted:true}` | Valid event/entity type, rate-limited | User |
| GET | `/api/analytics/me` | Query `{metricType,from,to}` | `{metrics}` | Date range limit, own entities only | User |
| GET | `/api/analytics/startups/:startupId` | Query `{metricType,from,to}` | `{metrics}` | Owner/reviewer access | Owner |
| GET | `/api/analytics/opportunities/:opportunityId` | Query `{metricType,from,to}` | `{metrics}` | Startup owner/reviewer access | Owner |

### Admin

| Method | Route | Request Body | Response Body | Validation Rules | Auth |
|---|---|---|---|---|---|
| GET | `/api/admin/reports` | Query `{status,reason,page}` | `{items,page}` | Valid filters | Admin |
| GET | `/api/admin/reports/:reportId` | None | `{report}` | Valid UUID | Admin |
| PATCH | `/api/admin/reports/:reportId` | `{status,assignedModeratorId,resolution}` | `{report}` | Valid status transition | Admin |
| POST | `/api/admin/moderation-actions` | `{reportId,targetType,targetId,action,notes}` | `{moderationAction}` | Valid target/action, audited | Admin |
| GET | `/api/admin/users` | Query `{q,status,role,page}` | `{items,page}` | Bounded page | Admin |
| PATCH | `/api/admin/users/:userId` | `{status,moderationNote}` | `{user}` | Valid admin action, audited | Admin |
| GET | `/api/admin/startups` | Query `{q,verificationStatus,page}` | `{items,page}` | Bounded page | Admin |
| PATCH | `/api/admin/verification/:verificationType/:verificationId` | `{status,reviewNote}` | `{verification}` | Valid verification type/status | Admin |

## 5. Swipe Flow

### User swipes right on user

1. Client calls `POST /api/swipes/users` with `{targetUserId, action:"RIGHT"}`.
2. Auth middleware validates session.
3. API checks target exists, users are not blocked, and user is not swiping themselves.
4. Discovery service upserts or creates `UserSwipe`.
5. Match service checks whether target user already swiped right or super-liked the actor.
6. If mutual, match service creates `UserMatch` and `Conversation` in one transaction.
7. Notification service creates match notifications for both users.
8. API returns `{swipe, match, conversation}`.

### User swipes right on startup

1. Client calls `POST /api/swipes/startups`.
2. API writes `StartupSwipe`.
3. If startup matching policy is satisfied, API creates `UserStartupMatch`.
4. API creates or links a conversation with authorized startup participants.
5. API creates notifications for startup owner/admins and swiper.

### User swipes right on opportunity

1. Client calls `POST /api/swipes/opportunities`.
2. API writes `OpportunitySwipe`.
3. If opportunity matching policy is satisfied, API creates `UserOpportunityMatch`.
4. API creates conversation and notifications for applicant and startup reviewers.

Left swipes write the swipe only. Super likes follow the same path as right swipes but use higher-ranking notification and discovery signals.

## 6. Match Flow

### User <-> User

- Created when both users right swipe or super like each other.
- Starts as `ACTIVE`.
- Creates a conversation with both users as participants.
- Can transition to `UNMATCHED` by either participant.
- Can transition to `EXPIRED` by scheduled cleanup if product rules define expiry.

### User <-> Startup

- Created when user interest and startup-side interest or acceptance policy align.
- Conversation includes the user and startup owner or designated startup members.
- Can be unmatched by the user or startup owner/member.

### User <-> Opportunity

- Created from mutual discovery interest or accepted application policy.
- Conversation includes applicant and opportunity reviewers.
- Can coexist with `Application`; application status should drive hiring workflow, match status drives communication/discovery lifecycle.

## 7. Messaging Flow

1. Conversation creation: `POST /api/conversations` with `matchType` and `matchId`.
2. API validates active match and participant rights.
3. API creates conversation if one does not exist.
4. Send message: `POST /api/conversations/:conversationId/messages`.
5. API validates participant, message size, attachment ownership, and rate limits.
6. API stores message and attachments in a transaction.
7. Notification service creates message notifications for other participants.
8. Read message: `POST /api/conversations/:conversationId/read-receipts`.
9. API writes `MessageReadReceipt` and updates participant `lastReadAt` or `lastReadMessageId`.
10. Attachment upload: `POST /api/media/uploads` returns a signed upload URL, then message send references completed media ids.

## 8. Notification Flow

Triggers and recipients:

- Match created: notify all match participants.
- Message received: notify conversation participants except sender.
- Application submitted: notify startup owner and authorized reviewers.
- Application accepted: notify applicant.
- Application rejected: notify applicant if product policy allows.
- Review received: notify reviewed user.
- Follow received: notify followed user or startup owner/admins.

API sequence:

1. Domain action completes inside a transaction.
2. Domain service emits notification intent.
3. Notification service writes `Notification` rows.
4. Realtime delivery layer publishes to connected clients if available.
5. Client fetches `GET /api/notifications` and marks reads with notification endpoints.

## 9. Builder Score Flow

- Milestone completed: create milestone, create `ReputationEvent` with builder delta, recalculate `UserReputation.builderScore`.
- Startup created: create startup, create activity reputation event, increment builder score if profile quality checks pass.
- Profile completed: profile completeness job emits builder or trust event once thresholds are met.
- Activity recorded: high-value actions such as meaningful startup progress, opportunity creation, or verified engagement emit bounded builder events.

Score updates should be idempotent. Use source ids on reputation events to avoid duplicate scoring for the same milestone or activity.

## 10. Trust Score Flow

- Verification approved: verification status changes to verified, badge may be awarded, trust score event is created.
- Review submitted: published reviews create collaboration and trust score effects for the reviewed user.
- Report received: report creation does not immediately reduce score unless confirmed or weighted by abuse policy. Confirmed moderation actions can create negative trust events.

Trust score should never be based only on unreviewed accusations. Moderator outcome and report quality should matter.

## 11. Rate Limiting

Recommended limits:

| Area | Limit | Key | Notes |
|---|---:|---|---|
| Login | 5 attempts per 15 minutes | IP + email | Add progressive delay |
| Password reset | 3 requests per hour | email + IP | Neutral response |
| Messaging | 60 messages per minute | userId | Lower for new/unverified accounts |
| Attachments | 20 uploads per hour | userId | Size and type limits also apply |
| Swiping | 300 swipes per day | userId | Super likes can have stricter quota |
| Applications | 30 applications per day | userId | Prevent spam applications |
| Reviews | 10 reviews per day | userId | Require valid collaboration |
| Follows | 100 follows per day | userId | Detect burst behavior |
| Analytics events | 120 events per minute | userId + sessionId | Drop or sample excess |

## 12. Security

- Authentication: secure HTTP-only cookies or short-lived bearer tokens plus refresh rotation.
- Authorization: route-level middleware plus resource-level checks in services.
- CSRF: required for cookie-based auth on state-changing routes, use SameSite cookies and CSRF tokens.
- Input validation: validate every request with strict schemas, enum allowlists, length limits, and UUID parsing.
- File upload validation: signed URLs, MIME allowlist, extension checks, size caps, malware scanning, and media ownership checks.
- Spam prevention: rate limits, new-account throttles, duplicate detection, and review/application eligibility checks.
- Abuse prevention: block checks before matching/messaging, report workflows, moderation audit logs, and notification throttling.
- Privacy: hide private application lists, verification evidence, email addresses, and moderation data from unauthorized users.
- Logging: never log passwords, reset tokens, OAuth codes, private message bodies, or verification evidence URLs in plaintext.

## 13. Error Handling

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Validation error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{"field": "email", "message": "Invalid email."}]
  }
}
```

### Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

### Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this resource."
  }
}
```

### Not found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found."
  }
}
```

### Server error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong."
  }
}
```

## 14. Architecture Review

### Weaknesses

- REST endpoints are clear but numerous. Without strong service boundaries, route handlers can become large and duplicate authorization logic.
- Match creation spans discovery, matching, messaging, analytics, and notifications. This should be transactional for core writes and asynchronous for side effects.
- Application, review, and moderation workflows need precise product policies to avoid ambiguous permissions.
- Admin access can become too broad unless every action is audited and scoped.

### Scalability risks

- Swipe and analytics writes can become the highest-volume endpoints.
- Messaging fanout and notification delivery can create write spikes.
- Discovery feed queries can become slow if they try to rank directly from normalized profile tables.
- Reviews and reports can be abused without eligibility checks and rate limits.

### Improvements before implementation

- Define OpenAPI specs from this architecture before coding.
- Create shared validation schemas and resource authorization policies.
- Use background jobs for notifications, reputation recalculation, analytics rollups, and email delivery.
- Use cursor pagination everywhere feed-like or chat-like data is read.
- Add idempotency keys for swipes, applications, message sends, verification submissions, and moderation actions.
- Add observability around match creation, message delivery, application decisions, verification review time, and report resolution time.
