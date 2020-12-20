'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.add = async(event,context,callback) =>{
    const data = JSON.parse(event.body);
    const productid = data['productid']
    const subid = data['subid']
    const amount = data['amount']*0.65
    const status = data['status']
    const order_date = data['date']
    const merchant = data['merchant']
    const dateObj = new Date(Date.parse(order_date)+1000 * 60 * 60 * 24 * 90)
    const expected_date = dateObj.toLocaleString('default', { month: 'long' }) + " " + (dateObj.getDate())+", "+dateObj.getFullYear()

    const tracked_click = {
        ProductId:productid,
        Amount:amount,
        Date:order_date,
        ExpectDate:expected_date,
        Merchant: merchant,
        Status:"Pending"
    }

    const params = {
        TableName:'TrackedClicks',
        Key:{
            SubId:subid
        },
        UpdateExpression:"Set Tracked = list_append(if_not_exists(Tracked,:emptylist),:click)",
        ExpressionAttributeValues:{
            ":emptylist":[],
            ":click":[tracked_click]
        },
        ReturnValues: "UPDATED_NEW"
    }

    try{
        var res = await dynamoDB.update(params).promise();
        console.log(res)
    }catch(err){
        console.log(err)
        return err
    }

    return { statusCode: 200,body:JSON.stringify(res) }

}