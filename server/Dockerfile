FROM node:lts-slim
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG port
ENV PORT=$port
EXPOSE $PORT

# You can change this
CMD [ "npm", "run", "dev" ]
# CMD [ "npm", "run", "debug" ]