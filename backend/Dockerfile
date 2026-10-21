FROM node:22-alpine

WORKDIR /app

# Copiar primeiro os manifests permite aproveitar o cache de dependências.
COPY package*.json ./
RUN npm install --omit=dev

# O processo roda sem privilégios de root dentro do contêiner.
COPY --chown=node:node src ./src
USER node

EXPOSE 3000
CMD ["npm", "start"]
