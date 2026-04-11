FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure uploads directory exists, will be overridden by a named volume at runtime
RUN mkdir -p uploads

EXPOSE 5050
CMD ["node", "server.js"]