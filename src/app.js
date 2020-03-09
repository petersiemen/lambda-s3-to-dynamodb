const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    console.info("EVENT\n" + JSON.stringify(event, null, 2));
    event.Records.forEach(function (record) {
        //Build the S3 Params string.  Watch out here because we're assuming only 1 record per trigger
        let s3Params = {
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key
        };

        //Build the dynamoDB connect string using environment variable
        let dynParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Item: {}
        };


        console.info("s3Params\n" + JSON.stringify(s3Params, null, 2));
        console.info("dynParams\n" + JSON.stringify(dynParams, null, 2));


        s3.getObject(s3Params, function (err, data) {
            if (err) {
                console.error("ERROR\n" + JSON.stringify(err, null, 2));
                callback(err);
            } else {
                let dynamoData = data.Body.toString().split('|');

                dynamoData.pop(); //get rid of the last entry of the array because its empty
                console.info("dynamoData\n" + dynamoData);
                dynamoData.forEach(function (row) {
                    dynParams.Item = JSON.parse(row);
                    docClient.put(dynParams, function (err, data) {
                        if (err) {
                            console.error("ERROR\n" + JSON.stringify(err, null, 2));
                            callback(err);
                        } else callback(null, data);
                    });

                });
            }
        });
    });
};