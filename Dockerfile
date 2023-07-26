FROM node:18-bullseye

WORKDIR /usr/oauth-agent
COPY src  /usr/oauth-agent/src
COPY pages /usr/oauth-agent/pages
COPY next-env.d.ts /usr/oauth-agent/
COPY tsconfig.json /usr/oauth-agent/
COPY package*.json       /usr/oauth-agent/

RUN npm install
RUN npm run build

RUN groupadd --gid 10000 apiuser \
  && useradd --uid 10001 --gid apiuser --shell /bin/bash --create-home apiuser
USER 10001

CMD ["npm", "start"]
