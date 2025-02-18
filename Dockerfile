FROM node:22-alpine

WORKDIR /app

COPY package.json package.json
RUN npm install

RUN mkdir -p dist/server && echo "export const render = null" > dist/server/entry-server.js
COPY biome.json biome.json
COPY tsconfig.json tsconfig.json
COPY vite.config.ts vite.config.ts
COPY .env .env
COPY jest.config.js jest.config.js
COPY tests tests
COPY src/types src/types
COPY index.html index.html
COPY server.ts server.ts
COPY src/entry-client.tsx src/entry-client.tsx
COPY src/entry-server.tsx src/entry-server.tsx
COPY src/database/checkConnection.ts src/database/checkConnection.ts
COPY src/database/client.ts src/database/client.ts
COPY src/express src/express
COPY src/react src/react

ENTRYPOINT [ "npm", "run" ]
