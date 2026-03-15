#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_PATH = path.join(ROOT, "posts.json");
const AI_DIR = path.join(ROOT, "images", "ai");

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = {
    postIds: new Set(),
    limit: Infinity,
    force: false,
    dryRun: false,
    onlyMissing: true,
    applyMissing: true,
    setAsPrimary: false,
    model: process.env.AI_IMAGE_MODEL || "dall-e-3",
    size: process.env.AI_IMAGE_SIZE || "1024x1024",
    quality: process.env.AI_IMAGE_QUALITY || "standard",
    apiBase: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--post-id") {
      const raw = argv[i + 1];
      i += 1;
      const id = Number(raw);
      if (Number.isFinite(id) && id > 0) out.postIds.add(id);
      continue;
    }
    if (arg === "--limit") {
      const raw = Number(argv[i + 1]);
      i += 1;
      if (Number.isFinite(raw) && raw > 0) out.limit = Math.floor(raw);
      continue;
    }
    if (arg === "--force") {
      out.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg === "--all") {
      out.onlyMissing = false;
      continue;
    }
    if (arg === "--no-apply-missing") {
      out.applyMissing = false;
      continue;
    }
    if (arg === "--set-as-primary") {
      out.setAsPrimary = true;
      continue;
    }
    if (arg === "--model") {
      out.model = argv[i + 1] || out.model;
      i += 1;
      continue;
    }
    if (arg === "--size") {
      out.size = argv[i + 1] || out.size;
      i += 1;
      continue;
    }
    if (arg === "--quality") {
      out.quality = argv[i + 1] || out.quality;
      i += 1;
      continue;
    }
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/ai-image.js [options]",
      "",
      "Options:",
      "  --post-id <id>       Generate for specific post id (repeatable)",
      "  --limit <n>          Max posts to process",
      "  --force              Regenerate even if ai_image already exists",
      "  --all                Process all selected posts (default: only missing ai_image)",
      "  --set-as-primary     Set generated AI image as post.image",
      "  --no-apply-missing   Do not fill empty post.image from ai_image",
      "  --dry-run            Preview without API call and file writes",
      "  --model <name>       Image model (default: dall-e-3)",
      "  --size <WxH>         Image size (default: 1024x1024)",
      "  --quality <level>    Image quality (default: standard)",
    ].join("\n") + "\n"
  );
}

function loadPosts() {
  if (!fs.existsSync(POSTS_PATH)) {
    throw new Error("posts.json not found");
  }
  const raw = fs.readFileSync(POSTS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const posts = Array.isArray(parsed.posts) ? parsed.posts : [];
  return { parsed, posts };
}

function buildPrompt(post) {
  const title = String(post.title || "").trim() || "블로그 글";
  const excerpt = String(post.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 260);
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 8).join(", ") : "";
  const category = String(post.category || "blog").trim();
  return [
    "Create a blog cover image.",
    `Theme: ${title}`,
    excerpt ? `Summary: ${excerpt}` : "",
    tags ? `Tags: ${tags}` : "",
    `Category: ${category}`,
    "Style: modern editorial, clean composition, high contrast, no text, no watermark, no logo.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateImageB64({ apiBase, apiKey, model, size, quality, prompt }) {
  const url = `${apiBase.replace(/\/+$/, "")}/images/generations`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      response_format: "b64_json",
      n: 1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI image API failed (${response.status}): ${text.slice(0, 500)}`);
  }

  const payload = await response.json();
  const item = Array.isArray(payload.data) ? payload.data[0] : null;
  const b64 = item && item.b64_json;
  if (!b64) throw new Error("image response missing b64_json");
  return b64;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveAiPath(postId) {
  const rel = `images/ai/post-${postId}-ai.png`;
  const abs = path.join(ROOT, rel);
  return { rel, abs };
}

async function main() {
  const { parsed, posts } = loadPosts();
  fs.mkdirSync(AI_DIR, { recursive: true });

  const candidates = posts.filter((post) => {
    const id = Number(post.id);
    if (!Number.isFinite(id) || id <= 0) return false;
    if (args.postIds.size > 0 && !args.postIds.has(id)) return false;
    if (args.onlyMissing && !args.force && hasText(post.ai_image)) return false;
    return true;
  });

  let changed = false;
  let generatedCount = 0;
  let filledPrimaryCount = 0;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!args.dryRun && candidates.length > 0 && !apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }

  for (const post of candidates.slice(0, args.limit)) {
    const postId = Number(post.id);
    const { rel, abs } = resolveAiPath(postId);
    const mustGenerate = args.force || !hasText(post.ai_image) || !fs.existsSync(abs);
    const prompt = buildPrompt(post);

    if (mustGenerate) {
      if (args.dryRun) {
        process.stdout.write(`[dry-run] post=${postId} would generate ${rel}\n`);
      } else {
        const b64 = await generateImageB64({
          apiBase: args.apiBase,
          apiKey,
          model: args.model,
          size: args.size,
          quality: args.quality,
          prompt,
        });
        fs.writeFileSync(abs, Buffer.from(b64, "base64"));
        process.stdout.write(`[ok] generated post=${postId} -> ${rel}\n`);
      }

      post.ai_image = rel;
      post.ai_image_prompt = prompt;
      generatedCount += 1;
      changed = true;
    }

    if (args.setAsPrimary || (args.applyMissing && !hasText(post.image))) {
      const nextImage = hasText(post.ai_image) ? post.ai_image : rel;
      if (!hasText(post.image) || post.image !== nextImage || args.setAsPrimary) {
        post.image = nextImage;
        filledPrimaryCount += 1;
        changed = true;
      }
    }
  }

  if (!args.dryRun && changed) {
    parsed.posts = posts;
    fs.writeFileSync(POSTS_PATH, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    process.stdout.write("[ok] posts.json updated\n");
  }

  process.stdout.write(
    `[done] generated=${generatedCount} primary_updated=${filledPrimaryCount} candidates=${candidates.length}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[error] ${err.message}\n`);
  process.exit(1);
});
