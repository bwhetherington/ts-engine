FROM node:12

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build:client

EXPOSE 8080

CMD ["npm", "run", "server"]