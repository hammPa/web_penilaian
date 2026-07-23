# STAGE 1: Build & Install Dependencies
FROM node:20-alpine AS builder

# Install build tools untuk native C/C++ modules (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Copy manifest dependency
COPY package*.json ./

# Install semua dependency (termasuk native bindings)
RUN npm ci

# STAGE 2: Production Image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy node_modules yang sudah ter-compile dari Stage 1
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code aplikasi
COPY src ./src
COPY schema_final.sql ./
COPY migrate-to-sqlite.js ./
COPY migrate_hash_pass.js ./

# Buat folder untuk Persistent Storage (Uploads & Database SQLite)
RUN mkdir -p public/uploads data

# Expose port ( Railway default/custom port )
EXPOSE 7860

# Jalankan server
CMD ["node", "src/server.js"]