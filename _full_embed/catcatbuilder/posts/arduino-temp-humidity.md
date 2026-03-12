## 아두이노로 집안 온습도 측정기 만들기 (초보자용 완벽 가이드)

**왜 이 글을 읽어야 할까요?**

집안이 너무 건조해서 피부가 당기고, 장마철엔 너무 습해서 곰팡이 걱정되시나요? 1만 5천원이면 스마트홈 온습도 측정기를 직접 만들 수 있습니다.

---

### 1. 준비물 (총 1.5만원 예상)

**필수품:**
1. **아두이노 우노 (Arduino Uno)** - 10,000원
   - 국내 쇼핑몰에서 중국산 호환보드 구매
2. **DHT11 온습도 센서** - 1,000원
3. **LCD 16x2 (I2C)** - 3,000원
4. **브레드보드 + 점퍼선 세트** - 1,500원

**총액:** 15,500원

**구매처 추천:**
- 디바이스마트 - 국내 당일발송
- 메카솔루션 - 부품 설명 자세함
- AliExpress - 2주 기다리면 반값

---

### 2. 하드웨어 연결 (배선)

**LCD (I2C) 연결:**
- GND → 아두이노 GND
- VCC → 아두이노 5V
- SDA → 아두이노 A4
- SCL → 아두이노 A5

**DHT11 연결:**
- + (VCC) → 아두이노 5V
- - (GND) → 아두이노 GND
- S (Signal) → 아두이노 D2

---

### 3. 소프트웨어 (코드)

**라이브러리 설치:**
아두이노 IDE → 스케치 → 라이브러리 포함하기 → 라이브러리 관리
- "DHT sensor library" 설치 (Adafruit)
- "LiquidCrystal I2C" 설치 (Frank de Brabander)

**코드:**
```cpp
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  dht.begin();
  lcd.init();
  lcd.backlight();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(t);
  lcd.print(" C");
  
  lcd.setCursor(0, 1);
  lcd.print("Humi: ");
  lcd.print(h);
  lcd.print(" %");
  
  delay(2000);
}
```

**업로드 방법:**
1. 코드 복사 → 아두이노 IDE에 붙여넣기
2. 툴 → 보드 → "Arduino Uno" 선택
3. 툴 → 포트 → COM3 선택
4. 업로드 버튼 클릭

---

### 4. 자주 하는 실수

**❌ "LCD에 아무것도 안 보여요"**
→ I2C 주소 확인: 코드에서 `0x27`을 `0x3F`로 바꿔보세요.

**❌ "온습도 값이 이상해요"**
→ DHT11 핀 방향 확인 (+, -, S 순서가 제조사마다 다름)
→ 점퍼선이 헐렁하지 않은지 확인

**❌ "업로드가 안 돼요"**
→ USB 케이블이 데이터 통신 가능한지 확인
→ CH340 드라이버 설치 (중국산 보드용)

---

### 5. 완성 후 팁

- **Wi-Fi 업그레이드:** ESP8266 모듈 추가하면 스마트폰에서 확인 가능
- **데이터 저장:** SD 카드 모듈로 CSV 파일 기록
- **알림 기능:** 습도 70% 이상이면 부저로 알림

---

**끝으로**

어려워 보여도 선만 잘 연결하면 돼요. 안 되면 댓글로 에러 메시지나 사진 찍어서 올려주세요!

**💬 질문 있으면 댓글로! 사진 첨부하면 더 정확히 도와드릴 수 있어요.** 👇