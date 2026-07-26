FROM node:20-alpine

WORKDIR /app

# Install curl for HTTP healthchecks
RUN apk add --no-cache curl

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Create uploads directory and set ownership to non-root user 'node'
RUN mkdir -p public/uploads && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 5000

# Start command in foreground: sync database schema then start Express server
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push --accept-data-loss; exec node index.js"]
