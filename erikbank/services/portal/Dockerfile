FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm install && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
ENV PORT=8085
EXPOSE 8085
CMD ["node", "dist/server.js"]
