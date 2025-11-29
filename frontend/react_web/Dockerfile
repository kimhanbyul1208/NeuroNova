# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .

# Build for production
RUN npm run build

# Production stage # 2. Deploy stage
FROM nginx:alpine

# Copy build artifacts to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config if needed (optional, using default for now)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
