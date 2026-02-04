# Dockerfile for Angular Front-Office Development
# This Dockerfile sets up a Node.js environment for Angular development with hot reload support

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Start Angular development server with hot reload
# --host 0.0.0.0 allows connections from outside the container
# --poll enables file watching in Docker environments
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll=2000"]
