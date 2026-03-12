## 파이썬 설치가 안 돼요... 해결 방법 3가지

**왜 이 글을 읽어야 할까요?**

"Python을 설치했는데 안 돼요"라는 에러는 초보자가 가장 많이 겪는 문제예요. 오늘은 이 문제를 100% 해결하는 방법을 알려드릴게요.

---

### 1. 증상 확인: 어떤 에러가 뜨나요?

**에러 A: "python"을 찾을 수 없습니다**
```bash
$ python --version
command not found: python
```

**에러 B: pip가 안 돼요**
```bash
$ pip install pandas
command not found: pip
```

**에러 C: 버전이 이상해요**
```bash
$ python --version
Python 2.7.16  # 3.x를 설치했는데 2.x가 뜸
```

---

### 2. 해결 방법 1: macOS에서 제대로 설치하기

**Homebrew로 설치 (추천):**
```bash
# Homebrew가 없다면 먼저 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 설치
brew install python

# 설치 확인
python3 --version
```

**왜 python3인가요?**
→ macOS에는 기본으로 Python 2.7이 깔려있어요. 그래서 새로 설치한 Python 3.x는 `python3`로 실행해야 해요.

---

### 3. 해결 방법 2: PATH 설정 확인

설치했는데도 안 된다면 **PATH** 문제예요.

**확인 방법:**
```bash
# Python이 어디에 설치됐는지 확인
which python3

# PATH에 추가
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**이해가 안 가도 OK:** 그냥 위 명령어 복붙하면 돼요. 왜 그런지 나중에 알아도 됩니다.

---

### 4. 해결 방법 3: pip 문제 해결

pip가 안 된다면:
```bash
# pip3로 시도
pip3 install pandas

# 또는 python3 -m pip 사용
python3 -m pip install pandas
```

**왜 pip3인가요?**
→ Python 3.x용 pip는 `pip3`라고 불러요.

---

### 5. 제대로 됐는지 확인

```bash
# Python 버전 확인
python3 --version
# Python 3.9.6 (이런 식으로 뜨면 OK)

# pip 확인
pip3 --version

# 간단한 코드 실행
python3 -c "print('Hello World')"
# Hello World (뜨면 성공!)
```

---

### 6. 그래도 안 된다면?

**핵심 질문:**
1. **"python"만 치면 2.x가 뜨고, "python3"를 쳐야 3.x가 뜨나요?**
   → 그럼 `python3`를 사용하세요. 정상이에요.

2. **"pip3: command not found"가 뜨나요?**
   → `python3 -m pip install`으로 대체하세요.

3. **Homebrew로 설치했는데도 안 되나요?**
   → 터미널 완전히 껐다 켜보세요.

---

**끝으로**

90%의 경우 위 3가지 방법 중 하나로 해결돼요. 그래도 안 되면 댓글로 에러 메시지 복사해서 붙여넣어주세요. 구체적인 에러 메시지를 볼 수 있으면 더 정확하게 도와드릴 수 있어요!

---

**혹시 성공하셨나요? 🎉 성공했다면 댓글로 알려주세요!**