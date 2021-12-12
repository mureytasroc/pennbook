FROM node:17

WORKDIR /app/

COPY package*.json ./

ENV NODE_ENV production

RUN npm ci --only=production

COPY . .
