FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 5000

# Set up the command to run the app
CMD ["npm", "run", "start"] 