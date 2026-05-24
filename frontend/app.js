// 백엔드 API 주소 (docker-compose에서 backend는 4000번 포트로 열려있음)
const API = 'http://localhost:4000/api';

// ════════════════════════════════════════════════════════════════
// 학생 목록 불러오기 (GET /api/students)
// ════════════════════════════════════════════════════════════════
async function loadStudents() {
  // fetch()로 백엔드에 GET 요청을 보낸다
  const res  = await fetch(`${API}/students`);
  const data = await res.json();

  const tbody  = document.getElementById('studentTableBody');
  tbody.innerHTML = ''; // 기존 내용 초기화

  // 성적 입력 폼의 학생 선택 드롭다운도 같이 업데이트
  const select = document.getElementById('scoreStudentId');
  select.innerHTML = '<option value="">학생 선택</option>';

  // 받아온 학생 목록을 반복하면서 테이블 행 생성
  data.forEach(student => {
    // 테이블 행 추가
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${student.student_no}</td>
      <td>${student.subject_count}</td>
      <td>${student.avg_score ?? '-'}</td>
      <td><span class="grade grade-${student.grade}">${student.grade}</span></td>
      <td>
        <button class="view-btn" onclick="loadScores(${student.id}, '${student.name}')">성적보기</button>
        <button class="danger" onclick="deleteStudent(${student.id})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);

    // 드롭다운에 학생 옵션 추가
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.name} (${student.student_no})`;
    select.appendChild(option);
  });
}

// ════════════════════════════════════════════════════════════════
// 학생 등록 (POST /api/students)
// ════════════════════════════════════════════════════════════════
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 방지

  const name       = document.getElementById('name').value.trim();
  const student_no = document.getElementById('student_no').value.trim();
  const msg        = document.getElementById('studentMsg');

  // fetch POST 요청: body에 JSON 형태로 데이터 전송
  const res = await fetch(`${API}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, student_no }),
  });

  const data = await res.json();

  if (res.ok) {
    msg.textContent = `${name} 학생이 등록되었습니다.`;
    msg.className = 'msg';
    document.getElementById('studentForm').reset(); // 폼 초기화
    loadStudents(); // 목록 새로고침
  } else {
    msg.textContent = data.error;
    msg.className = 'msg error';
  }
});

// ════════════════════════════════════════════════════════════════
// 성적 입력 (POST /api/students/:id/scores)
// ════════════════════════════════════════════════════════════════
document.getElementById('scoreForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const studentId = document.getElementById('scoreStudentId').value;
  const subject   = document.getElementById('subject').value.trim();
  const score     = document.getElementById('score').value;
  const msg       = document.getElementById('scoreMsg');

  if (!studentId) {
    msg.textContent = '학생을 선택해주세요.';
    msg.className = 'msg error';
    return;
  }

  const res = await fetch(`${API}/students/${studentId}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, score: Number(score) }),
  });

  const data = await res.json();

  if (res.ok) {
    msg.textContent = `${subject} 성적이 입력되었습니다.`;
    msg.className = 'msg';
    document.getElementById('scoreForm').reset();
    loadStudents(); // 평균/등급 업데이트를 위해 목록 새로고침
  } else {
    msg.textContent = data.error;
    msg.className = 'msg error';
  }
});

// ════════════════════════════════════════════════════════════════
// 학생 삭제 (DELETE /api/students/:id)
// ════════════════════════════════════════════════════════════════
async function deleteStudent(id) {
  if (!confirm('정말 삭제하시겠습니까? 해당 학생의 성적도 모두 삭제됩니다.')) return;

  const res = await fetch(`${API}/students/${id}`, { method: 'DELETE' });

  if (res.ok) {
    loadStudents();
    // 성적 상세가 열려있으면 닫기
    document.getElementById('scoreDetail').style.display = 'none';
  }
}

// ════════════════════════════════════════════════════════════════
// 성적 상세 조회 (GET /api/students/:id/scores)
// ════════════════════════════════════════════════════════════════
async function loadScores(studentId, studentName) {
  const res  = await fetch(`${API}/students/${studentId}/scores`);
  const data = await res.json();

  const detail = document.getElementById('scoreDetail');
  const title  = document.getElementById('scoreDetailTitle');
  const tbody  = document.getElementById('scoreTableBody');

  title.textContent = `${studentName} 성적 상세`;
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">등록된 성적이 없습니다.</td></tr>';
  } else {
    data.forEach(score => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${score.subject}</td>
        <td>${score.score}점</td>
        <td>
          <button class="danger" onclick="deleteScore(${score.id}, ${studentId}, '${studentName}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 숨겨져 있던 성적 상세 섹션을 보이게 한다
  detail.style.display = 'block';
  detail.scrollIntoView({ behavior: 'smooth' }); // 자동 스크롤
}

// ════════════════════════════════════════════════════════════════
// 성적 삭제 (DELETE /api/scores/:id)
// ════════════════════════════════════════════════════════════════
async function deleteScore(scoreId, studentId, studentName) {
  if (!confirm('이 성적을 삭제하시겠습니까?')) return;

  const res = await fetch(`${API}/scores/${scoreId}`, { method: 'DELETE' });

  if (res.ok) {
    loadStudents();               // 평균/등급 업데이트
    loadScores(studentId, studentName); // 성적 상세 새로고침
  }
}

// ════════════════════════════════════════════════════════════════
// 새로고침 버튼
// ════════════════════════════════════════════════════════════════
document.getElementById('refreshBtn').addEventListener('click', loadStudents);

// 페이지 로드 시 학생 목록 자동으로 불러오기
loadStudents();
