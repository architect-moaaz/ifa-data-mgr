const MongoClient = require("mongodb").MongoClient;
const mongoose = require("mongoose");

const checkNodeEnv = require("../configService");

var config = checkNodeEnv();

const {
    mongodb: { url, name },
} = config;

//const connectionString = `mongodb://uatadmin:hau2Opeef7Hoos8eeNgo@151.106.39.195:32030`;
const connectionString = `mongodb://` + url;

console.log("connected to the DB: " + connectionString);

mongoose.connect(connectionString, { useNewUrlParser: true })

module.exports.createDataEntry = async function (client, event) {

    console.log("*** Modelling Service called");
    const document = await client.db(name).collection("processes").findOne({ id: event.kogitoprocinstanceid });

    console.log(document);
    //check if process document is available , in order to retrieve workspace and app name
    if (document) {

        var workspace = document.workspace;
        var app = document.app;

        var resource = event.data.variableName;
        var data = event.data.variableValue;

        var query = { "mapping.variableName": resource };


        //const variable_mapping_lookup = await client.db("k1").collection("variable_mapping").findOne(query);

        console.log("query :: " + query);

        const result = await client.db(name).collection("variable_mapping").aggregate([{ $unwind: "$mapping" }])
            .match(query)
            .project({ "mapping": 1 })
            .sort({ _id: -1 })
            .limit(100).toArray();

        if (result && result[0] && result[0].mapping) {

            const query = data;
            var update = { $set: data }
            const options = { upsert: true };
            var collection = result[0].mapping.modelName;

            const update_result = await client.db(name).collection(collection).updateOne(query, update, options);

            console.log("collection updated " + collection);
            console.log(JSON.stringify(update_result));
        }

        console.log(JSON.stringify(result));

    }

    //_odata.submit(workspace, app, resource, data);
};
