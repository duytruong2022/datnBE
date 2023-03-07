#!/bin/bash

MONGODB1=mongo1
HOST_IP="${DOCKER_ENV_HOST_IP}"     # Replace the HOST_IP address with your computer's IP address

MONGO_INITDB_ROOT_USERNAME="${DOCKER_ENV_MONGO_INITDB_ROOT_USERNAME:-root}"
MONGO_INITDB_ROOT_PASSWORD="${DOCKER_ENV_MONGO_INITDB_ROOT_PASSWORD:-password}"

if [ -e /data/db/.initiated ]
then
    INITIATE_MONGODB="0"
else
    INITIATE_MONGODB="1"
fi

echo "**********************************************" ${MONGODB1}
echo "Waiting for startup"

function initiateMongoDB () {
    echo SETUP.sh time now: `date +"%T" `
    sleep 5
    mkdir logs
    touch logs/mongo-log.log
    /usr/bin/mongod --port 27017 --bind_ip_all --replSet rs0 --journal --dbpath /data/db --keyFile /keys/mongoKeyFile.key --fork --logpath /logs/mongo-log.log

    mongosh <<EOF
    var cfg = {
        "_id": "rs0",
        "version": 1,
        "members": [
            {
                "_id": 0,
                "host": "${HOST_IP}:27017",
                "priority": 2
            },
            {
                "_id": 1,
                "host": "${HOST_IP}:27018",
                "priority": 0
            },
            {
                "_id": 2,
                "host": "${HOST_IP}:27019",
                "priority": 0
            }
        ]
    };
    rs.initiate(cfg);
EOF

    # wait to replica set initiate done, then create root user
    sleep 10
    echo "Create admin account"
    mongosh <<EOF
    use admin;
    rs.status();
    db.createUser({
        user: "${MONGO_INITDB_ROOT_USERNAME}",
        pwd: "${MONGO_INITDB_ROOT_PASSWORD}",
        roles: [ { role: "root", db: "admin" } ]
    });
EOF

    mongosh -u ${MONGO_INITDB_ROOT_USERNAME} -p ${MONGO_INITDB_ROOT_PASSWORD} <<EOF
    use admin;
    db.getUsers();
    db.shutdownServer({ force: true });
EOF

    touch /data/db/.initiated
    /usr/bin/mongod --port 27017 --bind_ip_all --replSet rs0 --journal --dbpath /data/db --keyFile /keys/mongoKeyFile.key
}

if [ $INITIATE_MONGODB == "0" ]
then
    echo "MongoDB initialized" $INITIATE_MONGODB
    /usr/bin/mongod --port 27017 --bind_ip_all --replSet rs0 --journal --dbpath /data/db --keyFile /keys/mongoKeyFile.key
else
    echo "MongoDB is initializing" $INITIATE_MONGODB
    initiateMongoDB
fi