'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.fetch = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const subid = data['subid']

    const params1 = {
        TableName:'TrackedClicks',
        Key:{
            SubId:subid
        },
        ProjectionExpression:"Tracked"
    }

    try{
        var res1 = await dynamoDB.get(params1).promise();
        var tracked_clicks = res1['Item']['Tracked']
        console.log(res1)
    }catch(err){
        console.log(err)
        return err;
    }

    return { statusCode:200, body:JSON.stringify(tracked_clicks) }
}