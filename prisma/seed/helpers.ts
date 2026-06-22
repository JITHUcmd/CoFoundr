export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

export function takeRotating<T>(
  items: readonly T[],
  startIndex: number,
  count: number,
): T[] {
  const selected: T[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    selected.push(pick(items, startIndex + offset));
  }

  return selected;
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreBundle(seed: number) {
  const skillsScore = clampScore(58 + ((seed * 7) % 36));
  const founderVisionScore = clampScore(54 + ((seed * 11) % 38));
  const locationScore = clampScore(50 + ((seed * 13) % 40));
  const consistencyScore = clampScore(60 + ((seed * 5) % 35));
  const trustScore = clampScore(62 + ((seed * 3) % 32));
  const builderScore = clampScore(56 + ((seed * 17) % 39));
  const overallScore = clampScore(
    skillsScore * 0.3 +
      founderVisionScore * 0.15 +
      locationScore * 0.1 +
      consistencyScore * 0.03 +
      trustScore * 0.01 +
      builderScore * 0.01 +
      40,
  );

  return {
    matchScore: overallScore,
    compatibilityScore: overallScore,
    skillsScore,
    founderVisionScore,
    locationScore,
    consistencyScore,
    trustScore,
    builderScore,
  };
}
