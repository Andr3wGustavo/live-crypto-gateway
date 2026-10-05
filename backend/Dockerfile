FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node backend/src ./src
COPY --chown=node:node backend/scripts ./scripts
COPY --chown=node:node db /app/db
USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
