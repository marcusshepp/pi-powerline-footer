export function formatHostLabel(hostname: string): string {
  const shortName = hostname.split(".")[0].trim().toLowerCase();
  return shortName.includes("lugia") ? "lugia" : shortName;
}

export function formatModelLabel(modelName: string): string {
  const normalized = modelName.trim();
  if (/(?:^|\/)gpt-5\.6-so(?:l)?$/i.test(normalized) || /^gpt[- ]5\.6[ -]sol$/i.test(normalized)) {
    return "sol";
  }
  return normalized;
}

export function formatThinkingLabel(level: string): string {
  const labels: Record<string, string> = {
    off: "off",
    minimal: "min",
    low: "low",
    medium: "med",
    high: "high",
    xhigh: "xhigh",
  };
  return labels[level] ?? level;
}

export function formatLastResponseAt(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.month}-${values.day} ${values.hour}:${values.minute}${values.dayPeriod.toLowerCase()} ${values.timeZoneName}`;
}
