# Use Microsoft's official image for Node.js 18 Azure Functions V4
FROM mcr.microsoft.com/azure-functions/node:4-node18

# The official image expects the code to be in this directory
ENV AzureWebJobsScriptRoot=/home/site/wwwroot

# Set the working directory
WORKDIR /home/site/wwwroot

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application code
COPY . .
