// import the `Kafka` instance from the kafkajs library
const { Kafka } = require("kafkajs")

// the client ID lets kafka know who's producing the messages
const clientId = "ifa-data-mgr-4"
// we can define the list of brokers in the cluster
const checkNodeEnv = require("../../configService");

var config = checkNodeEnv();
const {
    kafka: { host, port },
} = config;
const brokers = [host + ":" + port];
// this is the topic to which we want to write messages
const topic = "kogito-processinstances-events"

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers })

const consumer = kafka.consumer({ groupId: clientId })


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const consume = async (callback) => {
    //counter to track the message received
    var count = 0;
    // first, we wait for the client to connect and subscribe to the given topic
    await consumer.connect()
    await consumer.subscribe({ topics: ["kogito-processinstances-events", "kogito-usertaskinstances-events", "kogito-variables-events", "ifa-logs"] })
    await consumer.run({
        // this function is called every time the consumer gets a new message
        eachMessage: async ({ message }) => {

            await sleep(1000);
            consumer.pause();
            console.log(`received message[${count}]: ${message.value}`)
            if (callback) {

                await callback(JSON.parse(message.value), consumer);

            } else {
                consumer.resume();
            }

            count = count + 1;
        },
    })
}

module.exports = consume;