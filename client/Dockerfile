FROM node:lts-slim
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ARG port
ENV PORT=$port
EXPOSE $PORT
CMD [ "npm", "start" ]
