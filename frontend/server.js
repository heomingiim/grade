// Express로 정적 파일(HTML/CSS/JS)을 서빙하는 프론트엔드 서버
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3000;

// 현재 디렉토리의 정적 파일을 그대로 클라이언트에 제공한다
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`프론트엔드 서버 실행 중: http://localhost:${PORT}`);
});
