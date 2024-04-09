const MongoClient = require("mongodb").MongoClient;
const mongoose = require("mongoose");
const axios = require("axios");
const { Client, auth } = require("cassandra-driver");

const checkNodeEnv = require("../configService");

var config = checkNodeEnv();

const {
  cassandra: {
    cassandraContactPoint,
    cassandraDataCentre,
    cassandraKeySpace,
    cassandraUserName,
    cassandraPassword,
  },
} = config;

const {
  firebase: { serverKey, firebaseApi },
} = config;

const {
  mongodb: { url, name },
} = config;

//const connectionString = `mongodb://uatadmin:hau2Opeef7Hoos8eeNgo@151.106.39.195:32030`;
const connectionString = `mongodb://` + url;

console.log("connected to the DB: " + connectionString);

mongoose.connect(connectionString, { useNewUrlParser: true });

async function createOrUpdateProcessEvent(client, processEvent) {
  const result = await client
    .db(name)
    .collection("processEvents")
    .insertOne(processEvent);

  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );

  var query = { id: processEvent.kogitoprocinstanceid };
  var valueExists = await client
    .db(name)
    .collection("processes")
    .findOne(query);

  var _processEvent = JSON.parse(JSON.stringify(processEvent));

  delete _processEvent["data"]["nodeInstances"];

  if (valueExists) {
    var info_query = {
      id: processEvent.kogitoprocinstanceid,
      "information.id": _processEvent.data.id,
    };
    var infoExists = await client
      .db(name)
      .collection("processes")
      .findOne(info_query);
    if (infoExists) {
      const query = {
        id: processEvent.kogitoprocinstanceid,
        "information.id": _processEvent.data.id,
      };
      var update = { $set: { information: _processEvent.data } };
      const options = { upsert: true };

      const update_result = await client
        .db(name)
        .collection("processes")
        .updateOne(query, update, options);
    } else {
      var update_result = await client
        .db(name)
        .collection("processes")
        .updateOne(
          { id: _processEvent.kogitoprocinstanceid },
          { $set: { information: _processEvent.data } }
        );
    }

    console.log("Updated Process Task");
  } else {
    var _document = {
      id: _processEvent.kogitoprocinstanceid,
      information: _processEvent.data,
    };

    const query = { id: _processEvent.kogitoprocinstanceid };
    const update = { $set: _document };
    const options = { upsert: true };

    const update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(query, update, options);

    console.log("Added New Human Task");
  }
}

//TODO : clean up document creation
async function createOrUpdateStages(client, processEvent) {
  const document = await client
    .db(name)
    .collection("processes")
    .findOne({ id: processEvent.kogitoprocinstanceid });

  var _document = {};
  console.log("***********************************************");
  console.log(document && document.stages);

  console.log("***********************************************");
  if (document && document.stages) {
    _document = document;
    let _stages = processEvent.data.nodeInstances;
    // let stages = _stages.concat(document.stages);

    var _new_events = [];
    var _process_details = {};
    for (var index in _stages) {
      var stage = _stages[index];

      if (stage.nodeType == "EndNode") {
        _process_details["processEndDate"] = stage.leaveTime;
      }
      if (stage.nodeType == "StartNode") {
        _process_details["processStartDate"] = stage.triggerTime;
      }

      var query = {
        id: processEvent.kogitoprocinstanceid,
        "stages.id": stage.id,
      };

      var valueExists = await client
        .db(name)
        .collection("processes")
        .findOne(query);
      //if process exists update else insert
      if (valueExists) {
        var update = { $set: { "stages.$": stage } };
        var options = { upsert: true };

        var update_result = await client
          .db(name)
          .collection("processes")
          .updateOne(query, update, options);
        console.log("Updated existing result");
      } else {
        _new_events.push(stage);
      }
    }
    console.log("new events to be added " + _new_events.length);
    if (_new_events.length > 0) {
      var update_result = await client
        .db(name)
        .collection("processes")
        .updateOne(
          { id: processEvent.kogitoprocinstanceid },
          { $push: { stages: { $each: _new_events, $sort: { nodeId: 1 } } } },
          { upsert: true }
        );

      console.log("Added New Result");
    }
  } else {
    _document["id"] = processEvent.kogitoprocinstanceid;
    _document["stages"] = processEvent.data.nodeInstances;

    const query = { id: processEvent.kogitoprocinstanceid };
    const update = { $set: _document };
    const options = { upsert: true };

    const update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(query, update, options);
  }
}

async function createUserTaskEvent(client, processEvent) {
  const result = await client
    .db(name)
    .collection("usertaskEvents")
    .insertOne(processEvent);
  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );

  var query = {
    id: processEvent.kogitoprocinstanceid,
    "userTasks.id": processEvent.kogitousertaskiid,
  };
  var valueExists = await client
    .db(name)
    .collection("processes")
    .findOne(query);
  if (valueExists) {
    const query = {
      id: processEvent.kogitoprocinstanceid,
      "userTasks.id": processEvent.kogitousertaskiid,
    };
    var update = { $set: { "userTasks.$": processEvent.data } };
    const options = { upsert: true };

    const update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(query, update, options);

    console.log("Updated Human Task");
  } else {
    var update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(
        { id: processEvent.kogitoprocinstanceid },
        { $push: { userTasks: processEvent.data } },
        { upsert: true }
      );

    console.log("Added New Human Task");
  }
}

async function createVariableEvent(client, processEvent) {
  const result = await client
    .db(name)
    .collection("variableEvents")
    .insertOne(processEvent);
  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );

  var query = {
    id: processEvent.kogitoprocinstanceid,
    "variable.name": processEvent.data.variableName,
    "variable.processId": processEvent.data.processId,
  };
  var valueExists = await client
    .db(name)
    .collection("processes")
    .findOne(query);
  if (valueExists) {
    const query = {
      id: processEvent.kogitoprocinstanceid,
      "variable.name": processEvent.data.variableName,
      "variable.processId": processEvent.data.processId,
    };
    var update = { $set: { "variables.$": processEvent.data } };
    const options = { upsert: true };

    const update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(query, update, options);

    console.log("Updated Variable Task");
  } else {
    var update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(
        { id: processEvent.kogitoprocinstanceid },
        { $push: { variables: processEvent.data } },
        { upsert: true }
      );

    console.log("Added New Variable Task");
  }
}

// async function createVariableEvent(client, processEvent) {
//     const result = await client.db("k1").collection("initiationEvents").insertOne(processEvent);
//     console.log(`New listing created with the following id: ${result.insertedId}`);

// }

async function createAppEvent(client, processEvent) {
  const result = await client
    .db(name)
    .collection("initiationEvents")
    .insertOne(processEvent);
  console.log(
    `New listing created with the following id: ${result.insertedId}`
  );

  var query = { id: processEvent.processId };
  var documentExists = await client
    .db(name)
    .collection("processes")
    .findOne(query);
  if (documentExists) {
    var information = {
      processId: processEvent.processId,
      workspace: processEvent.workspace,
      app: processEvent.app,
      initiatedBy: processEvent.initiatedBy,
      appDisplayName: processEvent.appDisplayName,
    };

    const query = { id: processEvent.processId };
    var update = { $set: information };
    const options = { upsert: true };

    const update_result = await client
      .db(name)
      .collection("processes")
      .updateOne(query, update, options);

    console.log("Updated Process Task");
  } else {
    var information = {
      id: processEvent.processId,
      workspace: processEvent.workspace,
      app: processEvent.app,
      initiatedBy: processEvent.initiatedBy,
      appDisplayName: processEvent.appDisplayName,
    };

    const insert_result = await client
      .db(name)
      .collection("processes")
      .insertOne(information);

    console.log("Added New document Task");
  }
}

async function registerNotification(client, event) {
  var notification = {};

  if (event.type == "ProcessInstanceEvent") {
    notification["processId"] = event.kogitoprocinstanceid;
    notification["process"] = event.kogitoprocid;
    notification["stage"] = event.data.nodeInstances[0].nodeName;
    notification["time"] = new Date().toISOString();
    notification["type"] = "PROCESS";
  }
  if (event.type == "UserTaskInstanceEvent") {
    notification["processId"] = event.kogitoprocinstanceid;
    notification["process"] = event.kogitoprocid;
    notification["stage"] = event.data.referenceName;
    notification["time"] = new Date().toISOString();
    notification["type"] = "USERTASK";
    notification["state"] = event.kogitousertaskist;
  }

  const updatedDocument = await client
    .db(name)
    .collection("processes")
    .findOneAndUpdate(
      { id: event.kogitoprocinstanceid },
      {
        $push: {
          notifications: {
            $each: [notification],
            $position: 0,
          },
        },
      },
      { returnOriginal: false }
    );
  const update_result = await client
    .db(name)
    .collection("notifications")
    .insertOne(notification);

  console.log("Notifcation called");

  const obj = {
    process: updatedDocument.value,
    notification: update_result,
  };
  return obj;
}

async function createDatabaseEntry(client, _processEvent) {
  console.log("************Modelling Event************");
  console.log(_processEvent);

  if (typeof _processEvent.data.variableValue === "object") {
    // console.log("Process Variable is an object");
    // let collection = "io.intelliflow.DataSet";

    // var data = _processEvent.data.variableValue;
    // data["@id"] = _processEvent.kogitoprocinstanceid;

    // const query = { "@id": _processEvent.kogitoprocinstanceid };
    // var update = { $set: data }
    // const options = { upsert: true };

    // const update_result = await client.db("k1").collection(collection).updateOne(query, update, options);

    await modellingService.createDataEntry(client, _processEvent);
  }
}

async function sendPushNotification(client, event, processUpdated, device) {
  if (event.kogitousertaskist === "Ready") {
    const workspace = processUpdated.workspace;
    const app = processUpdated.app;
    const appDisplayName = processUpdated.appDisplayName;
    console.log(
      "Potential users: " +
        event.data.potentialUsers +
        " workspace: " +
        workspace
    );
    const userList = event.data.potentialUsers;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverKey}`,
    };
    let body = {
      processId: event.kogitoprocinstanceid,
      process: event.kogitoprocid,
      stage: event.data.referenceName,
      time: new Date().toISOString(),
      type: "USERTASK",
      state: event.kogitousertaskist,
      app: app,
      appDisplayName: appDisplayName,
      workspace: workspace,
      device: device,
    };
    let query = { workspace: workspace, user: { $in: userList } };
    const cursor = client
      .db("notification")
      .collection("deviceInfo")
      .find(query);
    const tokens = await cursor.toArray();
    const usernameToToken = {};
    for (const token of tokens) {
      let tokenData = {};
      tokenData["token"] = token.token;
      tokenData["device"] = token.device;
      usernameToToken[token.user] = tokenData;
    }
    for (const username in usernameToToken) {
      const tokenData = usernameToToken[username];
      const token = tokenData["token"];
      let messageBody;
      let tokenDevice;
      if (tokenData["device"] === "ANDROID" || tokenData["device"] === "IOS") {
        tokenDevice = "MOBILE";
      } else {
        tokenDevice = "DESKTOP";
      }
      if (tokenDevice === device || device === "BOTH") {
        messageBody = `User action required for the app ${appDisplayName}, Please click here to complete it.`;
      } else if (tokenDevice === "DESKTOP") {
        messageBody = `User action required for the app ${appDisplayName}, The app is deployed on mobile device, Please log into a mobile device and complete the task.`;
      } else {
        messageBody = `User action required for the app ${appDisplayName}, The app is deployed on desktop device, Please log into a desktop device and complete the task.`;
      }
      const message = {
        to: token,
        notification: {
          body: messageBody,
          title: "Action required",
          subtitle: "User action required",
        },
        data: body,
      };

      axios
        .post(firebaseApi, message, { headers })
        .then(async (response) => {
          await updateNotificationHistory(response.data, workspace, username);
          console.log("FCM message sent successfully: ", response.data);
        })
        .catch(async (error) => {
          await updateNotificationHistory(
            error.response.data,
            workspace,
            username
          );
          console.error("Error sending FCM message: ", error.response.data);
        });
    }
  }
}

async function updateNotificationHistory(data, workspace, user) {
  const client = new MongoClient(connectionString);
  let obj = {
    workspace: workspace,
    user: user,
    response: data,
  };
  try {
    await client.connect();
    const result = await client
      .db("notification")
      .collection("notificationhistory")
      .insertOne(obj);

    console.log("Notification history inserted: " + result.insertedId);
  } finally {
    await client.close();
  }
}

let client;
async function checkMobileApp(workspace, appname) {
  try {
    if (!workspace || !appname) {
      return "";
    }
    client = new Client({
      contactPoints: [cassandraContactPoint],
      localDataCenter: cassandraDataCentre,
      credentials: { username: cassandraUserName, password: cassandraPassword },
    });
    await client.connect();
    console.log("Connected to Cassandra");
    const query = `SELECT devicesupport from ${cassandraKeySpace}.apps_by_name where workspacename = '${workspace}' and appname = '${appname}'`;
    console.log(`The query to check device: ${query}`);
    const result = await client.execute(query);
    const rows = result.rows;
    if (rows.length > 0) {
      const devicesupport = rows[0].devicesupport;
      console.log("devicesupport:", devicesupport);
      if (devicesupport === "M") {
        return "MOBILE";
      } else if (devicesupport === "D") {
        return "DESKTOP";
      } else {
        return "BOTH";
      }
    } else {
      return "";
    }
  } catch (err) {
    console.error("Error connecting to Cassandra or executing query", err);
    return "";
  } finally {
    if (client) {
      await client.shutdown();
    }
  }
}

//Event Handler function
module.exports.registerEvent = async function (event) {
  const client = new MongoClient(connectionString);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    if (event.type == "ProcessInstanceEvent") {
      await createOrUpdateProcessEvent(client, event);
      await createOrUpdateStages(client, event);
      await registerNotification(client, event);
    }

    if (event.type == "UserTaskInstanceEvent") {
      await createUserTaskEvent(client, event);
      let obj = await registerNotification(client, event);
      const mobileDesktop = await checkMobileApp(
        obj.process.workspace,
        obj.process.app
      );
      if (mobileDesktop.length > 0) {
        await sendPushNotification(client, event, obj.process, mobileDesktop);
      }
    }

    if (event.type == "VariableInstanceEvent") {
      await createVariableEvent(client, event);
      await createDatabaseEntry(client, event); //refers odata client as odata knows what are variables to persist
    }

    if (event.type == "ActionInstanceEvent") {
      await createAppEvent(client, event);
    }

    //add InitiationInstanceEvent it will come from app topic : ifa-initiationinstanceevent-topic
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

//main().catch(console.error);
