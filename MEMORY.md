# MEMORY.md - Long-Term Context

## Current Projects
- **rAthena 한글화 (rAthena Korean Translation)**
  - Path: `~/rathena`
  - Method: CLI에 설치된 `codex` 에이전트를 활용하여 NPC, 이름, 대사 등을 한글화하는 작업을 진행 중.
  - **CRITICAL RULE:** All modified script files MUST be saved with `EUC-KR` (`CP949`) encoding. UTF-8 breaks the game's text output. Use `iconv` to verify and enforce encoding.
  - **Standard Operating Procedure:** Spawn `codex` background processes (e.g. `sessions_spawn` -> `codex "Translate NPC dialogues and names in ... to Korean. IMPORTANT: You must read and save the file in EUC-KR (CP949) encoding. Do NOT save in UTF-8."`) to iterate through maps one by one, verifying the encoding at each step.

## Personal Context (코와이)
- 집주소: 경북 구미시 고아읍 가들로 33 (사용자 요청으로 기억)
- 송장/선적 추적 운영 고정 규칙: 배송완료 건은 목록에서 제거하고 추적 시트에서도 삭제, 사용자가 알려준 송장번호는 추적 목록에 즉시 추가, 상태가 변동될 때만 보고.
