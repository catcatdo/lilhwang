# yorokorom (core gateway MVP)

OpenClaw-like core를 목표로 하는 1단계 MVP입니다.
지금 단계는 **모델 인증 + 게이트웨이 라우팅**만 최소 기능으로 구현했습니다.

## 포함 기능

- `GET /health` : 헬스체크
- `GET /v1/auth/providers` : 설정된 모델 Provider 상태 조회
- `GET /v1/policy` : 현재 안전 정책 모드 확인
- `POST /v1/policy/evaluate` : 텍스트 정책 검사
- `POST /v1/chat/completions` : provider별 프록시 호출
  - `provider=openai` → `/chat/completions`
  - `provider=anthropic` → `/messages`

## 시작하기

```bash
npm install
cp .env.example .env
# .env에 API 키 입력
npm run dev
```

서버: `http://localhost:8787`

## 요청 예시

### Provider 상태

```bash
curl http://localhost:8787/v1/auth/providers
```

### OpenAI

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "openai",
    "model": "gpt-4o-mini",
    "messages": [{"role":"user", "content":"hello"}]
  }'
```

### Anthropic

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-5",
    "messages": [{"role":"user", "content":"hello"}],
    "max_tokens": 256
  }'
```

## 정책 모드

`.env`의 `POLICY_MODE`로 제어:
- `strict` / `balanced` / `relaxed` / `minimal`
- 테스트 요청대로 4번 모드는 `minimal`

## 다음 단계(v2 추천)

1. 세션 저장(메모리/SQLite)
2. 표준 에러 코드 체계
3. 스트리밍 응답(SSE)
4. provider 플러그인 구조 분리
5. 키 검증/암호화 저장
