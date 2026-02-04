# Build stage
FROM node:20-alpine as build

WORKDIR /app

ARG VITE_GATEWAY_URL=/
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
