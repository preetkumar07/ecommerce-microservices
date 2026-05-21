FROM node:20-alpine AS base
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1
CMD ["node", "src/server.js"]