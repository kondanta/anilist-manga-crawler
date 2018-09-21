FROM node:10

WORKDIR /usr/src/crawler

COPY ../package.json ../yarn.lock ./

RUN npm install

COPY . .

CMD ["node", "index", "--page 15"]
