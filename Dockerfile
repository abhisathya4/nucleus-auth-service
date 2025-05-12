# Use a base image with Node.js and Bun installed
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy dependencies
COPY package*.json ./

# Install frontend dependencies
RUN bun install

# Copy files from the rest of the app
COPY . .

# Expose the port
EXPOSE 3000

CMD ["bun", "run", "dev"]
