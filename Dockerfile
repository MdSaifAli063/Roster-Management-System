# Build React app
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --include=dev
COPY client/ ./
ENV NODE_ENV=production
RUN npm run build

# Production: Node API + Python PDF extractor + static files
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    tesseract-ocr \
    poppler-utils \
    libglib2.0-0 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/pdf-extractor
COPY pdf-extractor/ ./
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=8080
ENV ENABLE_SOCKET=false
ENV PYTHON_PATH=python3
ENV PDF_EXTRACTOR_ROOT=/app/pdf-extractor
EXPOSE 8080

CMD ["node", "index.js"]
