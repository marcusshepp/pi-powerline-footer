import { hostname as osHostname } from "node:os";
import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";

import {
  formatHostLabel,
  formatLastResponseAt,
  formatModelLabel,
  formatThinkingLabel,
} from "./labels.js";

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

  pi.on("session_start", async (_event, ctx) => {
    currentContext = ctx;
    lastResponseTime = latestAssistantTimestamp(ctx) ?? Date.now();
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
    redraw(ctx);
  });
  pi.on("model_select", async (_event, ctx) => redraw(ctx));
  pi.on("thinking_level_select", async (_event, ctx) => redraw(ctx));
}
