FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

ENV PORT=80
ENV VITE_API_BASE_URL=http://localhost:8000/api

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["sh", "-c", "printf 'window.__APP_CONFIG__ = { VITE_API_BASE_URL: \"%s\" };\\n' \"$VITE_API_BASE_URL\" > /usr/share/nginx/html/config.js && nginx -g 'daemon off;'"]
