'use-strict'

const AWS = require('aws-sdk')
const s3 = new AWS.S3({apiVersion: '2006-03-01'})

module.exports.test = async(event,context,callback) =>{
    var data={ABC:'blah blah blah'}
    var params={
        Body=JSON.stringify(data),
        Bucket='muftcashback-reports',
        Key='2021/May/708c750b-69c9-4ae8-b1fd-f4e110a4c92/test.json',
    }

    try{
        var res=await s3.putObject(params).promise();
        console.log(res)
    }catch(err){
        console.log(err)
        return err
    }


    return {statusCode:200,body:res}
}