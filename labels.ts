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
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}
