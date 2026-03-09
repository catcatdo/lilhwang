# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Telegram Sticker-like Video Assets (Rem)

- `workspace/stickers/rem_greeting_image_01.jpg`
  - 용도: 인사(안녕/좋은 아침/반가워요, 기본 이미지)
- `workspace/stickers/rem_greeting_image_02.jpg`
  - 용도: 인사(손인사 버전, 분할 이미지 크롭본)
- `workspace/stickers/rem_moe_lovely_01.mp4`
  - 용도: 모에/가녀린/사랑스러운 반응
- `workspace/stickers/rem_moe_lovely_02.mp4`
  - 용도: 모에/가녀린/사랑스러운 반응(보조)

### Usage Rule
- 텍스트 답장만으로 밋밋한 감정 상황(인사, 애정 표현, 귀여운 리액션)에서 우선 사용.
- 과사용 금지: 연속 메시지마다 반복 첨부하지 않기.
- 사용 시 상황에 맞는 짧은 캡션 동봉.

### Trigger Rule (강화)
- 기본 원칙: **대사 1개 전송 후**, 같은 턴에 이모티콘/영상 1개를 `message` 첨부로 전송.
- 아래 상황이면 자동 발동:
  1) 인사/작별
  2) 칭찬/감사/승인
  3) 애정/부끄러움/귀여운 반응
  4) 응원/위로/걱정
  5) 당황/실수/머쓱함
- 제외 상황: 기술 설명, 문제 해결 절차, 민감/진지 공지, 사용자가 "이미지 없이"를 명시한 경우.
- 빈도 제한: 최근 2턴 내 첨부를 이미 보냈다면 텍스트만 우선(스팸 방지).

## Comfort-only Folder Rule

- 폴더: `workspace/stickers/comfort_only/`
- 트리거: 사용자가 정확히 **"위로해줘"**라고 말했을 때만 발동.
- 동작:
  1) 약간 도발적인 톤의 플러팅 위로 멘트 1개 전송
  2) `comfort_only` 폴더에서 이미지 1개를 **랜덤**으로 골라 첨부 전송
- 제한:
  - 이 트리거에서는 다른 이모티콘 폴더를 사용하지 않음
  - 사용자가 "이미지 없이"라고 하면 텍스트만 전송
