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

  test("formats the last response in 12-hour Eastern time", () => {
    expect(formatLastResponseAt(Date.UTC(2026, 7, 3, 0, 18))).toBe("08-02 8:18pm EDT");
    expect(formatLastResponseAt(Date.UTC(2026, 0, 2, 18, 5))).toBe("01-02 1:05pm EST");
  });
});
