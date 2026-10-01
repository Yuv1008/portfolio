# Build context is the repo root, not apps/api: the API depends on
# packages/shared through the workspace, so both must be in the context.
#
#   docker build -f apps/api/Dockerfile -t portfolio-api .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app
ENV CI=true

# ---- dependencies -----------------------------------------------------------
# Manifests and the Prisma schema are copied before the install, because the
# api package generates its Prisma Client in a postinstall hook.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @portfolio/api... --filter @portfolio/shared...

# ---- build ------------------------------------------------------------------
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json ./
RUN pnpm --filter @portfolio/shared build \
 && pnpm --filter @portfolio/api exec tsc -p tsconfig.json

# ---- runtime ----------------------------------------------------------------
# A second, production-only install rather than copying the build's
# node_modules, so no dev dependency reaches the image.
FROM base AS runtime
ENV NODE_ENV=production

# Everything below runs as `node`, and every COPY lands already owned by it.
# A `chown -R` at the end would instead rewrite every file into a new layer —
# that one line cost 296MB.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node packages/shared/package.json packages/shared/
COPY --chown=node:node apps/api/package.json apps/api/
COPY --chown=node:node apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --prod --filter @portfolio/api... --filter @portfolio/shared... \
 && pnpm store prune

# Generated against the engines installed in this stage, not copied from the
# build stage where the dependency tree differs. Explicit because pnpm skips
# the root `prepare` hook on a production install.
RUN pnpm --filter @portfolio/api exec prisma generate

COPY --from=build --chown=node:node /app/packages/shared/dist packages/shared/dist
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist

EXPOSE 4000
ENV PORT=4000

# Migrations run on boot so a deploy cannot serve against an older schema.
CMD ["sh", "-c", "pnpm --filter @portfolio/api exec prisma migrate deploy && node apps/api/dist/index.js"]
