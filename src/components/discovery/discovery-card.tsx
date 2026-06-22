import type {
  CompatibilityScore,
  DiscoveryTarget,
  OpportunityDiscoveryItem,
  StartupDiscoveryItem,
  SwipeAction,
  UserDiscoveryItem,
} from "./discovery.types";

type DiscoveryCardProps = {
  target: DiscoveryTarget;
  item: UserDiscoveryItem | StartupDiscoveryItem | OpportunityDiscoveryItem;
  isSwiping: boolean;
  onSwipe: (target: DiscoveryTarget, targetId: string, action: SwipeAction) => void;
};

function formatEnum(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function locationLabel(item: { country: string | null; state: string | null; city: string | null }) {
  return [item.city, item.state, item.country].filter(Boolean).join(", ") || "Remote-friendly";
}

function CompatibilityBadge({ compatibility }: { compatibility: CompatibilityScore }) {
  return (
    <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Compatibility</p>
      <p className="text-2xl font-semibold text-teal-900">{compatibility.overallScore}%</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function SwipeControls({ disabled, onSwipe }: { disabled: boolean; onSwipe: (action: SwipeAction) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSwipe("LEFT")}
        className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Pass
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSwipe("SUPER_LIKE")}
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Superlike
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSwipe("RIGHT")}
        className="rounded-lg bg-slate-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Interested
      </button>
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return <img src={src} alt="" className="h-14 w-14 rounded-lg object-cover" />;
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-100 text-lg font-bold text-teal-800">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 6).map((tag) => (
        <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

function UserCard({
  item,
  isSwiping,
  onSwipe,
}: {
  item: UserDiscoveryItem;
  isSwiping: boolean;
  onSwipe: (target: DiscoveryTarget, targetId: string, action: SwipeAction) => void;
}) {
  const skills = item.skills.map((skill) => skill.skill.name);
  const industries = item.industries.map((industry) => industry.industry.name);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <Avatar src={item.profilePhotoUrl} name={item.name} />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">{item.name}</h2>
            <p className="text-sm text-slate-500">@{item.username}</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{item.headline ?? "Startup collaborator"}</p>
          </div>
        </div>
        <CompatibilityBadge compatibility={item.compatibility} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{item.bio ?? "Open to meaningful startup collaboration."}</p>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>{locationLabel(item)}</p>
        <p>{formatEnum(item.availability)}</p>
      </div>

      <div className="mt-4 space-y-3">
        <TagList tags={[...skills, ...industries]} />
        <ScoreBar label="Skills" value={item.compatibility.skillsScore} />
        <ScoreBar label="Vision" value={item.compatibility.visionScore} />
      </div>

      <div className="mt-5">
        <SwipeControls disabled={isSwiping} onSwipe={(action) => onSwipe("users", item.id, action)} />
      </div>
    </article>
  );
}

function StartupCard({
  item,
  isSwiping,
  onSwipe,
}: {
  item: StartupDiscoveryItem;
  isSwiping: boolean;
  onSwipe: (target: DiscoveryTarget, targetId: string, action: SwipeAction) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="h-28 rounded-t-lg bg-slate-100">
        {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="h-full w-full rounded-t-lg object-cover" /> : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            <Avatar src={item.logoUrl} name={item.name} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-950">{item.name}</h2>
              <p className="text-sm text-slate-500">{item.industry?.name ?? "Startup"}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{item.tagline ?? "Building an early-stage company."}</p>
            </div>
          </div>
          <CompatibilityBadge compatibility={item.compatibility} />
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {item.description ?? "Explore this startup and its current collaboration needs."}
        </p>

        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>{locationLabel(item)}</p>
          <p>{formatEnum(item.startupStage)} · {formatEnum(item.fundingStage)}</p>
          <p>{item.teamSize ? `${item.teamSize} team members` : "Team size not set"}</p>
          <p>{item.openRolesCount} open roles</p>
        </div>

        <div className="mt-4 space-y-3">
          <TagList tags={[item.hiringStatus, item.workStyle, item.remoteAllowed ? "Remote allowed" : "Location-based"].map(formatEnum)} />
          <ScoreBar label="Location" value={item.compatibility.locationScore} />
          <ScoreBar label="Vision" value={item.compatibility.visionScore} />
        </div>

        <div className="mt-5">
          <SwipeControls disabled={isSwiping} onSwipe={(action) => onSwipe("startups", item.id, action)} />
        </div>
      </div>
    </article>
  );
}

function OpportunityCard({
  item,
  isSwiping,
  onSwipe,
}: {
  item: OpportunityDiscoveryItem;
  isSwiping: boolean;
  onSwipe: (target: DiscoveryTarget, targetId: string, action: SwipeAction) => void;
}) {
  const skills = item.skills.map((skill) => skill.skill.name);
  const compensation =
    item.compensationType === "BOTH"
      ? "Equity and salary"
      : item.compensationType === "EQUITY"
        ? "Equity available"
        : "Salary available";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <Avatar src={item.startup.logoUrl} name={item.startup.name} />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">{item.roleName}</h2>
            <p className="text-sm text-slate-500">{item.startup.name}</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{formatEnum(item.opportunityType)}</p>
          </div>
        </div>
        <CompatibilityBadge compatibility={item.compatibility} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
        {item.description ?? "This startup is looking for a collaborator for an open opportunity."}
      </p>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>{locationLabel(item)}</p>
        <p>{formatEnum(item.experienceLevel)} · {formatEnum(item.commitment)}</p>
        <p>{compensation}</p>
        <p>{item.openings} opening{item.openings === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-4 space-y-3">
        <TagList tags={skills} />
        <ScoreBar label="Skills" value={item.compatibility.skillsScore} />
        <ScoreBar label="Location" value={item.compatibility.locationScore} />
      </div>

      <div className="mt-5">
        <SwipeControls disabled={isSwiping} onSwipe={(action) => onSwipe("opportunities", item.id, action)} />
      </div>
    </article>
  );
}

export function DiscoveryCard({ target, item, isSwiping, onSwipe }: DiscoveryCardProps) {
  if (target === "users") {
    return <UserCard item={item as UserDiscoveryItem} isSwiping={isSwiping} onSwipe={onSwipe} />;
  }

  if (target === "startups") {
    return <StartupCard item={item as StartupDiscoveryItem} isSwiping={isSwiping} onSwipe={onSwipe} />;
  }

  return <OpportunityCard item={item as OpportunityDiscoveryItem} isSwiping={isSwiping} onSwipe={onSwipe} />;
}
