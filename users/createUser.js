'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

module.exports.create = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const name = data['name']
    const email = data['email']
    const userSub = data['userSub']
    const phone = data['phone']
    const profilepic = data['profile']

    const params = {
        TableName:'Users',
        Item:{
            Name:name,
            Email:email,
            ConfirmedAmount:0,
            PAN:'',
            Payments:[],
            PhoneNum:phone,
            Picture:profilepic,
            SubId:userSub,
            TentativeAmount:0
        }
    };

    try{
        const response = await dynamoDB.put(params).promise();
        console.log(response)
    }catch(err){
        console.log(err)
        return err;
    }

    return { statusCode:200,body:JSON.stringify(params.Item)}
}