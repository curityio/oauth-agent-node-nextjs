FROM node:18-alpine

WORKDIR /usr/oauth-agent
COPY src  /usr/oauth-agent/src
COPY pages /usr/oauth-agent/pages
COPY next-env.d.ts /usr/oauth-agent/
COPY tsconfig.json /usr/oauth-agent/
COPY package*.json       /usr/oauth-agent/

RUN npm install
RUN npm run build

RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser

USER apiuser
CMD ["npm", "start"]
