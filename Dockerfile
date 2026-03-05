FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application (assuming npm run dev starts the app)
CMD ["npm", "run", "dev"]
