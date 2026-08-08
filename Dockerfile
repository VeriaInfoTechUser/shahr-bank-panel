# Preview container — builds the app and serves the bundle with `vite preview`.
# API endpoints are injected at build time via build args (VITE_BASE_URL / VITE_GRC_BASE_URL);
# when omitted, the fallbacks in src/constants/config.js are used.
#
# Build with custom endpoints:
#   docker build --build-arg VITE_BASE_URL=https://api.example.com/ \
#                --build-arg VITE_GRC_BASE_URL=https://grc.example.com/api/v1/ -t admin-panel .
FROM node:20.18.0-alpine

WORKDIR /app

COPY package*.json ./
# npm ci: reproducible install from the lockfile (fails if lockfile is out of sync)
RUN npm ci

ARG VITE_BASE_URL
ARG VITE_GRC_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL \
    VITE_GRC_BASE_URL=$VITE_GRC_BASE_URL

COPY . .
RUN npm run build

EXPOSE 3000

# drop privileges: the built assets are read-only, so a non-root user is enough
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3000/

CMD ["npx", "vite", "preview", "--host", "--port", "3000"]
