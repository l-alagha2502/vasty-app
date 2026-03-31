# Use Node 20 on Alpine for a small, fast image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard ensures both package.json AND package-lock.json are copied
COPY package*.json ./

# Just run npm install to get the dependencies ready
RUN npm install --production

# Bundle app source
COPY . .

# Set production environment
ENV NODE_ENV=production

# Start the bot from your src folder
CMD [ "node", "src/index.js" ]