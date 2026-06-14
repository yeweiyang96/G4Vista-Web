FROM debian:bookworm-slim AS build

ARG MISE_VERSION=v2026.6.3
ARG DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV MISE_DATA_DIR="/mise" \
    MISE_CONFIG_DIR="/mise" \
    MISE_CACHE_DIR="/mise/cache" \
    MISE_INSTALL_PATH="/usr/local/bin/mise" \
    MISE_YES="1" \
    PATH="/mise/shims:/usr/local/bin:${PATH}"

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash ca-certificates curl gnupg libatomic1 xz-utils \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://mise.run | MISE_VERSION="${MISE_VERSION}" sh

COPY mise.toml package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mise trust mise.toml \
    && mise install \
    && mise exec -- pnpm install --frozen-lockfile

COPY . .
RUN mise exec -- pnpm build

FROM caddy:2-alpine AS prod

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/g4vista-web/ /srv
