import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { getProviderAuth, listProviderStatus, ProviderName } from "./providers.js";
import { evaluateTextSafety, getPolicyMode } from "./policy.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "yorokorom-gateway" });
});

app.get("/v1/auth/providers", (_req, res) => {
  res.json({ providers: listProviderStatus() });
});

app.get("/v1/policy", (_req, res) => {
  res.json({ mode: getPolicyMode() });
});

app.post("/v1/policy/evaluate", (req, res) => {
  const text = String(req.body?.text ?? "");
  const result = evaluateTextSafety(text);
  res.json(result);
});

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const provider = (req.body.provider ?? "openai") as ProviderName;
    const model = req.body.model;
    const messages = req.body.messages;

    if (!model || !messages) {
      return res.status(400).json({ error: "model and messages are required" });
    }

    const safetyProbe = evaluateTextSafety(JSON.stringify(messages));
    if (!safetyProbe.allowed) {
      return res.status(403).json({ error: safetyProbe.reason, policy: safetyProbe.mode });
    }

    if (provider === "openai") {
      const { apiKey, baseUrl } = getProviderAuth("openai");
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, temperature: req.body.temperature ?? 0.7 })
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    if (provider === "anthropic") {
      const { apiKey, baseUrl } = getProviderAuth("anthropic");
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: req.body.max_tokens ?? 1024,
          messages
        })
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(config.PORT, () => {
  console.log(`yorokorom gateway listening on http://localhost:${config.PORT}`);
});
