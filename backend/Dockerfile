# STAGE 1: Build & Compile Native Modules (termasuk C++ bindings untuk SQLite jika ada)
FROM node:20-alpine AS builder

# Install build tools yang dibutuhkan untuk mengompress/kompilasi modul
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy manifest dependency
COPY package*.json ./

# Install semua dependency
RUN npm ci

# ===================================================

# STAGE 2: Production Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# 1. Ubah PORT default ke 5000
ENV PORT=5000

# Copy node_modules yang sudah terkompilasi dari builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code & script pendukung
COPY src ./src
COPY schema_final.sql ./
COPY migrate-to-sqlite.js ./
COPY migrate_hash_pass.js ./

# 2. Buat folder uploads dan data (supaya siap jika pakai SQLite maupun File Uploads)
RUN mkdir -p public/uploads src/data && chown -R node:node /app

USER node

# 3. Ubah EXPOSE port ke 5000
EXPOSE 5000

CMD ["node", "src/server.js"]