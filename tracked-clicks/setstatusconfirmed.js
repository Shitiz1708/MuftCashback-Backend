'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.set = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const subid = data['subid']
    const productid = data['productid']
    const amount = data['amount']*0.65

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

    for(var i=0;i<tracked_clicks.length;i++){
        if(tracked_clicks[i]['ProductId']==productid){
            tracked_clicks[i]['Status'] = "Confirmed"
        }
    }

    const params2 = {
        TableName:'TrackedClicks',
        Key:{
            SubId:subid
        },
        UpdateExpression:"Set Tracked=:updated_list",
        ExpressionAttributeValues:{
            ':updated_list':tracked_clicks
        }
    }

    const params3 = {
        TableName:'Users',
        Key:{
            SubId:subid
        },
        UpdateExpression:"Set ConfirmedAmount=ConfirmedAmount+:amount,TentativeAmount=TentativeAmount-:amount",
        ExpressionAttributeValues:{
            ":amount":amount
        },
        ReturnValues: "UPDATED_NEW"
    }

    try{
        var res2 = await dynamoDB.update(params2).promise();
        var res3 = await dynamoDB.update(params3).promise();
        console.log(res2);
    }catch(err){
        console.log(err);
        return err;
    }

    return { statusCode: 200,body:JSON.stringify(res2) }
}