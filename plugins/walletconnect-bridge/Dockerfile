FROM node:19.6.0-alpine3.16 AS walletConnectServerBuilder
RUN apk update && apk add --no-cache curl py-pip make g++
WORKDIR /app
COPY package.json package-lock.json ./
# RUN npm ci
RUN npm install
COPY . .
RUN npm run build

FROM node:19.6.0-alpine3.16 as walletConnectServer
USER node:node
WORKDIR /app
COPY --from=walletConnectServerBuilder --chown=node:node /app/dist ./dist
COPY --from=walletConnectServerBuilder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json .
CMD ["node","-r", "dotenv/config", "dist/index.js"]