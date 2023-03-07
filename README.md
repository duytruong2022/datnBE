<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

### Seed data

```bash
$ yarn seed
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

-   Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
-   Website - [https://nestjs.com](https://nestjs.com/)
-   Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

## Convert standalone node to replicaset in mongodb

This guide is for unbuntu

### first time setup

```bash
$ sudo service mongod stop
$ mongod --port 27017 --dbpath /srv/mongodb/db0 --replSet rs0 --bind_ip localhost
```

**Explain command**: config replica set, database path, bind ip address.
`--dbpath`: path to folder which you store your data
`--replSet`: name of replica set
`--bind_ip`: ip of host which can access to this db, apply `0.0.0.0` for public accessible
Open new terminal and connect to mongosh via:

```
$ mongosh
```

Init replica set

```
$ rs.initiate()
```

Check status of replica set

```
$ rs.status()
```

### Running app with replica set

```
$ mongod --port 27017 --dbpath /srv/mongodb/db0 --replSet rs0 --bind_ip localhost
```

Please change `/srv/mongodb/db0` according to your local




# Running the project by docker
***Note:***
- Variables marked {} mean you have to change it.
  Example: `SFTP_PASSWORD={password}` change to `SFTP_PASSWORD=123456` (123456 is password you need for sftp).

Go to the `pmf-3dwebviewer-backend` directory.
```
$ cd pmf-3dwebviewer-backend
```

Get the public ip address of your host machine (`hostname -I` or `ifconfig`).
Example:
```
$ hostname -I
172.16.0.127 172.20.0.1 172.22.0.1 172.23.0.1 172.24.0.1 172.17.0.1 172.26.0.1 192.168.240.1
```

and the public ip address is `172.16.0.127`.

## Setup for sftp
Update variables in .env file:
```
SFTP_HOST={172.16.0.127}
SFTP_PORT=2222
SFTP_USERNAME={ftpuser}
SFTP_PASSWORD={password}
SFTP_DEFAULT_PATH=/share
SFTP_PROJECT_DEFAULT_PATH=/share/projects
SFTP_USERS_DEFAULT_PATH=/share/repertories
SFTP_INSTANCE_LOG_FOLDER_PATH=/share/logs/instance
SFTP_SERVER_LOG_FOLDER_PATH=/share/logs/server
SFTP_LICENSE_LOG_FOLDER_PATH=/share/logs/license
SFTP_TEMP_FOLDER=/usr/src/app/service-folder/temp_folder
SFTP_TEMP_DOWNLOAD_FOLDER=/usr/src/app/service-folder/temp_download_folder
```

Create folder for sftp server in `pmf-3dwebviewer-backend` folder
```
mkdir -p sftp-data/share
```


## Setup for Redis
In the `redis/conf` directory, copy `redis.conf.default` to `redis.conf` and config the `redis.conf` file.
```
$ cp redis/conf/redis.conf.default redis/conf/redis.conf
```

Open the `redis.conf` file in the `conf` directory and change password.

Find the line containing `requirepass foobared`, delete `# ` and change `foobared` to the password do you want.

Example:
```
# The requirepass is not compatible with aclfile option and the ACL LOAD
# command, these will cause requirepass to be ignored.
#
requirepass ttlab
```

Then update variables in .env file
```
REDIS_HOST=pmf-redis
REDIS_PORT=6379
REDIS_PASSWORD={ttlab}
```


## Setup for mongodb
Get ip address of your host machine by `hostname -I` or `ifconfig`.
Example:
```
$ hostname -I
172.16.0.127 172.20.0.1 172.22.0.1 172.23.0.1 172.24.0.1 172.17.0.1 172.26.0.1 192.168.240.1
```

and the ip address is `172.16.0.127`.

After that, update the .env file:
```
DOCKER_ENV_HOST_IP={172.16.0.127}
DOCKER_ENV_MONGO_INITDB_ROOT_USERNAME="root"
DOCKER_ENV_MONGO_INITDB_ROOT_PASSWORD="{password}"
```

Create key file for mongoDB
```
mkdir -p mongo/keys
openssl rand -base64 756 > mongo/keys/mongoKeyFile.key
chmod 400 mongo/keys/mongoKeyFile.key
```

## Setup for pmf-backend
Copy 3dweb key file to ssh into the 3dwebviewer machine into ./keys folder.

Example:
```
$ mkdir keys
$ vi keys/3dweb
```
Type `i` (to insert) and then paste content of key file into and type `esc + w + q` to save the file.


Update the .env file
```
$ cp .env.example .env
```

Example the .env file:
```
# app
PORT=3000
VERSION=1.0.1

# timezone
TIMEZONE_DEFAULT={+09:00}
TIMEZONE_DEFAULT_NAME='{Asia/Tokyo}'

TZ=UTC

# API PREFIX URL
BASE_PATH=/api/v1

# log
LOG_LEVEL=debug
LOG_ROOT_FOLDER=./logs

# cors
CORS_WHITELIST="{https://3dwebviewer.pmf.skyeduca.com,http://3dwebviewer.pmf.tokyotechlab.com,http://172.16.0.163:8080}"

WEB_APP_BASE_URL={https://3dwebviewer.pmf.skyeduca.com}

# mongodb
MONGO_DATABSE_CONNECTION_STRING={mongodb://root:password@172.16.0.127:27017/pmf-3dwebviewer?authSource=admin&w=1&directConnection=true}
MONGO_DEBUG=disable
JWT_ACCESS_TOKEN_EXPIRED_IN={3600}
JWT_REFRESH_TOKEN_EXPIRED_IN={86400}
JWT_ACCESS_TOKEN_SECRET_KEY={key}
JWT_REFRESH_TOKEN_SECRET_KEY={key}

# ldap
LDAP_SERVER_URL='{ldap://13.215.189.14:389}'
LDAP_DIRECTORY_ROOT_DN='{dc=3dwebviewer,dc=pmf,dc=tokyotechlab,dc=com}'
LDAP_BASE_GROUPS_DN='{ou=groups,dc=3dwebviewer,dc=pmf,dc=tokyotechlab,dc=com}'
LDAP_BASE_USERS_DN='{ou=people,dc=3dwebviewer,dc=pmf,dc=tokyotechlab,dc=com}'
LDAP_USER_DISTINGUISH_ATTRIBUTE='uid'
LDAP_ADMIN_DN='{cn=admin,dc=3dwebviewer,dc=pmf,dc=tokyotechlab,dc=com}'
LDAP_ADMIN_PASSWORD='{password}'
LDAP_COUNTRY_CODE='fr'

#sendgrid
SENDGRID_API_KEY={SENDGRID_API_KEY}
SENDGRID_SENDER={hr@tokyotechlab.com}
SENDGRID_SUPPORT_REQUEST_ADMIN={nhidt@tokyotechlab.com}
SENDGRID_TEMPLATE_ID_CONTACT_USER={SENDGRID_TEMPLATE_ID_CONTACT_USER}
SENDGRID_TEMPLATE_ID_NEW_PASSWORD={SENDGRID_TEMPLATE_ID_NEW_PASSWORD}
SENDGRID_TEMPLATE_ID_NEW_PASSWORD_WITH_ACTIVATION_LINK={SENDGRID_TEMPLATE_ID_NEW_PASSWORD_WITH_ACTIVATION_LINK}
SENDGRID_TEMPLATE_ID_SEND_SUPPORT_REQUEST={SENDGRID_TEMPLATE_ID_SEND_SUPPORT_REQUEST}
SENDGRID_TEMPLATE_ID_RESET_PASSWORD={SENDGRID_TEMPLATE_ID_RESET_PASSWORD}
SENDGRID_TEMPLATE_ID_ACCOUNT_CREATED_INFORM={SENDGRID_TEMPLATE_ID_ACCOUNT_CREATED_INFORM}

#ftp
SFTP_HOST={172.16.0.127}
SFTP_PORT=2222
SFTP_USERNAME={ftpuser}
SFTP_PASSWORD={password}
SFTP_DEFAULT_PATH=/share
SFTP_TEMP_FOLDER=/usr/src/app/service-folder/temp_folder
SFTP_PROJECT_DEFAULT_PATH=/share/projects
SFTP_USERS_DEFAULT_PATH=/share/repertories
SFTP_TEMP_DOWNLOAD_FOLDER=/usr/src/app/service-folder/temp_download_folder
SFTP_INSTANCE_LOG_FOLDER_PATH=/share/logs/instance
SFTP_SERVER_LOG_FOLDER_PATH=/share/logs/server
SFTP_LICENSE_LOG_FOLDER_PATH=/share/logs/license

# 3dwebviewer
WEBVIEWER3D_BACKEND_WEBSOCKET_URL={ws://222.252.24.243:9999/ws}
WEBVIEWER3D_PASSPHRASE={MySecurePassphrase}
WEBVIEWER3D_MODEL_REPOSITORY={C:\pmf-3dwebviewer-custom\models\}
WEBVIEWER3D_MODEL_EXPORT_REPOSITORY={C:\pmf-3dwebviewer-custom\models\temp\}
WEBVIEWER3D_SCRIPT_REPOSITORY={C:\pmf-3dwebviewer-custom\scripts}

SSH_HOST={117.4.247.88}
SSH_PORT={14957}
SSH_USERNAME={ttlab}
SSH_PRIVATE_KEY_PATH='/usr/src/app/keys/3dweb'

THUMBNAIL_FOLDER=/usr/src/app/service-folder/uploads
BACKEND_API_URL={https://api.3dwebviewer.pmf.skyeduca.com/api/v1}


FILE_STORAGE_BASE_URL={https://api.3dwebviewer.pmf.skyeduca.com}
FILE_STORAGE_SUPPORT_REQUEST_PATH=upload-support-request
FILE_STORAGE_SUPPORT_REQUEST_FOLDER=/usr/src/app/service-folder/file_storage_support_request_folder
FILE_STORAGE_SUPPORT_REQUEST_CSV_FOLDER=/usr/src/app/service-folder/file_storage_support_request_csv_folder
FILE_STORAGE_SUPPORT_REQUEST_CSV_PATH=export-support-request
FILE_STORAGE_THUMBNAIL_PATH=thumbnail
FILE_STORAGE_DOWNLOAD_PATH=download
FILE_STORAGE_PLANNING_PATH=export-planning
FILE_STORAGE_PLANNING_FOLDER=/usr/src/app/service-folder/file_storage_planning_folder

CRON_JOB_DOWNLOAD_INSTANCE_LOG='0 1 * * *'
CRON_JOB_DOWNLOAD_SERVER_LOG='0 2 * * *'
CRON_JOB_DOWNLOAD_LICENSE_LOG='0 3 * * *'

#redis
REDIS_HOST=pmf-redis
REDIS_PORT=6379
REDIS_PASSWORD={ttlab}

DOCKER_ENV_HOST_IP={172.16.0.127}
DOCKER_ENV_MONGO_INITDB_ROOT_USERNAME="root"
DOCKER_ENV_MONGO_INITDB_ROOT_PASSWORD="{password}"
```

## Running the project by docker compose

Running by this commands:
```
docker compose up -d
```

Init data into database by seed data (provinces, users) into database.
```
docker exec -it pmf-api node dist/database/seeds/index.js
```

After sftp container is running, you need run this follows:
Connect to sftp server by username and password
```
sftp -P 2222 ftpuser@127.0.0.1
```

And run this commands:
```
cd share
mkdir projects
mkdir repertories
mkdir logs
cd logs
mkdir instance
mkdir server
mkdir license
```

SSH into 3dweb by pmf-api service.
```
docker exec -it pmf-api sh
ssh -i $SSH_PRIVATE_KEY_PATH $SSH_USERNAME@$SSH_HOST -p $SSH_PORT
```
then type `yes`
