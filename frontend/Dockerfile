FROM node:18-alpine

WORKDIR /app

# 의존성 먼저 설치 (package.json만 복사해서 캐시 활용)
COPY package.json .
RUN npm install

# 나머지 정적 파일 복사 (index.html, app.js, style.css, server.js)
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
