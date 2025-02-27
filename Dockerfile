FROM node:16-alpine
ARG PROFILE
WORKDIR  /usr/src/app
COPY  package.json ./
RUN npm install
COPY . .
EXPOSE 32010
ENV NODE_ENV=$PROFILE
RUN echo "$NODE_ENV"
CMD ["node" , "index.js"]