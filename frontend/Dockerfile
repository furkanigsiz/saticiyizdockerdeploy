FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Default port'u ayarla
ENV PORT=3000

# Start komutu çalıştır
CMD ["npm", "start"] 