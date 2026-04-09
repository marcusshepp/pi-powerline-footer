import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface IconSet {
  pi: string;
  model: string;
  folder: string;
  branch: string;
  git: string;
  tokens: string;
  context: string;
  cost: string;
  time: string;
  agents: string;
  cache: string;
  input: string;
  output: string;
  host: string;
  session: string;
  auto: string;
  warning: string;
}

// Separator characters
export const SEP_DOT = " · ";

// Thinking level display text (Unicode/ASCII)
export const THINKING_TEXT_UNICODE: Record<string, string> = {
  minimal: "[min]",
  low: "[low]",
  medium: "[med]",
  high: "[high]",
  xhigh: "[xhi]",
};

// Thinking level display text (Nerd Fonts - with icons)
export const THINKING_TEXT_NERD: Record<string, string> = {
  minimal: "\u{F0E7} min",   // lightning bolt
  low: "\u{F10C} low",       // circle outline
  medium: "\u{F192} med",    // dot circle
  high: "\u{F111} high",     // circle
  xhigh: "\u{F06D} xhi",     // fire
};

// Get thinking text based on font support
export function getThinkingText(level: string): string | undefined {
  if (hasNerdFonts()) {
    return THINKING_TEXT_NERD[level];
  }
  return THINKING_TEXT_UNICODE[level];
}

// Nerd Font icons (matching oh-my-pi exactly)
export const NERD_ICONS: IconSet = {
  pi: "\uE22C",         // nf-oct-pi (stylized pi icon)
  model: "\uEC19",      // nf-md-chip (model/AI chip)
  folder: "\uF115",     // nf-fa-folder_open
  branch: "\uF126",     // nf-fa-code_fork (git branch)
  git: "\uF1D3",        // nf-fa-git (git logo)
  tokens: "\uE26B",     // nf-seti-html (tokens symbol)
  context: "\uE70F",    // nf-dev-database (database)
  cost: "\uF155",       // nf-fa-dollar
  time: "\uF017",       // nf-fa-clock_o
  agents: "\uF0C0",     // nf-fa-users
  cache: "\uF1C0",      // nf-fa-database (cache)
  input: "\uF090",      // nf-fa-sign_in (input arrow)
  output: "\uF08B",     // nf-fa-sign_out (output arrow)
  host: "\uF109",       // nf-fa-laptop (host)
  session: "\uF550",    // nf-md-identifier (session id)
  auto: "\u{F0068}",    // nf-md-lightning_bolt (auto-compact)
  warning: "\uF071",    // nf-fa-warning
};

// ASCII/Unicode fallback icons (matching oh-my-pi)
export const ASCII_ICONS: IconSet = {
  pi: "π",
  model: "◈",
  folder: "📁",
  branch: "⎇",
  git: "⎇",
  tokens: "⊛",
  context: "◫",
  cost: "$",
  time: "◷",
  agents: "AG",
  cache: "cache",
  input: "in:",
  output: "out:",
  host: "host",
  session: "id",
  auto: "⚡",
  warning: "⚠",
};

// Empty icon set — no icons at all
export const NO_ICONS: IconSet = {
  pi: "",
  model: "",
  folder: "",
  branch: "",
  git: "",
  tokens: "",
  context: "",
  cost: "",
  time: "",
  agents: "",
  cache: "",
  input: "",
  output: "",
  host: "",
  session: "",
  auto: "",
  warning: "",
};

// Separator characters
export interface SeparatorChars {
  powerlineLeft: string;
  powerlineRight: string;
  powerlineThinLeft: string;
  powerlineThinRight: string;
  slash: string;
  pipe: string;
  block: string;
  space: string;
  asciiLeft: string;
  asciiRight: string;
  dot: string;
}

export const NERD_SEPARATORS: SeparatorChars = {
  powerlineLeft: "\uE0B0",    // 
  powerlineRight: "\uE0B2",   // 
  powerlineThinLeft: "\uE0B1", // 
  powerlineThinRight: "\uE0B3", // 
  slash: "/",
  pipe: "|",
  block: "█",
  space: " ",
  asciiLeft: ">",
  asciiRight: "<",
  dot: "·",
};

export const ASCII_SEPARATORS: SeparatorChars = {
  powerlineLeft: ">",
  powerlineRight: "<",
  powerlineThinLeft: "|",
  powerlineThinRight: "|",
  slash: "/",
  pipe: "|",
  block: "#",
  space: " ",
  asciiLeft: ">",
  asciiRight: "<",
  dot: ".",
};

// Detect Nerd Font support (check TERM or specific env var)
export function hasNerdFonts(): boolean {
  // User can set this env var to force Nerd Fonts
  if (process.env.POWERLINE_NERD_FONTS === "1") return true;
  if (process.env.POWERLINE_NERD_FONTS === "0") return false;
  
  // Check for Ghostty (survives into tmux via GHOSTTY_RESOURCES_DIR)
  if (process.env.GHOSTTY_RESOURCES_DIR) return true;
  
  // Check common terminals known to support Nerd Fonts (case-insensitive)
  const term = (process.env.TERM_PROGRAM || "").toLowerCase();
  const nerdTerms = ["iterm", "wezterm", "kitty", "ghostty", "alacritty"];
  return nerdTerms.some(t => term.includes(t));
}

// Load icon overrides from ~/.pi/agent/settings.json
// Supports: "powerlineIcons": "none" (disable all icons)
//           "powerlineIcons": { "pi": "", "model": "M", ... } (per-icon override)
let _iconCache: IconSet | null = null;
let _iconCacheTime = 0;
const ICON_CACHE_TTL = 5000;

function loadIconOverrides(): "none" | Partial<IconSet> | null {
  try {
    const home = process.env.HOME || process.env.USERPROFILE || homedir();
    const settingsPath = join(home, ".pi", "agent", "settings.json");
    if (!existsSync(settingsPath)) return null;

    const parsed = JSON.parse(readFileSync(settingsPath, "utf-8"));
    if (!parsed || typeof parsed !== "object") return null;

    const icons = parsed.powerlineIcons;
    if (icons === "none") return "none";
    if (icons && typeof icons === "object" && !Array.isArray(icons)) {
      return icons as Partial<IconSet>;
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

export function getIcons(): IconSet {
  const now = Date.now();
  if (_iconCache && now - _iconCacheTime < ICON_CACHE_TTL) {
    return _iconCache;
  }

  const base = hasNerdFonts() ? NERD_ICONS : ASCII_ICONS;
  const overrides = loadIconOverrides();

  let result: IconSet;
  if (overrides === "none") {
    result = { ...NO_ICONS };
  } else if (overrides) {
    result = { ...base };
    for (const [key, val] of Object.entries(overrides)) {
      if (key in result && typeof val === "string") {
        (result as any)[key] = val;
      }
    }
  } else {
    result = base;
  }

  _iconCache = result;
  _iconCacheTime = now;
  return result;
}

export function getSeparatorChars(): SeparatorChars {
  return hasNerdFonts() ? NERD_SEPARATORS : ASCII_SEPARATORS;
}
