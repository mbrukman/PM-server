FROM node:10.17.0-jessie as base

# Create app directory
WORKDIR /usr/src/app
COPY . .

WORKDIR /usr/src/app/server

RUN npm run install:all

RUN npm run build:prod

FROM node:10.17.0-alpine

WORKDIR /app

COPY --from=base /usr/src/app/server/ .

CMD ["npm", "start"]