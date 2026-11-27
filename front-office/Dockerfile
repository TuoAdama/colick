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
# Reinstall dependencies at container startup to keep the named node_modules volume
# aligned with the lockfile copied in the image.
# --host 0.0.0.0 allows connections from outside the container
# --poll enables file watching in Docker environments
CMD ["sh", "-c", "npm ci && ng serve --host 0.0.0.0 --poll=2000"]
