FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
ARG VITE_ENABLE_DEMO=true
ENV VITE_DATA_MODE=api VITE_API_URL=/api/v1 VITE_SPORTS_MODE=espn
ENV VITE_ENABLE_DEMO=${VITE_ENABLE_DEMO}
RUN npm run build

FROM nginx:stable-alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://host.docker.internal:8080
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL
EXPOSE 80
