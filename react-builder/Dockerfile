FROM node:18-alpine

WORKDIR /react

# We list files for debugging, then install dependencies and build
CMD ["sh", "-c", "echo '--- Listing files in /react ---' && ls -la && echo '--- Starting build ---' && npm cache clean --force && npm install --legacy-peer-deps && npm run build"]