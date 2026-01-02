FROM node:20-alpine

WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm --filter api build

CMD ["pnpm", "--filter", "api", "start:prod"]
