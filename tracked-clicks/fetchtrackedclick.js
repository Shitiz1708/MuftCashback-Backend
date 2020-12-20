'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.set = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const subid = data['subid']
    const productid = data['productid']

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
            return {statusCode:200,body:JSON.stringify(tracked_clicks[i])}
        }
    }

    return {statusCode:404, body:JSON.stringify('Data Not Found')}
}