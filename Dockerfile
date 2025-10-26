FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000
CMD ["node","index.js"]