# 중간고사 프로젝트 - 학생 정보 및 성적 관리 시스템

## 프로젝트 개요
학생 등록 및 과목별 점수를 관리하고, 평균과 등급을 산출하는 체계적인 관리 시스템.

**마감: 2026년 5월 27일**

---

## 기술 스택

- **Frontend**: HTML / CSS / JavaScript (fetch API로 백엔드 통신)
- **Backend**: Node.js + Express (REST API, 기본 라우팅)
- **Database**: MySQL 8.0 (mysql2 라이브러리, JOIN + AVG/COUNT 활용)
- **Infrastructure**: Docker Compose (볼륨 마운트로 데이터 영구 저장)

## 개발 수준 기준

- Express: `app.get/post/put/delete`, `req.body`, `res.json` 기본 라우팅
- MySQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, `AVG()`, `COUNT()` 활용
- Frontend: 순수 HTML/CSS + `fetch()` API로 백엔드 통신
- 복잡한 미들웨어, ORM, 프레임워크 사용 안 함

---

## 시스템 아키텍처

```
Client (Browser)
    ↓ HTTP 요청
Frontend 컨테이너 (HTML/CSS/JS 정적 리소스)
    ↓ fetch() API
Backend 컨테이너 (Node.js REST API)
    ↕ SQL 쿼리
Database 컨테이너 (MySQL/PostgreSQL) ← Volume Mount (데이터 영구 저장)
```

컨테이너 재시작 시에도 데이터 유지를 위해 **볼륨 마운트** 사용.

---

## 핵심 구현 요구사항

### 1. DB 설계
- `students` 테이블: 학생 정보
- `scores` 테이블: 과목별 점수

### 2. 화면 구현 (Frontend)
- 학생 성적 등록 UI
- 성적 입력 UI
- 결과 조회 UI

### 3. 로직 구현 (Backend)
- CRUD API
- 등급 계산 알고리즘 (평균 기반)

### 4. 확장 기능
- 자유롭게 구현

---

## 코드 작성 지침

- **모든 소스코드에 상세 주석 작성 필수**
- 가독성 최우선
- 수업 시간에 배운 내용을 적용한 포인트를 결과 문서에 구체적으로 설명

---

## 필수 제출물

- [ ] 프로젝트 소스코드 전체
- [ ] 잘 정리된 Git 히스토리
- [ ] 정상 작동 확인용 실행 화면 캡처본
- [ ] 설계 문서 (양식 자유, 시스템 구조 및 설계 내용 포함)
- [ ] 발표 문서 (PPT 형식, 배운 내용 + 트러블슈팅 경험)

---

## 평가 기준

- 단순 코드 완성도보다 **설계 과정**과 **기술에 대한 이해도** 중점 평가
- 구현 결과물보다 **논리적 사고 과정**이 평가의 핵심
- 100% 완성 못해도 되므로, 정확히 이해하고 구현 가능한 범위에서 과제 수행
- 바이브 코딩 허용
