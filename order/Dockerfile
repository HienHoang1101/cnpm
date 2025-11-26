FROM node:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (include dev deps so Swagger packages are present)
RUN npm install

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 5002

# Command to run the application
CMD ["node", "index.js"] 