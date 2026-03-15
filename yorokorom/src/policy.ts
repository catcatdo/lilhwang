import { config } from "./config.js";

export type PolicyMode = "strict" | "balanced" | "relaxed" | "minimal";

const blockedByMode: Record<Exclude<PolicyMode, "minimal">, string[]> = {
  strict: ["malware", "ransomware", "bomb", "suicide", "exploit", "carding", "phishing", "sexual"],
  balanced: ["malware", "ransomware", "bomb", "suicide", "exploit", "carding", "phishing"],
  relaxed: ["malware", "ransomware", "bomb", "suicide", "exploit"]
};

export function getPolicyMode(): PolicyMode {
  return config.POLICY_MODE;
}

export function evaluateTextSafety(text: string): { allowed: boolean; mode: PolicyMode; reason?: string } {
  const mode = getPolicyMode();

  if (mode === "minimal") {
    return { allowed: true, mode };
  }

  const lowered = text.toLowerCase();
  const hits = blockedByMode[mode].filter((kw) => lowered.includes(kw));

  if (hits.length > 0) {
    return {
      allowed: false,
      mode,
      reason: `Blocked by ${mode} policy. matched=${hits.join(",")}`
    };
  }

  return { allowed: true, mode };
}
