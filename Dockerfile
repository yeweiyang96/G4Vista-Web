FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN npm install -g pnpm@10.18.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM caddy:2-alpine AS prod

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/g4vista-web/ /srv

