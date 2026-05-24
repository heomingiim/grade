-- 학생 정보 테이블
-- 학생의 기본 정보를 저장한다
CREATE TABLE IF NOT EXISTS students (
    id          INT AUTO_INCREMENT PRIMARY KEY,  -- 고유 식별자 (자동 증가)
    name        VARCHAR(50)  NOT NULL,           -- 학생 이름
    student_no  VARCHAR(20)  NOT NULL UNIQUE,    -- 학번 (중복 불가)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 성적 테이블
-- 학생별 과목 점수를 저장한다. student_id로 students 테이블과 연결(FK)
CREATE TABLE IF NOT EXISTS scores (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT          NOT NULL,           -- students.id 참조
    subject     VARCHAR(50)  NOT NULL,           -- 과목명
    score       INT          NOT NULL,           -- 점수 (0~100)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 샘플 데이터
INSERT INTO students (name, student_no) VALUES
    ('홍길동', '2024001'),
    ('김철수', '2024002'),
    ('이영희', '2024003');

INSERT INTO scores (student_id, subject, score) VALUES
    (1, '수학', 85),
    (1, '영어', 90),
    (1, '국어', 78),
    (2, '수학', 72),
    (2, '영어', 65),
    (2, '국어', 80),
    (3, '수학', 95),
    (3, '영어', 88),
    (3, '국어', 92);
