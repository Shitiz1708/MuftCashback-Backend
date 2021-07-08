// This configures S3 bucket for every month
'use-strict'

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const getMonthYearDay = (date)=>{
    const [year,month,day]=date.split('-')
    return [year,month,day]
}

const getCompleteUsertable = async() =>{
    const params = {
        TableName:'Users'
    }
    try{
        var res = await dynamoDB.scan(params).promise()
        console.log(res);
        return res.Items;
    }catch(err){
        console.log(err);
        return err;
    }
}

module.exports.configure = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const date = data['date']
    console.log(date)
    const [year,month,day] = getMonthYearDay(date)
    const allUsers = await getCompleteUsertable()
    for(var i=0;i<allUsers.length;i++){

        var params={
            Bucket:'muftcashback-reports-flipkart',
            Key:year.toString()+'/'+month.toString()+'/'+allUsers[i]['SubId'].toString()+'/tentative/'
        }
        var params1={
            Bucket:'muftcashback-reports-flipkart',
            Key:year.toString()+'/'+month.toString()+'/'+allUsers[i]['SubId'].toString()+'/approved/'
        }

        try{
            var res = await s3.putObject(params).promise();
            var res1 = await s3.putObject(params1).promise();
            console.log(res)
            console.log(res1)
        }catch(err){
            console.log(err)
            return err
        }

        
    }
    return { statusCode:200 , body:"Successful" }

}