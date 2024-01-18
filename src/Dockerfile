FROM node:18

RUN npm install --global yarn

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production

copy . .

CMD ["yarn", "start"]


