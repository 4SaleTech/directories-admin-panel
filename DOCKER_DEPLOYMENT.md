# Docker Deployment Guide - Admin Directories UI

## Overview
This Next.js 14 application is containerized using Docker with multi-stage builds for optimal image size and performance.

---

## Quick Start

### Development (Local)

```bash
# Run with docker-compose
docker-compose up

# Or build and run manually
docker build -t admin-directories:latest .
docker run -p 3001:3001 admin-directories:latest
```

### Production

```bash
# Build with production environment variables
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://directories-apis.q84sale.com/api/v2 \
  -t admin-directories:production .

# Run production container
docker run -d \
  -p 3001:3001 \
  --name admin-directories \
  --restart unless-stopped \
  admin-directories:production
```

---

## Environment Variables

Required environment variable (set at build time):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `https://staging-directories-apis.q84sale.com/api/v2` |

**Note**: The admin UI only needs the backend API URL. All S3 uploads, authentication, and business logic are handled by the backend.

---

## Docker Compose

### Basic Usage

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up --build
```

### Environment Configuration

Create a `.env` file:

```bash
NEXT_PUBLIC_API_BASE_URL=https://staging-directories-apis.q84sale.com/api/v2
```

---

## Dockerfile Details

### Multi-Stage Build

The Dockerfile uses 3 stages for optimal build:

1. **deps** - Install dependencies
2. **builder** - Build the Next.js application
3. **runner** - Production runtime image

### Image Size

- Base image: `node:20-alpine` (~40MB)
- Final image: ~150-200MB (with standalone output)
- Build cache: Optimized for faster rebuilds

### Security Features

- Runs as non-root user (`nextjs`)
- Minimal attack surface (Alpine Linux)
- No development dependencies in final image
- Health checks enabled

---

## Health Checks

The container includes automatic health monitoring:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3001/
```

Health check configuration:
- Interval: 30 seconds
- Timeout: 3 seconds
- Retries: 3
- Start period: 10 seconds

---

## Deployment Platforms

### Render

**render.yaml**:
```yaml
services:
  - type: web
    name: admin-directories
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://directories-apis.q84sale.com/api/v2
    healthCheckPath: /
```

### AWS ECS

```bash
# Build and tag
docker build -t admin-directories:latest .
docker tag admin-directories:latest your-registry/admin-directories:latest

# Push to ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin your-registry
docker push your-registry/admin-directories:latest
```

### DigitalOcean App Platform

```yaml
name: admin-directories
services:
  - name: web
    dockerfile_path: Dockerfile
    github:
      branch: main
      deploy_on_push: true
    health_check:
      http_path: /
    http_port: 3001
    instance_count: 1
    instance_size_slug: basic-xs
    envs:
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://directories-apis.q84sale.com/api/v2
```

---

## Troubleshooting

### Build Issues

**Issue**: `Error: Cannot find module './server.js'`
**Solution**: Ensure `output: 'standalone'` is set in `next.config.js`

**Issue**: Build args not working
**Solution**: Use `--build-arg` flag or set in docker-compose.yml

### Runtime Issues

**Issue**: API calls failing
**Solution**: Check NEXT_PUBLIC_API_BASE_URL is accessible from container

**Issue**: Port already in use
**Solution**: Change port mapping: `-p 3002:3001`

### Logs

```bash
# View container logs
docker logs admin-directories

# Follow logs
docker logs -f admin-directories

# With docker-compose
docker-compose logs -f admin-ui
```

---

## Optimization Tips

### Build Cache

Leverage Docker layer caching:

```bash
# Use BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -t admin-directories:latest .
```

### Multi-Platform Builds

```bash
# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t admin-directories:latest \
  --push .
```

### Reduce Image Size

Current optimizations:
- ✅ Alpine base image
- ✅ Standalone output (Next.js)
- ✅ Multi-stage build
- ✅ .dockerignore file
- ✅ No dev dependencies in final image

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_BASE_URL=${{ secrets.API_URL }} \
            -t admin-directories:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push admin-directories:${{ github.sha }}
```

---

## Monitoring

### Resource Usage

```bash
# Monitor resource usage
docker stats admin-directories

# Memory limit
docker run -m 512m -p 3001:3001 admin-directories:latest

# CPU limit
docker run --cpus="1.0" -p 3001:3001 admin-directories:latest
```

### Recommended Limits

For production:
- Memory: 512MB - 1GB
- CPU: 0.5 - 1.0 cores
- Disk: 500MB

---

## Rollback

```bash
# Tag current version
docker tag admin-directories:latest admin-directories:backup

# Deploy new version
docker-compose up -d

# Rollback if needed
docker-compose down
docker tag admin-directories:backup admin-directories:latest
docker-compose up -d
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify environment variables
- Test health endpoint: `curl http://localhost:3001/`
- Review Next.js documentation: https://nextjs.org/docs/deployment
