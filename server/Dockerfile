FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p public/uploads

EXPOSE 5000

# Start command running database migration/push then starting server
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push --accept-data-loss; node index.js"]
