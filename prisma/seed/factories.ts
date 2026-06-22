import {
  Availability,
  CommitmentLevel,
  CompensationType,
  ExperienceLevel,
  FundingPreference,
  FundingStage,
  HiringStatus,
  NotificationType,
  OpportunityStatus,
  OpportunityType,
  Prisma,
  RiskAppetite,
  SkillProficiency,
  StartupGoal,
  StartupStage,
  UserStatus,
  UserType,
  VerificationStatus,
  WorkStyle,
} from "@prisma/client";
import { pick, slugify, takeRotating } from "./helpers";

export const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Prisma",
  "PostgreSQL",
  "AI/ML",
  "Product Strategy",
  "UX Design",
  "Growth Marketing",
  "Sales",
  "Fundraising",
  "Cloud Architecture",
  "DevOps",
  "Data Analysis",
  "Mobile Development",
  "Cybersecurity",
  "Finance",
  "Community Building",
  "Go-To-Market",
  "No-Code Automation",
  "Technical Writing",
  "Customer Research",
  "Operations",
] as const;

export const industries = [
  "SaaS",
  "FinTech",
  "EdTech",
  "HealthTech",
  "AI",
  "E-Commerce",
  "ClimateTech",
  "Creator Economy",
  "Gaming",
  "Developer Tools",
  "Social Impact",
  "Productivity",
] as const;

export const interests = [
  "AI Agents",
  "Open Source",
  "No-Code",
  "B2B Sales",
  "Product-Led Growth",
  "Venture Capital",
  "Remote Work",
  "Student Startups",
  "Marketplaces",
  "Cybersecurity",
  "Developer Communities",
  "Impact Entrepreneurship",
] as const;

export const communities = [
  {
    name: "μLearn",
    description: "Peer learning community for builders and students.",
    website: "https://mulearn.org",
  },
  {
    name: "TinkerHub",
    description: "Technology learning community for makers.",
    website: "https://tinkerhub.org",
  },
  {
    name: "IEEE",
    description: "Engineering and technology professional community.",
    website: "https://www.ieee.org",
  },
  {
    name: "IEDC",
    description: "Innovation and entrepreneurship development community.",
    website: "https://iedc.startupmission.in",
  },
  {
    name: "GDSC",
    description: "Student developer community focused on Google technologies.",
    website: "https://developers.google.com/community/gdsc",
  },
  {
    name: "Entrepreneurship Cell",
    description: "Campus entrepreneurship community for founders.",
    website: "https://example.com/ecell",
  },
] as const;

const firstNames = [
  "Aarav",
  "Aditi",
  "Ananya",
  "Arjun",
  "Diya",
  "Ishaan",
  "Kavya",
  "Meera",
  "Nikhil",
  "Priya",
  "Rohan",
  "Sana",
  "Vihaan",
  "Zara",
  "Dev",
  "Maya",
  "Neha",
  "Rahul",
  "Tara",
  "Kabir",
] as const;

const lastNames = [
  "Menon",
  "Nair",
  "Sharma",
  "Iyer",
  "Patel",
  "Kumar",
  "Rao",
  "Kapoor",
  "Das",
  "Verma",
  "Thomas",
  "George",
  "Pillai",
  "Reddy",
  "Singh",
] as const;

const cities = [
  { country: "India", state: "Kerala", city: "Kochi" },
  { country: "India", state: "Karnataka", city: "Bengaluru" },
  { country: "India", state: "Maharashtra", city: "Mumbai" },
  { country: "India", state: "Delhi", city: "New Delhi" },
  { country: "India", state: "Tamil Nadu", city: "Chennai" },
  { country: "United States", state: "California", city: "San Francisco" },
  { country: "United Kingdom", state: "England", city: "London" },
] as const;

const headlines = [
  "Full-stack founder building collaboration tools",
  "Product-minded engineer exploring AI products",
  "Growth strategist helping early teams find traction",
  "Student builder shipping useful weekend projects",
  "Designer focused on founder-friendly user experiences",
  "Operator interested in climate and social impact startups",
] as const;

const startupNames = [
  "NovaLedger",
  "CampusPilot",
  "FoundryAI",
  "GreenLoop",
  "SkillNest",
  "MedAtlas",
  "DevSignal",
  "BrightCart",
  "FlowForge",
  "TrustLayer",
  "LaunchHive",
  "CivicStack",
  "EduSpark",
  "MarketMint",
  "TeamPulse",
  "CloudKind",
  "FinPilot",
  "CreatorOS",
  "OpsGarden",
  "BuildBridge",
  "TalentDock",
  "CareGrid",
  "CarbonCrew",
  "PitchPath",
  "CodeHarbor",
] as const;

const opportunityTitles = [
  "Technical Co-Founder",
  "Business Co-Founder",
  "Product Designer",
  "Full-Stack Developer",
  "Growth Marketer",
  "Advisor",
  "Investor Relations Lead",
  "Product Manager",
  "Backend Developer",
  "Community Lead",
] as const;

const coFounderTypes = [
  "Technical Co-Founder",
  "Business Co-Founder",
  "Product Co-Founder",
  "Growth Co-Founder",
  "Design Co-Founder",
] as const;

export function skillSeedData() {
  return skills.map((name) => ({ name, slug: slugify(name) }));
}

export function industrySeedData() {
  return industries.map((name) => ({ name, slug: slugify(name) }));
}

export function interestSeedData() {
  return interests.map((name) => ({ name, slug: slugify(name) }));
}

export function communitySeedData() {
  return communities.map((community) => ({
    ...community,
    slug: slugify(community.name),
    isVerified: true,
  }));
}

export function buildUserData(index: number) {
  const firstName = pick(firstNames, index);
  const lastName = pick(lastNames, index * 3);
  const name = `${firstName} ${lastName}`;
  const username = `${slugify(firstName)}.${slugify(lastName)}.${String(index + 1).padStart(3, "0")}`;
  const location = pick(cities, index);
  const status =
    index % 9 === 0 ? UserStatus.NOT_LOOKING : index % 2 === 0 ? UserStatus.ACTIVELY_LOOKING : UserStatus.OPEN_TO_OPPORTUNITIES;

  return {
    email: `user${String(index + 1).padStart(3, "0")}@cofoundr.dev`,
    username,
    name,
    profilePhotoUrl: `https://i.pravatar.cc/300?img=${(index % 70) + 1}`,
    headline: pick(headlines, index),
    bio: `${firstName} is a builder interested in ${pick(industries, index)} and ${pick(interests, index + 2).toLowerCase()}. Looking for thoughtful collaborators and practical startup problems.`,
    country: location.country,
    state: location.state,
    city: location.city,
    status,
    availability: pick(
      [
        Availability.FULL_TIME,
        Availability.PART_TIME,
        Availability.CONTRACT,
        Availability.ADVISORY,
        Availability.INVESTOR_ONLY,
      ],
      index,
    ),
  };
}

export function buildUserRoles(index: number): UserType[] {
  if (index === 0) {
    return [UserType.ADMIN, UserType.FOUNDER];
  }

  return [
    pick(
      [
        UserType.FOUNDER,
        UserType.STARTUP_TALENT,
        UserType.INVESTOR,
        UserType.ADVISOR,
        UserType.STUDENT,
        UserType.FREELANCER,
        UserType.RECRUITER,
      ],
      index,
    ),
  ];
}

export function buildFounderVisionData(index: number) {
  return {
    startupGoal: pick(
      [
        StartupGoal.UNICORN,
        StartupGoal.VENTURE_BACKED_STARTUP,
        StartupGoal.BOOTSTRAPPED_SAAS,
        StartupGoal.LIFESTYLE_BUSINESS,
        StartupGoal.AGENCY,
        StartupGoal.OPEN_SOURCE,
        StartupGoal.SOCIAL_IMPACT,
        StartupGoal.AI_STARTUP,
        StartupGoal.E_COMMERCE,
        StartupGoal.SIDE_PROJECT,
      ],
      index,
    ),
    fundingPreference: pick(
      [
        FundingPreference.BOOTSTRAPPED,
        FundingPreference.ANGEL_FUNDING,
        FundingPreference.VENTURE_CAPITAL,
        FundingPreference.CROWDFUNDING,
      ],
      index,
    ),
    riskAppetite: pick([RiskAppetite.LOW, RiskAppetite.MEDIUM, RiskAppetite.HIGH], index),
    commitmentLevel: pick([CommitmentLevel.EXPLORING, CommitmentLevel.PART_TIME, CommitmentLevel.FULL_TIME], index),
    workStyle: pick([WorkStyle.REMOTE, WorkStyle.HYBRID, WorkStyle.IN_PERSON], index),
    preferredTeamSize: 2 + (index % 5),
    preferredCoFounderType: pick(coFounderTypes, index),
    remotePreference: pick([WorkStyle.REMOTE, WorkStyle.HYBRID, WorkStyle.IN_PERSON], index + 1),
  };
}

export function buildStartupData(index: number, ownerId: string, industryId: string) {
  const name = pick(startupNames, index);
  const location = pick(cities, index + 2);
  const remoteAllowed = index % 3 !== 0;

  return {
    ownerId,
    industryId,
    name,
    slug: `${slugify(name)}-${String(index + 1).padStart(2, "0")}`,
    logoUrl: `https://placehold.co/256x256/png?text=${encodeURIComponent(name.slice(0, 2).toUpperCase())}`,
    coverImageUrl: `https://placehold.co/1200x600/png?text=${encodeURIComponent(name)}`,
    tagline: `${pick(industries, index)} tools for ambitious early teams`,
    description: `${name} helps founders validate, launch, and scale with focused workflows for ${pick(industries, index).toLowerCase()} teams.`,
    website: `https://${slugify(name)}.example.com`,
    foundedDate: new Date(Date.UTC(2021 + (index % 5), index % 12, 1 + (index % 20))),
    teamSize: 2 + (index % 12),
    country: location.country,
    state: location.state,
    city: location.city,
    remoteAllowed,
    workStyle: remoteAllowed ? pick([WorkStyle.REMOTE, WorkStyle.HYBRID], index) : WorkStyle.IN_PERSON,
    startupStage: pick(
      [
        StartupStage.IDEA,
        StartupStage.MVP,
        StartupStage.PRE_SEED,
        StartupStage.SEED,
        StartupStage.BETA,
        StartupStage.REVENUE,
        StartupStage.SCALING,
      ],
      index,
    ),
    fundingStage: pick(
      [
        FundingStage.BOOTSTRAPPED,
        FundingStage.FUNDRAISING_NOW,
        FundingStage.PRE_SEED,
        FundingStage.SEED,
        FundingStage.SERIES_A,
      ],
      index,
    ),
    fundingTargetAmount: index % 3 === 0 ? new Prisma.Decimal(50000 + index * 25000) : null,
    hiringStatus: pick([HiringStatus.HIRING, HiringStatus.NOT_HIRING, HiringStatus.PAUSED], index),
    openRolesCount: 1 + (index % 5),
    equityAvailable: index % 2 === 0,
    salaryAvailable: index % 4 !== 0,
    verificationStatus: pick(
      [VerificationStatus.VERIFIED, VerificationStatus.PENDING, VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
      index,
    ),
    profileViewsCount: 80 + index * 13,
    followersCount: 12 + index * 4,
    savesCount: 6 + index * 3,
    applicationsCount: 4 + index * 2,
  };
}

export function buildOpportunityData(index: number, startupId: string) {
  const title = pick(opportunityTitles, index);
  const location = pick(cities, index + 4);
  const compensationType = pick([CompensationType.EQUITY, CompensationType.SALARY, CompensationType.BOTH], index);

  return {
    startupId,
    roleName: title,
    opportunityType: pick(
      [
        OpportunityType.TECHNICAL_CO_FOUNDER,
        OpportunityType.BUSINESS_CO_FOUNDER,
        OpportunityType.ADVISOR,
        OpportunityType.INVESTOR,
        OpportunityType.DEVELOPER,
        OpportunityType.DESIGNER,
        OpportunityType.PRODUCT_MANAGER,
        OpportunityType.MARKETING,
        OpportunityType.OTHER,
      ],
      index,
    ),
    description: `Join the team as ${title.toLowerCase()} to help shape product, growth, and execution for a promising early-stage startup.`,
    openings: 1 + (index % 3),
    experienceLevel: pick(
      [ExperienceLevel.ENTRY, ExperienceLevel.MID, ExperienceLevel.SENIOR, ExperienceLevel.LEAD, ExperienceLevel.ANY],
      index,
    ),
    compensationType,
    equityMinPercent:
      compensationType === CompensationType.EQUITY || compensationType === CompensationType.BOTH
        ? new Prisma.Decimal(0.25 + (index % 5) * 0.5)
        : null,
    equityMaxPercent:
      compensationType === CompensationType.EQUITY || compensationType === CompensationType.BOTH
        ? new Prisma.Decimal(1 + (index % 6))
        : null,
    salaryMin:
      compensationType === CompensationType.SALARY || compensationType === CompensationType.BOTH
        ? 600000 + index * 25000
        : null,
    salaryMax:
      compensationType === CompensationType.SALARY || compensationType === CompensationType.BOTH
        ? 1000000 + index * 35000
        : null,
    salaryCurrency:
      compensationType === CompensationType.SALARY || compensationType === CompensationType.BOTH ? "INR" : null,
    commitment: pick([CommitmentLevel.EXPLORING, CommitmentLevel.PART_TIME, CommitmentLevel.FULL_TIME], index),
    remoteAllowed: index % 4 !== 0,
    workStyle: pick([WorkStyle.REMOTE, WorkStyle.HYBRID, WorkStyle.IN_PERSON], index),
    country: location.country,
    state: location.state,
    city: location.city,
    status: index % 12 === 0 ? OpportunityStatus.PAUSED : OpportunityStatus.OPEN,
    viewsCount: 25 + index * 5,
    savesCount: 3 + index,
    applicationsCount: 1 + (index % 7),
  };
}

export function userSkillConnections(skillIds: string[], index: number) {
  return takeRotating(skillIds, index, 4 + (index % 3)).map((skillId, skillIndex) => ({
    skillId,
    proficiency: pick(
      [SkillProficiency.BEGINNER, SkillProficiency.INTERMEDIATE, SkillProficiency.ADVANCED, SkillProficiency.EXPERT],
      index + skillIndex,
    ),
    yearsExperience: 1 + ((index + skillIndex) % 8),
    isPrimary: skillIndex < 2,
  }));
}

export function notificationCopy(type: NotificationType) {
  switch (type) {
    case NotificationType.MATCH_CREATED:
      return {
        title: "New match created",
        content: "You have a new match ready for collaboration.",
      };
    case NotificationType.NEW_MESSAGE:
      return {
        title: "New message",
        content: "A match sent you a new message.",
      };
    case NotificationType.APPLICATION_RECEIVED:
      return {
        title: "New application received",
        content: "A candidate applied to one of your startup opportunities.",
      };
    case NotificationType.APPLICATION_ACCEPTED:
      return {
        title: "Application accepted",
        content: "Your application was accepted by the startup team.",
      };
    case NotificationType.APPLICATION_REJECTED:
      return {
        title: "Application update",
        content: "A startup reviewed your application.",
      };
    default:
      return {
        title: "CoFoundr update",
        content: "You have a new CoFoundr notification.",
      };
  }
}
