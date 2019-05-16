# v10 is the latest LTS
FROM node:10.15.3

# Allow user configuration of variable at build-time using --build-arg flag
ARG NODE_ENV

# Initialize NODE_ENV and override with build-time flag, if set 
ENV NODE_ENV ${NODE_ENV:-production}

# Create an unprivileged user w/ home directory
RUN groupadd appuser \
  && useradd --gid appuser --shell /bin/bash --create-home appuser
  
# Create app directory
RUN mkdir -p /home/appuser/app
WORKDIR /home/appuser/app

# Copy in source code
COPY . /home/appuser/app

# Install app dependencies
# Note: NODE_ENV is development so that dev deps are installed
RUN NODE_ENV=development npm install

# Build project
RUN npm run clean
RUN npm run build

# Expose port
EXPOSE 3000

# Change ownership of the app to the unprivileged user
RUN chown appuser:appuser -R /home/appuser/app
USER appuser

# Run the command that starts the app
CMD npm start
