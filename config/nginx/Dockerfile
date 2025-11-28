# Nginx Dockerfile for NeuroNova
FROM nginx:1.25-alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# React 빌드 파일 복사 (멀티스테이지 빌드에서 사용)
# COPY --from=react-build /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
