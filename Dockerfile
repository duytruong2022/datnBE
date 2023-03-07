FROM node:14-alpine AS BUILD_IMAGE

# install core libraries
RUN apk update && apk add yarn curl bash make && rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn build

FROM node:14-alpine

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /usr/src/app/.env ./.env
COPY --from=BUILD_IMAGE /usr/src/app/scripts ./scripts
COPY --from=BUILD_IMAGE /usr/src/app/keys ./keys
COPY --from=BUILD_IMAGE /usr/src/app/package.json ./package.json

RUN mkdir service-folder && cd service-folder && \
    mkdir temp_folder temp_download_folder uploads file_storage_support_request_folder file_storage_support_request_csv_folder file_storage_planning_folder
RUN apk update && apk add openssh

EXPOSE 3000

CMD node ./dist/src/main.js