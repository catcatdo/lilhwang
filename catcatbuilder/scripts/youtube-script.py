#!/usr/bin/env python3
"""Convert source text into a YouTube-ready script format."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def normalize_lines(text: str) -> list[str]:
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.strip() for ln in cleaned.split("\n")]
    return [ln for ln in lines if ln]


def split_points(lines: list[str]) -> list[str]:
    points: list[str] = []
    for line in lines:
        normalized = re.sub(r"^[-*\d\.)\s]+", "", line).strip()
        if normalized:
            points.append(normalized)
    return points


def build_script(points: list[str], title: str) -> str:
    intro_target = points[:2]
    body_target = points[2:] if len(points) > 2 else points

    intro = " ".join(intro_target) if intro_target else "오늘 핵심 내용을 빠르게 정리해보겠습니다."
    outro = "핵심만 정리하면 " + (points[-1] if points else "지금 바로 적용 가능한 작은 실행이 중요합니다.")

    body_lines = []
    for idx, point in enumerate(body_target, start=1):
        body_lines.append(f"[{idx}] {point}")

    cta = "도움이 됐다면 좋아요와 구독, 그리고 알림 설정 부탁드립니다."

    return (
        f"# 제목\n{title}\n\n"
        "# 오프닝 (0:00-0:20)\n"
        f"안녕하세요. {intro}\n\n"
        "# 본문 (0:20-3:30)\n"
        + ("\n".join(body_lines) if body_lines else "[1] 본문 포인트를 입력해 주세요.")
        + "\n\n"
        "# 엔딩 (3:30-4:00)\n"
        f"{outro}\n{cta}\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert raw notes to YouTube script.")
    parser.add_argument("--input", "-i", help="Input text file path. If omitted, read from stdin.")
    parser.add_argument("--output", "-o", help="Output file path. If omitted, print to stdout.")
    parser.add_argument("--title", "-t", default="자동 생성 유튜브 스크립트", help="Video title")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.input:
        raw_text = Path(args.input).read_text(encoding="utf-8")
    else:
        import sys
        raw_text = sys.stdin.read()

    lines = normalize_lines(raw_text)
    points = split_points(lines)
    script = build_script(points, args.title.strip() or "자동 생성 유튜브 스크립트")

    if args.output:
        Path(args.output).write_text(script, encoding="utf-8")
        print(f"[ok] saved: {args.output}")
    else:
        print(script)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
