FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Node.js için bellek sınırı ayarla (300MB)
ENV NODE_OPTIONS="--max-old-space-size=300"

# PORT değişkenini açıkça tanımla
ENV PORT=10000

RUN npm install --legacy-peer-deps

COPY . .

# Start script'i package.json'da tanımlı olmalı
CMD ["npm", "start"] 