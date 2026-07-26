# Stage 1: Build Vite application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (non-root unprivileged image)
FROM nginxinc/nginx-unprivileged:alpine

# Switch to root temporarily to install curl for healthcheck
USER root
RUN apk add --no-cache curl

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Switch back to non-root user 'nginx' (UID 101)
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
