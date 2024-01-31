FROM node:20 AS BUILD

WORKDIR /usr/app

COPY --chown=node:node package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY .eslintrc.js ./
COPY .prettierrc ./
COPY nest-cli.json ./
COPY src ./src

ENV NODE_ENV production

RUN npm run build

FROM node:20-alpine AS RUNTIME

WORKDIR /usr/app

COPY --from=BUILD /usr/app/package*.json ./
RUN npm ci --production

COPY --from=BUILD /usr/app/dist ./dist

ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

CMD [ "node", "dist/main.js" ]
