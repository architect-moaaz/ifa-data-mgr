require("dotenv").config();
var config = {
  development: {
    mongodb: {
      url: "root:root@localhost:27017/admin",
      name: "k1",
    },
    kafka: {
      host: "localhost",
      port: "9092",
    },
  },
  production: {
    mongodb: {
      url:
        process.env.DEV_MONGO_USERNAME +
        ":" +
        process.env.DEV_MONGO_PASSWORD +
        "@" +
        process.env.DEV_MONGO_HOST +
        ":" +
        process.env.DEV_MONGO_PORT,
      name: process.env.DEV_MONGO_NAME,
    },
    kafka: {
      host: process.env.DEV_KAFKA_URL,
      port: process.env.DEV_KAFKA_PORT,
    },
    cassandra: {
      cassandraContactPoint: process.env.DEV_CASSANDRA_CONTACT_POINT,
      cassandraDataCentre: process.env.DEV_CASSANDRA_DATA_CENTRE,
      cassandraKeySpace: process.env.DEV_CASSANDRA_KEY_SPACE,
      cassandraUserName: process.env.DEV_CASSANDRA_USERNAME,
      cassandraPassword: process.env.DEV_CASSANDRA_PASSWORD,
    },
    firebase: {
      serverKey: process.env.DEV_FIREBASE_SERVER_KEY,
      firebaseApi: process.env.DEV_FIREBASE_API,
    },
  },
  colo: {
    mongodb: {
      url:
        process.env.COLO_MONGO_USERNAME +
        ":" +
        process.env.COLO_MONGO_PASSWORD +
        "@" +
        process.env.COLO_MONGO_HOST +
        ":" +
        process.env.COLO_MONGO_PORT,
      name: process.env.COLO_MONGO_NAME,
    },
    kafka: {
      host: process.env.COLO_KAFKA_URL,
      port: process.env.COLO_KAFKA_PORT,
    },
    cassandra: {
      cassandraContactPoint: process.env.COLO_CASSANDRA_CONTACT_POINT,
      cassandraDataCentre: process.env.COLO_CASSANDRA_DATA_CENTRE,
      cassandraKeySpace: process.env.COLO_CASSANDRA_KEY_SPACE,
      cassandraUserName: process.env.COLO_CASSANDRA_USERNAME,
      cassandraPassword: process.env.COLO_CASSANDRA_PASSWORD,
    },
    firebase: {
      serverKey: process.env.COLO_FIREBASE_SERVER_KEY,
      firebaseApi: process.env.COLO_FIREBASE_API,
    },
  },
  uat: {
    mongodb: {
      url: "app_user:Intelliflow$123@151.106.39.195:27017?authSource=admin&retryWrites=true&w=majority",
      name: "k1",
    },
    kafka: {
      host: "151.106.39.195",
      port: "9092",
    },
  },
};

const url = "http://localhost:3010/query/";

module.exports = {
  config,
  url,
  getUrl: (workspace, app) => {
    return `${url}?workspace=${workspace}&app=${app}`;
  },
};
