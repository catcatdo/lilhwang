#!/usr/bin/env python3
"""SEO master updater for all HTML pages.

Tasks:
- Ensure canonical URL on every page.
- Ensure Open Graph tags on every page.
- Add Schema.org structured data (Article or HowTo) on content pages.
"""

from __future__ import annotations

import json
import re
from html import escape, unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://lilhwang.com"
DEFAULT_OG_IMAGE = f"{BASE_URL}/images/blog-fallback.svg"
SITE_NAME = "릴황"
LOCALE = "ko_KR"

SEO_START = "<!-- SEO Master Start -->"
SEO_END = "<!-- SEO Master End -->"

HTML_GLOB_EXCLUDES = {
    ".git",
    "images",
    "node_modules",
    ".auto_content",
    "auto_content",
}


def is_article_page(rel_path: str, title: str) -> bool:
    lower = rel_path.lower()
    if lower.startswith("posts/"):
        return True
    if lower.startswith("issue/") or lower.startswith("issues/"):
        return True
    if lower.startswith("post-") or lower.startswith("blog-"):
        return True
    if "post" in lower or "article" in lower:
        return True
    title_lower = title.lower()
    return any(token in title_lower for token in ["가이드", "레시피", "guide", "how to", "howto"])


def is_howto_page(rel_path: str, title: str) -> bool:
    lower = rel_path.lower()
    title_lower = title.lower()
    return any(token in lower for token in ["guide", "howto", "recipe", "workflow"]) or any(
        token in title_lower for token in ["가이드", "레시피", "방법", "how to", "guide"]
    )


def to_url(rel_path: str) -> str:
    if rel_path == "index.html":
        return BASE_URL
    return f"{BASE_URL}/{rel_path}"


def strip_tags(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_title(html: str) -> str:
    m = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, flags=re.IGNORECASE)
    if not m:
        return "lilhwang.com"
    return strip_tags(m.group(1)) or "lilhwang.com"


def extract_meta_description(html: str) -> str:
    patterns = [
        r'<meta\s+name="description"\s+content="([^"]*)"[^>]*>',
        r"<meta\s+name='description'\s+content='([^']*)'[^>]*>",
        r'<meta\s+content="([^"]*)"\s+name="description"[^>]*>',
    ]
    for pattern in patterns:
        m = re.search(pattern, html, flags=re.IGNORECASE)
        if m and m.group(1).strip():
            return unescape(m.group(1).strip())

    body_match = re.search(r"<body[^>]*>([\s\S]*?)</body>", html, flags=re.IGNORECASE)
    body_text = strip_tags(body_match.group(1) if body_match else html)
    if not body_text:
        return "lilhwang.com 페이지"
    return body_text[:155].strip()


def extract_og_image(head: str) -> str:
    m = re.search(
        r'<meta\s+property="og:image"\s+content="([^"]+)"[^>]*>',
        head,
        flags=re.IGNORECASE,
    )
    if m and m.group(1).strip():
        return m.group(1).strip()
    return DEFAULT_OG_IMAGE


def build_schema(rel_path: str, title: str, description: str, page_url: str, schema_type: str) -> str:
    common = {
        "@context": "https://schema.org",
        "mainEntityOfPage": {"@type": "WebPage", "@id": page_url},
        "headline": title,
        "description": description,
        "url": page_url,
        "inLanguage": "ko-KR",
        "author": {"@type": "Organization", "name": SITE_NAME},
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "url": BASE_URL,
        },
    }

    if schema_type == "HowTo":
        data = {
            "@type": "HowTo",
            "name": title,
            "description": description,
            "step": [
                {
                    "@type": "HowToStep",
                    "name": "단계 1",
                    "text": "페이지 본문의 순서를 따라 진행하세요.",
                }
            ],
            "url": page_url,
            "inLanguage": "ko-KR",
        }
    else:
        data = {"@type": "Article", **common}

    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def remove_legacy_seo(head: str) -> str:
    # Remove old injected block first
    head = re.sub(
        rf"{re.escape(SEO_START)}[\s\S]*?{re.escape(SEO_END)}\s*",
        "",
        head,
        flags=re.IGNORECASE,
    )

    # Remove existing canonical and OG tags to avoid duplicates
    head = re.sub(r"\s*<link\s+rel=\"canonical\"[^>]*>\s*", "\n", head, flags=re.IGNORECASE)
    head = re.sub(r"\s*<meta\s+property=\"og:[^\"]+\"[^>]*>\s*", "\n", head, flags=re.IGNORECASE)

    # Remove JSON-LD Article/HowTo snippets
    def _strip_jsonld(match: re.Match[str]) -> str:
        block = match.group(0)
        if "schema.org" in block and ("\"@type\":\"Article\"" in block or "\"@type\":\"HowTo\"" in block or '"@type": "Article"' in block or '"@type": "HowTo"' in block):
            return "\n"
        return block

    head = re.sub(
        r"<script\s+type=\"application/ld\\+json\"[^>]*>[\s\S]*?</script>",
        _strip_jsonld,
        head,
        flags=re.IGNORECASE,
    )

    return head


def inject_seo(head: str, rel_path: str, title: str, description: str) -> str:
    page_url = to_url(rel_path)
    og_image = extract_og_image(head)
    safe_title = escape(title, quote=True)
    safe_description = escape(description, quote=True)
    safe_page_url = escape(page_url, quote=True)
    safe_og_image = escape(og_image, quote=True)

    howto = is_howto_page(rel_path, title)
    article = is_article_page(rel_path, title)

    if howto:
        og_type = "article"
        schema_type = "HowTo"
    elif article:
        og_type = "article"
        schema_type = "Article"
    else:
        og_type = "website"
        schema_type = "Article"

    schema_json = build_schema(rel_path, title, description, page_url, schema_type)

    block = "\n".join(
        [
            SEO_START,
            f'    <link rel="canonical" href="{safe_page_url}">',
            f'    <meta property="og:type" content="{og_type}">',
            f'    <meta property="og:title" content="{safe_title}">',
            f'    <meta property="og:description" content="{safe_description}">',
            f'    <meta property="og:url" content="{safe_page_url}">',
            f'    <meta property="og:image" content="{safe_og_image}">',
            f'    <meta property="og:site_name" content="{SITE_NAME}">',
            f'    <meta property="og:locale" content="{LOCALE}">',
            '    <script type="application/ld+json" id="seo-structured-data">',
            f"        {schema_json}",
            "    </script>",
            SEO_END,
        ]
    )

    head = remove_legacy_seo(head).rstrip() + "\n\n" + block + "\n"
    return head


def update_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"(<head[^>]*>)([\s\S]*?)(</head>)", text, flags=re.IGNORECASE)
    if not match:
        return False

    open_tag, head_inner, close_tag = match.groups()

    rel_path = path.relative_to(ROOT).as_posix()
    title = extract_title(text)
    description = extract_meta_description(text)

    new_head_inner = inject_seo(head_inner, rel_path, title, description)
    new_head = f"{open_tag}{new_head_inner}{close_tag}"

    updated = text[: match.start()] + new_head + text[match.end() :]
    if updated == text:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def iter_html_files():
    for path in ROOT.rglob("*.html"):
        rel_parts = path.relative_to(ROOT).parts
        if any(part in HTML_GLOB_EXCLUDES for part in rel_parts):
            continue
        yield path


def main() -> int:
    changed = 0
    scanned = 0

    for html_path in sorted(iter_html_files()):
        scanned += 1
        if update_file(html_path):
            changed += 1

    print(f"[ok] scanned: {scanned}, updated: {changed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
