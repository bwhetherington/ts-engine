FROM node:16

WORKDIR /usr/src/app

ENV PORT=8080
ENV GAME_DB=https://game.db.bwhetherington.com
EXPOSE 8080

# Install dependencies
# This is a separate step from building the client so that dependencies do not
# need to be reinstalled for all code changes
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
