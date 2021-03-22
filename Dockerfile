FROM node:12.19.0

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
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libxtst6 gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Note: NODE_ENV is development so that dev deps are installed
RUN NODE_ENV=development npm install

# Expose port
EXPOSE 3000

# Change ownership of the app to the unprivileged user
RUN chown appuser:appuser -R /home/appuser/app
USER appuser

# Apply start commands
COPY entrypoint.sh /
CMD ["/entrypoint.sh"]
