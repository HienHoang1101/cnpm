FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev dependencies so tooling like Swagger/prom-client are available)
RUN npm install

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5001

# Command to run the application
CMD ["node", "index.js"] 