FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Bağımlılıkları kur
RUN npm install --legacy-peer-deps

# Tüm projeyi kopyala
COPY . .

# React uygulamasını çalıştır
CMD ["npm", "start"] 