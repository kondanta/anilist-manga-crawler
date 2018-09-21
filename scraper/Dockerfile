FROM node:10

WORKDIR /usr/src/scraper

COPY ./package.json ./yarn.lock ./

RUN npm install

COPY . .

CMD ["node", "lhs"]
