const express = require('express');
const mysql2  = require('mysql2/promise');
const cors    = require('cors');

const app  = express();
const PORT = 4000;

// ─── 미들웨어 ───────────────────────────────────────────────────
// JSON 형태로 들어오는 요청 바디를 파싱해주는 미들웨어
app.use(express.json());
// 프론트엔드(다른 포트)에서 백엔드로 fetch 요청을 보낼 수 있도록 CORS 허용
app.use(cors());

// ─── DB 연결 ────────────────────────────────────────────────────
// mysql2/promise를 사용하면 async/await으로 쿼리를 날릴 수 있다
const pool = mysql2.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME     || 'gradedb',
});

// ─── 등급 계산 함수 ─────────────────────────────────────────────
// 평균 점수를 받아서 A~F 등급을 반환한다
function calcGrade(avg) {
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

// ════════════════════════════════════════════════════════════════
// 학생(students) API
// ════════════════════════════════════════════════════════════════

// ── [GET] /api/students ─────────────────────────────────────────
// 모든 학생 + 각 학생의 평균 점수 + 등급을 함께 조회한다
// JOIN과 AVG() 집계함수를 사용해 한 번의 쿼리로 처리
app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.student_no,
        ROUND(AVG(sc.score), 1) AS avg_score,  -- 소수점 1자리로 반올림
        COUNT(sc.id)            AS subject_count
      FROM students s
      LEFT JOIN scores sc ON s.id = sc.student_id  -- 성적 없는 학생도 포함(LEFT JOIN)
      GROUP BY s.id, s.name, s.student_no
      ORDER BY s.id
    `);

    // 등급은 DB가 아닌 서버에서 계산해서 응답에 추가
    const result = rows.map(row => ({
      ...row,
      grade: row.avg_score !== null ? calcGrade(row.avg_score) : '-',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [GET] /api/students/:id ─────────────────────────────────────
// 특정 학생 1명의 정보를 조회한다
app.get('/api/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM students WHERE id = ?',
      [req.params.id]   // ? 플레이스홀더로 SQL 인젝션 방지
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [POST] /api/students ────────────────────────────────────────
// 새 학생을 등록한다
app.post('/api/students', async (req, res) => {
  const { name, student_no } = req.body;  // 요청 바디에서 데이터 꺼내기

  if (!name || !student_no) {
    return res.status(400).json({ error: '이름과 학번을 모두 입력해주세요.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO students (name, student_no) VALUES (?, ?)',
      [name, student_no]
    );

    // INSERT 후 생성된 id를 포함해서 응답
    res.status(201).json({ id: result.insertId, name, student_no });
  } catch (err) {
    // 학번 중복이면 MySQL 에러코드 1062
    if (err.errno === 1062) {
      return res.status(409).json({ error: '이미 존재하는 학번입니다.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── [PUT] /api/students/:id ─────────────────────────────────────
// 학생 정보를 수정한다
app.put('/api/students/:id', async (req, res) => {
  const { name, student_no } = req.body;

  if (!name || !student_no) {
    return res.status(400).json({ error: '이름과 학번을 모두 입력해주세요.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE students SET name = ?, student_no = ? WHERE id = ?',
      [name, student_no, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
    }

    res.json({ message: '수정 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [DELETE] /api/students/:id ──────────────────────────────────
// 학생을 삭제한다 (scores 테이블은 FK CASCADE로 자동 삭제됨)
app.delete('/api/students/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM students WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
    }

    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// 성적(scores) API
// ════════════════════════════════════════════════════════════════

// ── [GET] /api/students/:id/scores ─────────────────────────────
// 특정 학생의 모든 과목 성적을 조회한다
app.get('/api/students/:id/scores', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM scores WHERE student_id = ? ORDER BY subject',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [POST] /api/students/:id/scores ────────────────────────────
// 특정 학생에게 성적을 추가한다
app.post('/api/students/:id/scores', async (req, res) => {
  const { subject, score } = req.body;

  if (!subject || score === undefined) {
    return res.status(400).json({ error: '과목명과 점수를 입력해주세요.' });
  }

  if (score < 0 || score > 100) {
    return res.status(400).json({ error: '점수는 0~100 사이여야 합니다.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO scores (student_id, subject, score) VALUES (?, ?, ?)',
      [req.params.id, subject, score]
    );

    res.status(201).json({ id: result.insertId, subject, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [PUT] /api/scores/:id ───────────────────────────────────────
// 성적을 수정한다
app.put('/api/scores/:id', async (req, res) => {
  const { subject, score } = req.body;

  if (!subject || score === undefined) {
    return res.status(400).json({ error: '과목명과 점수를 입력해주세요.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE scores SET subject = ?, score = ? WHERE id = ?',
      [subject, score, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '성적을 찾을 수 없습니다.' });
    }

    res.json({ message: '수정 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── [DELETE] /api/scores/:id ────────────────────────────────────
// 성적 1건을 삭제한다
app.delete('/api/scores/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM scores WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '성적을 찾을 수 없습니다.' });
    }

    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 서버 실행 ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`백엔드 서버 실행 중: http://localhost:${PORT}`);
});
