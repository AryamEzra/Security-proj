# Use the official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package.json and bun.lockb first
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the GeoLite2-City.mmdb file
COPY GeoLite2-City.mmdb ./

# Copy source code
COPY src ./src

# Expose the port your server listens on
EXPOSE 4000

# Start the app
CMD ["bun", "run", "src/index.ts"]