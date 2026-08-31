FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Setting host so Vite is accessible from outside container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
