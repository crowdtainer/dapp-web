FROM node:19.5.0-alpine3.16 AS builder
RUN apk update && apk add --no-cache curl py-pip make g++
WORKDIR /app
COPY package.json package-lock.json ./
# RUN npm ci
RUN npm install
COPY . .
RUN npm run build
# RUN npm ci --omit=dev

FROM node:19.5.0-alpine3.16 as deploy-node
USER node:node
WORKDIR /app
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json .
CMD ["node","-r", "dotenv/config", "build"]

FROM node:19.5.0-alpine3.16 as debugger
USER node:node
WORKDIR /app
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json .
# CMD ["node","-r", "dotenv/config", "build"]