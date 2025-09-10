# Use the official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb first
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the code
COPY . .

# Expose the port your server listens on
EXPOSE 4000

# Start the app
CMD ["bun", "run", "src/index.ts"]
