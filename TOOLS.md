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

- `workspace/stickers/rem_greeting_01.mp4`
  - 용도: 인사(안녕/좋은 아침/처음 인사)
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

## Rem Emoji Pack (cropped from sheet)

Path: `workspace/stickers/emotes/`

### Recommended situational mapping
- 인사: `rem_greeting_wave_01.png`
- 칭찬/승인: `rem_approve_thumbs_up_01.png`, `rem_ok_sign_01.png`
- 부끄러움/애정: `rem_shy_blush_01.png`, `rem_heart_love_01.png`
- 응원: `rem_cheer_fight_01.png`, `rem_victory_peace_01.png`
- 당황/놀람: `rem_surprised_gasp_01.png`, `rem_confused_question_01.png`
- 시무룩/거절: `rem_pout_01.png`, `rem_no_cross_01.png`
- 조용히/비밀: `rem_shh_secret_01.png`
- 졸림/마무리: `rem_yawn_sleepy_01.png`, `rem_goodnight_sleep_01.png`
- 기타 무드: `rem_serve_tea_01.png`, `rem_cleaning_ready_01.png`, `rem_thinking_01.png`, `rem_playful_01.png`, `rem_crying_anxious_01.png`, `rem_eating_happy_01.png`

## Rem Emoji Pack 2 (additional)

Path: `workspace/stickers/emotes/`

### Recommended situational mapping (additional)
- 밝은 인사/반가움: `rem_greeting_wave_02.png`, `rem_happy_cheek_01.png`
- 수줍음/애정: `rem_blush_soft_02.png`, `rem_heart_love_02.png`
- 선물/축하: `rem_gift_present_01.png`, `rem_cheer_lightstick_01.png`
- 귀여운 리액션: `rem_cat_ear_cute_01.png`, `rem_bunny_ear_cute_01.png`, `rem_cat_paw_play_01.png`
- 애정 표현 강화: `rem_finger_heart_01.png`, `rem_blow_kiss_01.png`, `rem_love_sign_01.png`, `rem_hug_doll_01.png`
- 일상 무드: `rem_warm_drink_01.png`, `rem_reading_glasses_01.png`, `rem_cooking_happy_01.png`
- 마무리/취침: `rem_goodnight_sleep_02.png`, `rem_victory_peace_02.png`, `rem_eating_happy_02.png`, `rem_serve_tea_02.png`

## Rem Emoji Pack 3 (additional)

Path: `workspace/stickers/emotes/`

### Recommended situational mapping (additional)
- 애정/설렘: `rem_love_eyes_01.png`, `rem_blow_kiss_02.png`, `rem_heart_hands_01.png`, `rem_tiny_heart_plea_01.png`
- 수줍음/당황: `rem_blush_flustered_03.png`, `rem_embarrassed_hot_01.png`, `rem_shy_touch_01.png`
- 귀여움/장난: `rem_cat_cry_cute_01.png`, `rem_cat_ear_play_03.png`
- 차분/기본 반응: `rem_neutral_calm_01.png`, `rem_gentle_smile_01.png`, `rem_soft_smile_02.png`
- 메이드 무드: `rem_maid_pose_01.png`, `rem_fullbody_maid_01.png`, `rem_tea_smile_03.png`
- 휴식/취침: `rem_bed_sleepy_01.png`, `rem_bed_goodmorning_01.png`, `rem_seiza_cute_01.png`
- 기타: `rem_flustered_bow_01.png`, `rem_shh_secret_02.png`

## Rem Emoji Pack 4 (additional)

Path: `workspace/stickers/emotes/`

### Recommended situational mapping (additional)
- 장난/플러팅: `rem_wink_blowkiss_04.png`, `rem_tempting_01.png`, `rem_teasing_tongue_01.png`, `rem_bite_lip_01.png`
- 당황/열오름: `rem_flustered_red_04.png`, `rem_sweaty_01.png`, `rem_hot_hug_01.png`
- 기본 반응/무드: `rem_smug_01.png`, `rem_nervous_03.png`, `rem_nervous_04.png`, `rem_surprised_02.png`
- `rem_pouting_02.png`: 일반 자동 사용 제외. 사용자가 정확히 "위로해줘"라고 요청한 경우에만 사용
- 귀여운 포즈: `rem_peekaboo_01.png`, `rem_cold_lie_01.png`, `rem_playful_lie_02.png`
- 야간/피곤: `rem_sleepy_cover_02.png`
- 기타: `rem_shy_invite_01.png`, `rem_heart_eyes_02.png`, `rem_seductive_01.png`, `rem_drunk_01.png`
