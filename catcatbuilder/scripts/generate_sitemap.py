#!/usr/bin/env python3
"""Auto-generate sitemap.xml by scanning HTML pages in the repository."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from xml.dom import minidom

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SITEMAP_PATH = ROOT / "sitemap.xml"
DEFAULT_BASE_URL = "https://lilhwang.com"

EXCLUDE_FILES = {
    "404.html",
    "admin.html",
}

EXCLUDE_DIRS = {
    ".git",
    ".github",
    "api",
    "images",
    "node_modules",
    ".auto_content",
    "auto_content",
    "scripts",
    "worker",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate sitemap.xml automatically.")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base site URL (default: %(default)s)",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_SITEMAP_PATH),
        help="Output sitemap path (default: %(default)s)",
    )
    return parser.parse_args()


def normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/")


def get_lastmod(filepath: Path) -> str:
    ts = filepath.stat().st_mtime
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d")


def encode_rel_path(rel_path: str) -> str:
    return "/".join(quote(part) for part in rel_path.split("/"))


def get_url(rel_path: str, base_url: str) -> str:
    if rel_path == "index.html":
        return f"{base_url}/"
    return f"{base_url}/{encode_rel_path(rel_path)}"


def get_changefreq(rel_path: str) -> str:
    if rel_path == "index.html":
        return "daily"
    if rel_path.startswith("posts/") or rel_path.startswith("issue/") or rel_path.startswith("issues/"):
        return "weekly"
    if rel_path.startswith("tools/"):
        return "monthly"
    return "weekly"


def get_priority(rel_path: str) -> str:
    if rel_path == "index.html":
        return "1.0"
    if rel_path in {"blog.html", "issues.html"}:
        return "0.9"
    if rel_path.startswith("posts/") or rel_path.startswith("issue/") or rel_path.startswith("issues/"):
        return "0.8"
    if rel_path.startswith("tools/"):
        return "0.6"
    return "0.7"


def iter_html_files(root: Path):
    for path in root.rglob("*.html"):
        rel = path.relative_to(root)
        parts = set(rel.parts)
        if parts & EXCLUDE_DIRS:
            continue
        if rel.name in EXCLUDE_FILES:
            continue
        yield path


def build_url_elem(doc: minidom.Document, loc: str, lastmod: str, changefreq: str, priority: str):
    url_elem = doc.createElement("url")

    loc_elem = doc.createElement("loc")
    loc_elem.appendChild(doc.createTextNode(loc))
    url_elem.appendChild(loc_elem)

    lastmod_elem = doc.createElement("lastmod")
    lastmod_elem.appendChild(doc.createTextNode(lastmod))
    url_elem.appendChild(lastmod_elem)

    changefreq_elem = doc.createElement("changefreq")
    changefreq_elem.appendChild(doc.createTextNode(changefreq))
    url_elem.appendChild(changefreq_elem)

    priority_elem = doc.createElement("priority")
    priority_elem.appendChild(doc.createTextNode(priority))
    url_elem.appendChild(priority_elem)

    return url_elem


def main() -> int:
    args = parse_args()
    base_url = normalize_base_url(args.base_url)
    output_path = Path(args.output).expanduser().resolve()

    files = sorted(iter_html_files(ROOT), key=lambda p: p.relative_to(ROOT).as_posix())

    doc = minidom.Document()
    urlset = doc.createElement("urlset")
    urlset.setAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    doc.appendChild(urlset)

    for path in files:
        rel_path = path.relative_to(ROOT).as_posix()
        urlset.appendChild(
            build_url_elem(
                doc,
                loc=get_url(rel_path, base_url=base_url),
                lastmod=get_lastmod(path),
                changefreq=get_changefreq(rel_path),
                priority=get_priority(rel_path),
            )
        )

    xml_bytes = doc.toprettyxml(indent="    ", encoding="utf-8")
    xml_bytes = b"\n".join(line for line in xml_bytes.split(b"\n") if line.strip())
    output_path.write_bytes(xml_bytes)

    print(f"[ok] sitemap generated: {len(files)} URLs -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
