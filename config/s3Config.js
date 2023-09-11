var AWS = require('aws-sdk');
var dotenv = require("dotenv");
dotenv.config();

// Create an S3 instance using your AWS credentials
var s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
    signatureVersion: 'v4'
  });

module.exports = s3
