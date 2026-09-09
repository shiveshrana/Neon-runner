# syntax=docker/dockerfile:1

# ---- Build stage ----------------------------------------------------

FROM node:22-slim AS build

WORKDIR /app

# Vite environment variables are compile-time values.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build


# ---- Runtime stage --------------------------------------------------

FROM nginx:alpine AS runtime

# Update Alpine packages to the latest available security fixes.
RUN apk update && apk upgrade --no-cache

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Run nginx as an unprivileged user on port 8080.
RUN sed -i 's/listen\s\*80;/listen 8080;/' /etc/nginx/conf.d/default.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]