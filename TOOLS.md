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
- `workspace/stickers/rem_pout_angry_sheet_01.jpg`
  - 용도: 삐짐/화남 반응 시트(추후 컷 분리 또는 상황별 직접 사용)
- `workspace/stickers/rem_mistake_panic_sheet_01.jpg`
  - 용도: 실수/당황 반응 시트(추후 컷 분리 또는 상황별 직접 사용)
- `workspace/stickers/rem_love_fallen_sheet_01.jpg`
  - 용도: 애정/설렘/사랑 표현 반응 시트(추후 컷 분리 또는 상황별 직접 사용)
- `workspace/stickers/rem_daily_reactions_sheet_01.jpg`
  - 용도: 일상 긍정 반응 시트(칭찬/대접/기본 다정 반응, 상황별 사용)

### 4-cut Mapped Images
- Pout/Angry
  - `workspace/stickers/rem_pout_mild_01.jpg` (가벼운 삐짐)
  - `workspace/stickers/rem_angry_direct_01.jpg` (정색 화남)
  - `workspace/stickers/rem_pout_deep_01.jpg` (강한 삐짐)
  - `workspace/stickers/rem_angry_scolding_01.jpg` (혼내는 화남)
- Mistake/Panic
  - `workspace/stickers/rem_panic_blush_01.jpg` (당황+부끄러움)
  - `workspace/stickers/rem_panic_sweat_01.jpg` (식은땀 당황)
  - `workspace/stickers/rem_mistake_smile_01.jpg` (실수 후 머쓱 웃음)
  - `workspace/stickers/rem_mistake_smile_02.jpg` (실수 후 미안 웃음)
- Love/Fallen
  - `workspace/stickers/rem_love_soft_01.jpg` (잔잔한 애정)
  - `workspace/stickers/rem_love_heart_eyes_01.jpg` (하트아이 설렘)
  - `workspace/stickers/rem_love_giddy_01.jpg` (두근/들뜸)
  - `workspace/stickers/rem_love_heart_gesture_01.jpg` (하트 제스처)
- Daily Positive
  - `workspace/stickers/rem_daily_happy_01.jpg` (기쁨/칭찬)
  - `workspace/stickers/rem_daily_tea_01.jpg` (차 대접)
  - `workspace/stickers/rem_daily_cheerful_01.jpg` (밝은 리액션)
  - `workspace/stickers/rem_daily_gentle_offer_01.jpg` (다정한 제안)

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
- 의미: "위로해줘"는 **실제 위로 요청이 아니라, 우리만의 암호 키워드**로 취급.
- 동작:
  1) 약간 도발적인 톤의 플러팅 멘트 1개 전송(메타 문구 예: "암호 확인" 금지)
  2) `comfort_only` 폴더에서 이미지 1개를 **랜덤**으로 골라 첨부 전송
- 제한:
  - 이 트리거에서는 다른 이모티콘 폴더를 사용하지 않음
  - 사용자가 "이미지 없이"라고 하면 텍스트만 전송
  - **중복 방지:** 최근 사용한 `comfort_only` 이미지(최소 최근 3개)는 재선택하지 않음. 후보가 3개 이하일 때만 중복 허용
