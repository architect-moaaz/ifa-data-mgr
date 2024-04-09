const configData = require("./config");

function checkNodeEnv() {
  var env = process.env.NODE_ENV || "development";
  var config = null;
  if (env.trim() == "development") {
    console.log("Started with Local Config");
    config = configData.config.development;
  } else if (env.trim() == "production") {
    console.log("Started with Dev Config");
    config = configData.config.production;
  } else if (env.trim() == "colo") {
    console.log("Started with Colo Config");
    config = configData.config.colo;
  } else {
    console.log("Started with UAT Config");
    config = configData.config.uat;
  }
  return config;
}
module.exports = checkNodeEnv;
