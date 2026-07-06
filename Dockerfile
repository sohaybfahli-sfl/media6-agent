FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create state directory
RUN mkdir -p /app/data

# Default command
CMD ["node", "main.js"]
