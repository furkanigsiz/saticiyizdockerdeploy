FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Node.js için bellek sınırı ayarla (300MB)
ENV NODE_OPTIONS="--max-old-space-size=300"

RUN npm install --legacy-peer-deps

COPY . .

# Default port'u ayarla
ENV PORT=3000

# Start komutu çalıştır
CMD ["npm", "start"] 