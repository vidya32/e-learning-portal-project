# Use an official nginx image as the base
FROM nginx:1.21-alpine

# Copy the static website files
COPY *.html /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/

# NEW LINE: Copy the nginx proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The container will listen on port 80
EXPOSE 80