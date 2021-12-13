FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ./node_modules/.bin/quasar build
RUN npm install -g @quasar/cli
EXPOSE 4000
CMD [ "quasar", "serve", "./dist/spa" ]
