// 백엔드 API 주소
const API = 'http://localhost:4000/api';

// 전체 학생 데이터를 전역으로 보관 (검색/정렬 시 재활용)
let allStudents = [];
let sortKey = null;  // 현재 정렬 기준 ('name', 'avg_score', 'grade')
let sortAsc = true;  // true = 오름차순, false = 내림차순

// ════════════════════════════════════════════════════════════════
// 데이터 불러오기 + 렌더링 파이프라인
// ════════════════════════════════════════════════════════════════

// 서버에서 학생 목록을 가져온 뒤 화면에 반영한다
async function loadStudents() {
  const res   = await fetch(`${API}/students`);
  allStudents = await res.json();
  applyFilterAndSort();
}

// 검색어 필터링 + 정렬을 적용한 뒤 renderStudents를 호출한다
function applyFilterAndSort() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

  // 이름 또는 학번에 검색어가 포함된 학생만 남긴다
  let list = allStudents.filter(s =>
    s.name.includes(keyword) || s.student_no.includes(keyword)
  );

  // 정렬 기준이 있으면 정렬한다
  if (sortKey) {
    list = [...list].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      // 문자열은 localeCompare, 숫자는 빼기로 비교
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal, 'ko')
        : Number(aVal) - Number(bVal);
      return sortAsc ? cmp : -cmp;
    });
  }

  renderStudents(list);
}

// 학생 목록을 테이블에 그린다
function renderStudents(data) {
  const tbody  = document.getElementById('studentTableBody');
  tbody.innerHTML = '';

  // 성적 입력 폼의 학생 선택 드롭다운도 동기화
  const select = document.getElementById('scoreStudentId');
  select.innerHTML = '<option value="">학생 선택</option>';

  data.forEach(student => {
    // 성적이 하나도 없는 학생은 별도 스타일로 강조
    const noScore = student.subject_count === 0;

    const tr = document.createElement('tr');
    if (noScore) tr.classList.add('no-score-row');

    tr.innerHTML = `
      <td>
        <span class="student-name" onclick="toggleDetail(${student.id}, this)">
          ${student.name} <span class="arrow">▼</span>
        </span>
      </td>
      <td>${student.student_no}</td>
      <td>${noScore ? '<span class="badge-none">미입력</span>' : student.subject_count}</td>
      <td>${student.avg_score ?? '-'}</td>
      <td><span class="grade grade-${student.grade}">${student.grade}</span></td>
      <td>
        <button class="edit-btn"
          onclick="editStudent(${student.id}, '${student.name}', '${student.student_no}', this)">수정</button>
        <button class="danger"
          onclick="deleteStudent(${student.id})">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);

    // 아코디언 상세 행 (기본 숨김)
    const detailTr = document.createElement('tr');
    detailTr.id        = `detail-${student.id}`;
    detailTr.className = 'detail-row';
    detailTr.style.display = 'none';
    detailTr.innerHTML =
      `<td colspan="6"><div class="detail-box" id="detail-box-${student.id}"></div></td>`;
    tbody.appendChild(detailTr);

    // 드롭다운 옵션 추가
    const opt = document.createElement('option');
    opt.value       = student.id;
    opt.textContent = `${student.name} (${student.student_no})`;
    select.appendChild(opt);
  });

  // 정렬 화살표 업데이트
  updateSortArrows();
}

// ════════════════════════════════════════════════════════════════
// 정렬
// ════════════════════════════════════════════════════════════════

// 컬럼 헤더 클릭 시 호출 — 같은 키를 다시 누르면 방향 반전
function setSort(key) {
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }
  applyFilterAndSort();
}

// 현재 정렬 상태를 헤더 화살표로 표시한다
function updateSortArrows() {
  ['name', 'avg_score', 'grade'].forEach(key => {
    const el = document.getElementById(`sort-${key}`);
    if (!el) return;
    el.textContent = sortKey === key ? (sortAsc ? '▲' : '▼') : '';
  });
}

// ════════════════════════════════════════════════════════════════
// 아코디언 — 이름 클릭 시 성적 상세 펼침/닫힘
// ════════════════════════════════════════════════════════════════

async function toggleDetail(studentId, nameEl) {
  const detailRow = document.getElementById(`detail-${studentId}`);
  const arrow     = nameEl.querySelector('.arrow');

  if (detailRow.style.display !== 'none') {
    detailRow.style.display = 'none';
    arrow.textContent = '▼';
    return;
  }

  detailRow.style.display = '';
  arrow.textContent = '▲';
  await renderScoreDetail(studentId);
}

// 특정 학생의 성적 상세를 아코디언 박스에 렌더링한다
async function renderScoreDetail(studentId) {
  const box = document.getElementById(`detail-box-${studentId}`);
  box.innerHTML = '로딩 중...';

  const res  = await fetch(`${API}/students/${studentId}/scores`);
  const data = await res.json();

  if (data.length === 0) {
    box.innerHTML = '<p class="no-score-msg">등록된 성적이 없습니다.</p>';
    return;
  }

  // 과목별 점수 태그 (수정/삭제 버튼 포함)
  box.innerHTML = data.map(s => `
    <span class="score-item" id="score-item-${s.id}">
      <span class="score-subject">${s.subject}</span>
      <span class="score-value">${s.score}점</span>
      <button class="edit-score-btn"
        onclick="editScore(${s.id}, ${studentId}, '${s.subject}', ${s.score})">수정</button>
      <button class="danger mini"
        onclick="deleteScore(${s.id}, ${studentId})">삭제</button>
    </span>
  `).join('');
}

// ════════════════════════════════════════════════════════════════
// 학생 등록 (POST /api/students)
// ════════════════════════════════════════════════════════════════
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name       = document.getElementById('name').value.trim();
  const student_no = document.getElementById('student_no').value.trim();
  const msg        = document.getElementById('studentMsg');

  if (!/^\d+$/.test(student_no)) {
    msg.textContent = '학번은 숫자만 입력할 수 있습니다.';
    msg.className = 'msg error';
    return;
  }

  const res  = await fetch(`${API}/students`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, student_no }),
  });
  const data = await res.json();

  if (res.ok) {
    msg.textContent = `${name} 학생이 등록되었습니다.`;
    msg.className = 'msg';
    document.getElementById('studentForm').reset();
    loadStudents();
  } else {
    msg.textContent = data.error;
    msg.className = 'msg error';
  }
});

// ════════════════════════════════════════════════════════════════
// 학생 인라인 수정
// ════════════════════════════════════════════════════════════════

// 수정 버튼 클릭 — 해당 행의 이름/학번 셀을 입력 필드로 바꾼다
function editStudent(id, currentName, currentNo, btn) {
  const tr = btn.closest('tr');
  tr.cells[0].innerHTML =
    `<input type="text" class="inline-input" id="edit-name-${id}"
      value="${currentName}" maxlength="50" />`;
  tr.cells[1].innerHTML =
    `<input type="text" class="inline-input" id="edit-no-${id}"
      value="${currentNo}" maxlength="20" inputmode="numeric" />`;
  tr.cells[5].innerHTML = `
    <button class="save-btn" onclick="saveStudent(${id})">저장</button>
    <button class="secondary"  onclick="loadStudents()">취소</button>
  `;
}

// 저장 버튼 클릭 — PUT 요청으로 학생 정보 업데이트
async function saveStudent(id) {
  const name       = document.getElementById(`edit-name-${id}`).value.trim();
  const student_no = document.getElementById(`edit-no-${id}`).value.trim();

  if (!name || !student_no) { alert('이름과 학번을 입력해주세요.'); return; }
  if (!/^\d+$/.test(student_no)) { alert('학번은 숫자만 입력할 수 있습니다.'); return; }

  const res  = await fetch(`${API}/students/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, student_no }),
  });
  const data = await res.json();

  if (res.ok) {
    loadStudents();
  } else {
    alert(data.error);
  }
}

// ════════════════════════════════════════════════════════════════
// 학생 삭제 (DELETE /api/students/:id)
// ════════════════════════════════════════════════════════════════
async function deleteStudent(id) {
  if (!confirm('정말 삭제하시겠습니까? 해당 학생의 성적도 모두 삭제됩니다.')) return;

  const res = await fetch(`${API}/students/${id}`, { method: 'DELETE' });
  if (res.ok) loadStudents();
}

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

  const res  = await fetch(`${API}/students/${studentId}/scores`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ subject, score: Number(score) }),
  });
  const data = await res.json();

  if (res.ok) {
    msg.textContent = `${subject} 성적이 입력되었습니다.`;
    msg.className = 'msg';
    document.getElementById('scoreForm').reset();
    loadStudents();
  } else {
    msg.textContent = data.error;
    msg.className = 'msg error';
  }
});

// ════════════════════════════════════════════════════════════════
// 성적 인라인 수정
// ════════════════════════════════════════════════════════════════

// 아코디언 내 수정 버튼 클릭 — 해당 태그를 입력 필드로 바꾼다
function editScore(scoreId, studentId, currentSubject, currentScore) {
  const item = document.getElementById(`score-item-${scoreId}`);
  item.innerHTML = `
    <input type="text"   class="inline-input small" id="edit-subj-${scoreId}"
      value="${currentSubject}" maxlength="50" />
    <input type="number" class="inline-input small" id="edit-score-${scoreId}"
      value="${currentScore}" min="0" max="100" step="1" />
    <button class="save-btn"  onclick="saveScore(${scoreId}, ${studentId})">저장</button>
    <button class="secondary mini" onclick="renderScoreDetail(${studentId})">취소</button>
  `;
}

// 성적 저장 — PUT 요청
async function saveScore(scoreId, studentId) {
  const subject = document.getElementById(`edit-subj-${scoreId}`).value.trim();
  const score   = Number(document.getElementById(`edit-score-${scoreId}`).value);

  if (!subject) { alert('과목명을 입력해주세요.'); return; }
  if (score < 0 || score > 100) { alert('점수는 0~100 사이여야 합니다.'); return; }

  const res  = await fetch(`${API}/scores/${scoreId}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ subject, score }),
  });
  const data = await res.json();

  if (res.ok) {
    loadStudents();                    // 평균/등급 갱신
    renderScoreDetail(studentId);      // 아코디언 새로고침
  } else {
    alert(data.error);
  }
}

// ════════════════════════════════════════════════════════════════
// 성적 삭제 (DELETE /api/scores/:id)
// ════════════════════════════════════════════════════════════════
async function deleteScore(scoreId, studentId) {
  if (!confirm('이 성적을 삭제하시겠습니까?')) return;

  const res = await fetch(`${API}/scores/${scoreId}`, { method: 'DELETE' });
  if (res.ok) {
    loadStudents();
    renderScoreDetail(studentId);
  }
}

// ════════════════════════════════════════════════════════════════
// 검색 + 새로고침 버튼 + 초기 로드
// ════════════════════════════════════════════════════════════════
document.getElementById('searchInput').addEventListener('input', applyFilterAndSort);
document.getElementById('refreshBtn').addEventListener('click', loadStudents);

loadStudents();
