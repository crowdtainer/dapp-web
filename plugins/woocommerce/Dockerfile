FROM node:21.1.0-alpine3.18 AS wooCommerceBuilder
RUN apk update && apk add --no-cache curl py-pip make g++
WORKDIR /app
COPY package.json package-lock.json ./
# RUN npm ci
RUN npm install
COPY . .
RUN npm run build

FROM node:21.1.0-alpine3.18 as wooCommerceOrder
USER node:node
WORKDIR /app
COPY --from=mailerPluginBuilder --chown=node:node /app/dist ./dist
COPY --from=mailerPluginBuilder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json .
CMD ["node","-r", "dotenv/config", "dist/server.js"]