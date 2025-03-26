FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Node.js için bellek sınırı ayarla (300MB)
ENV NODE_OPTIONS="--max-old-space-size=300"

# PORT değişkenini açıkça tanımla
ENV PORT=10000

RUN npm install --legacy-peer-deps

COPY . .

# Özel server.js oluştur
RUN echo 'const express = require("express"); const path = require("path"); const app = express(); app.use(express.static(path.join(__dirname, "build"))); app.get("*", function(req, res) { res.sendFile(path.join(__dirname, "build", "index.html")); }); app.listen(process.env.PORT || 10000, () => { console.log(`Server running on port ${process.env.PORT || 10000}`); });' > server.js

# Uygulamayı build et
RUN npm run build

# Server'ı başlat
CMD ["node", "server.js"] 