import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  POLICY_MODE: z.enum(["strict", "balanced", "relaxed", "minimal"]).default("balanced"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().url().default("https://api.anthropic.com/v1")
});

export const config = schema.parse(process.env);
