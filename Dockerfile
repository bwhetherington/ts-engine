FROM node:12

WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build:client

EXPOSE 8080

CMD ["npm", "run", "server"]