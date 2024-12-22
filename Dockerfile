FROM node:20-alpine

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY tsconfig.json tsconfig.json
COPY tsconfig.app.json tsconfig.app.json
COPY tsconfig.node.json tsconfig.node.json
COPY vite.config.ts vite.config.ts
COPY database/checkConnection.ts database/checkConnection.ts
COPY database/client.ts database/client.ts
COPY .env .env
COPY index.html index.html
COPY server.ts server.ts
COPY src src

ENTRYPOINT [ "npm", "run" ]
