console.log("We will , we will rock you");

var dataStore = require("./db/operations")

/****************************************************************
 * Events 
****************************************************************/

var registerEvent = function (event, kClient) {

    dataStore.registerEvent(event).finally(() => {
        kClient.resume();
    });
};

/****************************************************************
 * Kafka Events Processing
****************************************************************/

const processEventConsumer = require("./service/kafka/EventConsumer");

processEventConsumer(registerEvent).catch((err) => {
    console.error("error in consumer: ", err)
});

