FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev dependencies so tooling like Swagger/prom-client are available)
RUN npm install

# Copy application code
COPY . .

# Expose the port the app runs on (container port should match app.listen / docker-compose)
EXPOSE 5004

# Command to run the application
CMD ["node", "index.js"]
