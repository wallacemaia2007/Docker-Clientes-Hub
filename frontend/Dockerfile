# Etapa de build: Vite gera ficheiros estáticos para produção.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

# Etapa final: imagem pequena do Nginx serve o front e faz proxy para a API.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
