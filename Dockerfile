# Build React app
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --include=dev
COPY client/ ./
ENV NODE_ENV=production
RUN npm run build

# Production API + static files
FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=8080
ENV ENABLE_SOCKET=false
EXPOSE 8080

CMD ["node", "index.js"]
