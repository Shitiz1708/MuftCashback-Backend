'use strict';

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.hello = async (event,context,callback) => {
  const data = JSON.parse(event.body)
  const params = {
    TableName:'Users'
  }

  try{
    var res = await dynamoDB.scan(params).promise();
    console.log(res);
  }catch(err){
    console.log(err);
    return err;
  }
  
  return { statusCode: 200, body: JSON.stringify(res.Items) };
};
