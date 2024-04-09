const odata = require('odata-client');

module.exports.submit = async function (workspace, app, resource, data) {

    const config = require('../config');
    const url = config.getUrl(workspace, app);
    console.log(url);
    try {

        var q = odata({ service: url, resources: resource });
        var result = await q.post(
            data
        );
        console.log(result);

    } catch (e) {
        console.log("Error occured");
    }
};