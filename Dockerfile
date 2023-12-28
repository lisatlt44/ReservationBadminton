FROM node:19-alpine3.16

WORKDIR /usr/src/app

COPY api/ .

EXPOSE 3000