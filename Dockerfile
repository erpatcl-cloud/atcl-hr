# =============================================================================
# ATCL Enterprise HRMS — Multi-Stage Dockerfile
# Stage 1 (build): Compiles the React 19 + Vite 8 application
# Stage 2 (production): Serves the production bundle via Nginx on port 80
# =============================================================================

FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm install

# Copy application source and build production assets
COPY . .
RUN npm run build

# -----------------------------------------------------------------------------
# Production Runtime Stage
# -----------------------------------------------------------------------------
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing support so all routes resolve to index.html
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
