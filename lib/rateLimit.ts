import "server-only";

// A simple speed bump: at most `max` hits per minute for each key (e.g. an IP
// address). Kept in memory, so it resets when the server restarts. That's fine
// here: it stops someone guessing codes quickly, it isn't a wall.
export function rateLimiter(max: number) {
  const hits = new Map<string, number[]>();
  return function tooMany(key: string) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}
