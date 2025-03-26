FROM node:18-slim

WORKDIR /app

# Gerekli build araçlarını yükle
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Ortam değişkenini ayarla
ENV NODE_ENV=production
ENV PORT=10000

# Package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --omit=dev

# Uygulamayı kopyala
COPY . .

# bcrypt uyumluluk sorunu için shim kullan (eğer gerekiyorsa)
RUN mkdir -p /app/node_modules/bcrypt-compat && \
    cp /app/src/utils/bcryptShim.js /app/node_modules/bcrypt-compat/index.js && \
    echo 'module.exports = require("bcrypt-compat");' > /app/node_modules/bcrypt/bcrypt.js

# Sağlık kontrolü
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:$PORT/health || exit 1

EXPOSE $PORT

# Uygulamayı çalıştır
CMD ["npm", "start"] 