import { homedir, hostname as osHostname } from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";

import {
  formatHostLabel,
  formatLastResponseAt,
  formatModelLabel,
  formatThinkingLabel,
} from "./labels.js";

const LAST_RESPONSE_PATH = join(homedir(), ".pi", "agent", "last-response.json");

function persistedLastResponseTimestamp(): number | null {
  try {
    const timestamp = JSON.parse(readFileSync(LAST_RESPONSE_PATH, "utf8")).timestamp;
    return typeof timestamp === "number" && Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

function persistLastResponseTimestamp(timestamp: number): void {
  try {
    writeFileSync(LAST_RESPONSE_PATH, `${JSON.stringify({ timestamp })}\n`, "utf8");
  } catch {
    // The footer should never interrupt Pi if state persistence is unavailable.
  }
}

function latestAssistantTimestamp(ctx: any): number | null {
  const branch = ctx.sessionManager?.getBranch?.() ?? [];
  for (let index = branch.length - 1; index >= 0; index -= 1) {
    const entry = branch[index];
    if (entry?.type !== "message" || entry.message?.role !== "assistant") continue;
    if (entry.message.stopReason === "error" || entry.message.stopReason === "aborted") continue;

    const timestamp = typeof entry.message.timestamp === "number"
      ? entry.message.timestamp
      : typeof entry.timestamp === "string"
        ? Date.parse(entry.timestamp)
        : NaN;
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

export default function syncFooter(pi: ExtensionAPI) {
  let currentContext: any = null;
  let lastResponseTime = Date.now();
  let requestRender: (() => void) | null = null;

  const redraw = (ctx: any) => {
    currentContext = ctx;
    requestRender?.();
  };

  pi.registerCommand("exit", {
    description: "Exit Pi cleanly",
    handler: async (_args, ctx) => {
      ctx.shutdown();
    },
  });

  pi.registerCommand("clear", {
    description: "Clear the conversation and start a fresh session",
    handler: async (_args, ctx) => {
      await ctx.newSession({
        withSession: async (replacementCtx) => {
          replacementCtx.ui.notify("Conversation cleared", "info");
        },
      });
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    currentContext = ctx;
    lastResponseTime = latestAssistantTimestamp(ctx) ?? persistedLastResponseTimestamp() ?? Date.now();
    if (!ctx.hasUI) return;

    ctx.ui.setFooter((tui: any, theme: Theme) => {
      requestRender = () => tui.requestRender();
      return {
        dispose() {
          requestRender = null;
        },
        invalidate() {},
        render(width: number): string[] {
          const active = currentContext ?? ctx;
          const modelName = active.model?.name || active.model?.id || "no-model";
          const thinking = formatThinkingLabel(active.getThinkingLevel?.() ?? pi.getThinkingLevel());
          const subscription = active.model && active.modelRegistry?.isUsingOAuth?.(active.model)
            ? "sub"
            : "api";
          const line = [
            formatHostLabel(osHostname()),
            formatModelLabel(modelName),
            thinking,
            subscription,
            formatLastResponseAt(lastResponseTime),
          ].join("   ");
          return [theme.fg("dim", line.slice(0, Math.max(0, width)))];
        },
      };
    });
  });

  pi.on("agent_end", async (_event, ctx) => {
    lastResponseTime = Date.now();
    persistLastResponseTimestamp(lastResponseTime);
    redraw(ctx);
  });
  pi.on("model_select", async (_event, ctx) => redraw(ctx));
  pi.on("thinking_level_select", async (_event, ctx) => redraw(ctx));
}
