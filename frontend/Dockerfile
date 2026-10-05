FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL NEXT_TELEMETRY_DISABLED=1
ENV API_INTERNAL_URL=http://backend:8080
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
