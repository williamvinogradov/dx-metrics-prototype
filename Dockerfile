###################
# BUILD
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
COPY --chown=node:node .env.docker ./.env.docker
COPY --chown=node:node . .
RUN npm run build
ENV NODE_ENV production
ENV ENVIRONMENT docker
RUN npm ci --only=production && npm cache clean --force
USER node

###################
# PRODUCTION
###################

FROM node:18-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/.env.docker ./.env.docker

CMD [ "node", "dist/src/main.js" ]
