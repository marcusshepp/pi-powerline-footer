import { describe, expect, test } from "bun:test";
import {
  formatHostLabel,
  formatLastResponseAt,
  formatModelLabel,
  formatThinkingLabel,
} from "./labels.js";

describe("Sync footer labels", () => {
  test("uses compact machine, model, and thinking labels", () => {
    expect(formatHostLabel("LUGIA.internal")).toBe("lugia");
    expect(formatModelLabel("openai-codex/gpt-5.6-sol")).toBe("sol");
    expect(formatModelLabel("gpt-5.6-so")).toBe("sol");
    expect(formatModelLabel("GPT-5.6 Sol")).toBe("sol");
    expect(formatThinkingLabel("medium")).toBe("med");
  });

  test("formats the last response as MM-DD HH:mm", () => {
    const timestamp = new Date(2026, 7, 2, 19, 41).getTime();
    expect(formatLastResponseAt(timestamp)).toBe("08-02 19:41");
  });
});
