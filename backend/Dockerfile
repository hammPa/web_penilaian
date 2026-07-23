FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy manifest dependency
COPY package*.json ./

# Install dependencies khusus production
RUN npm ci --only=production

# Copy source code & script pendukung
COPY src ./src
COPY schema_final.sql ./

# Buat folder untuk uploads (Persistent Storage jika ada file upload)
RUN mkdir -p public/uploads && chown -R node:node /app

USER node

EXPOSE 7860

CMD ["node", "src/server.js"]