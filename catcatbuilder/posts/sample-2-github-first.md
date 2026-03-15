## GitHub에 코드 처음 올리기 (초보자용)

**왜 이 글을 읽어야 할까요?**

코딩한 파일을 친구한테 복사해서 주고 있나요? USB로? 메일로? 그만하세요! GitHub를 쓰면 훨씬 편하게 코드를 관리하고 공유할 수 있어요.

---

### 1. GitHub가 뭔가요?

GitHub는 **코드를 저장하고 공유하는 클라우드**예요.

구글 드라이브에 문서 저장하듯이, GitHub에는 코드를 저장하는 거예요. 근데 단순 저장만 하는 게 아니라:

- 언제 뭘 수정했는지 기록이 남아요
- 여러 사람이 같이 작업할 수 있어요
- 내 포트폴리오로도 활용할 수 있어요

---

### 2. 준비물

**필요한 것:**
1. GitHub 계정 (묵료 가입)
2. 컴퓨터에 Git 설치
3. 올리고 싶은 코드 파일

**Git 설치 방법:**
```bash
# macOS
brew install git

# 설치 확인
git --version
```

---

### 3. 직접 따라하기

**Step 1: GitHub에서 새 저장소 만들기**
1. github.com 로그인
2. 우측 상단 + 버튼 → "New repository"
3. 이름 입력 (예: my-first-project)
4. "Create repository" 클릭

**Step 2: 터미널에서 명령어 입력**
```bash
# 내 프로젝트 폼더로 이동
cd 내프로젝트

# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋 (저장) 메시지 작성
git commit -m "첫 커밋!"

# GitHub 연결 (주소는 본인 거로 변경)
git remote add origin https://github.com/내이름/my-first-project.git

# GitHub에 올리기!
git push -u origin main
```

**Step 3: 확인**
GitHub 사이트에서 내 저장소 들어가면 파일들이 쭉 보여요! 🎉

---

### 4. 자주 하는 실수

**❌ "git add . 하면 모든 파일 올라가요?"**
→ 네, 근데 비밀번호 같은 거 올라가면 큰일 나요! `.gitignore` 파일로 제외할 수 있어요.

**❌ "push가 안 돼요"**
→ 두 가지 확인:
1. GitHub 로그인했는지
2. remote 주소가 정확한지 (git remote -v로 확인)

---

### 5. 다음 단계

GitHub를 더 잘 써보고 싶다면:

1. **README.md** 작성하기 (프로젝트 설명서)
2. **Branch** 배우기 (실험적인 기능 안전하게 테스트)
3. **Pull Request** 이해하기 (팀 프로젝트에서 코드 리뷰)

---

**끝으로**

처음엔 명령어가 어려워 보여도, 3-4번 반복하면 손에 익어요. 오늘 한 번 성공하면 다음엔 훨씬 쉬워요. 화이팅! 💪

---

**질문 있으면 댓글로! 처음이라 어려운 게 당연해요 👇**