# v10 is the latest LTS
FROM node:10.15.3

# Allow user configuration of variable at build-time using --build-arg flag
# See src/client-env-vars.json
ARG NODE_ENV
ARG BASE_URL

# Initialize environment and override with build-time flag, if set
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
# Puppeteer requirements
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

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

# Apply start commands
COPY entrypoint.sh /
CMD ["/entrypoint.sh"]
