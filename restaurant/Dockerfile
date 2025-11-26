FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev dependencies so tooling like Swagger/prom-client are available)
RUN npm install

# Copy application code
COPY . .

# Add local shims into node_modules so imports like `shared-kafka` resolve
# during runtime (useful for local development builds).
RUN mkdir -p node_modules/shared-kafka && cp -R shims/shared-kafka/* node_modules/shared-kafka/ || true

# Expose the port the app runs on
EXPOSE 5006

# Command to run the application
CMD ["node", "index.js"] 