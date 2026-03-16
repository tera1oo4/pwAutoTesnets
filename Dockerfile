FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Create artifacts directory
RUN mkdir -p ./artifacts

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Default command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]
