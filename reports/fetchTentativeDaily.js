// This fetches all the tentative tracked and update to db
'use-strict'

const AWS = require('aws-sdk')
const axios = require('axios')
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

const getMonthYearDay = (date)=>{
    const [year,month,day]=date.split('-')
    return [year,month,date]
}



const getAllDataSorted = async(startDate,endDate,status) =>{
    const url = 'https://affiliate-api.flipkart.net/affiliate/report/orders/detail/json?startDate='+startDate+'&endDate='+endDate+'&status='+status+'&offset=0'
    const config = {
        headers:{
            'Fk-Affiliate-Id':'bansalsid',
            'Fk-Affiliate-Token':'5b2d0f8b85aa4356b472249ebee11a63'
        }
    }
    var fullData = []
    var counter = 1
    try{
        var response = await axios.get(url,config)
        console.log(counter + ' attempt')
        console.log(response['data']['next'])
        Array.prototype.push.apply(fullData,response['data']['orderList']); 
        while(response['data']['next']!=''){
            try{
                response = await axios.get(response['data']['next'],config)
                counter+=1
                console.log(counter+' attempt')
                console.log(response['data']['next'])
                Array.prototype.push.apply(fullData,response['data']['orderList']); 
            }catch(err){
                console.log(err)
                return err
            }
        }
        const sorted = await sortAllDataAccToSubId(fullData)
        return sorted
    }catch(err){
        console.log(err)
        return err
    }
}

const clearUnnecessaryDetails = (data) =>{
    const product = {
        affiliateOrderItemId:data.affiliateOrderItemId,
        title: data.title,
        category: data.category,
        quantity: data.quantity,
        status: data.status,
        orderDate: data.orderDate,
        amount: data.sales.amount,
        tentativeCommission: data.tentativeCommission.amount * 0.7
    }
    return product
}

const getAllUsersSubId = async() =>{
    const params = {
        TableName:'Users'
    }
    try{
        var res = await dynamoDB.scan(params).promise()
        console.log(res);
    }catch(err){
        console.log(err);
        return err;
    }
    var subIds = new Array();
    for(var i=0;i<res.Items.length;i++){
        subIds.push(res.Items[i]['SubId'])
    }
    return subIds

}

const sortAllDataAccToSubId = async(data) =>{
    const allSubIds = await getAllUsersSubId()
    var sortedData = new Object
    for(var i=0;i<data.length;i++){
        const entry = data[i]
        var clearedData = clearUnnecessaryDetails(entry)
        if(allSubIds.includes(entry['affExtParam1'])==true){
            if(sortedData.hasOwnProperty(entry['affExtParam1'])){
                sortedData[entry['affExtParam1']].push(clearedData)
            }else{
                sortedData[entry['affExtParam1']]=new Array()
                sortedData[entry['affExtParam1']].push(clearedData)
            }
        }
    }
    console.log(sortedData)
    return sortedData
}

const updateDataToS3 = async(data,date,status) =>{
    const [year,month,day] = getMonthYearDay(date)
    for (var user in data){
        var allproducts=data[user]
        var amount = 0
        for(var entry in allproducts){
            amount+=allproducts[entry]['tentativeCommission']
        }
        console.log(user,date,amount)

        //Updating data to S3
        var params={
            Body:JSON.stringify(allproducts),
            Bucket:'muftcashback-reports-flipkart',
            Key:year.toString()+'/'+month.toString()+'/'+user.toString()+'/'+'tentative'+'/'+day.toString()+'/'+date.toString()+'.json'
        }
        try{
            var res=await s3.putObject(params).promise();
            console.log(res)
        }catch(err){
            console.log(err)
            return err
        }

        //Updating data to dynamo db
        const params1 = {
            TableName:'Users',
            Key:{
                SubId:user
            },
            UpdateExpression:"Set TentativeAmount=TentativeAmount+:amount",
            ExpressionAttributeValues:{
                ":amount":amount
            },
            ReturnValues: "UPDATED_NEW"
        }

        try{
            var res1 = await dynamoDB.update(params1).promise();
            console.log(res1)
        }catch(err){
            console.log(err)
            return err
        }
    
    }



}

const updateDataToDb = async(data,date) =>{
    
    for(var user in data){
        if(user=="708c750b-69c9-4ae8-b1fd-f4e110a4c923"){
            var allproducts = data[user]
            var amount = 0
            for(var entry in allproducts){
                amount+=allproducts[entry]['tentativeCommission']
            }
            console.log(user,date,amount)
            // await checkIfPrefixExists('708c750b-69c9-4ae8-b1fd-f4e110a4c92')
            
            // const params = {
            //     TableName:'TrackedClicks',
            //     Key:{
            //         SubId:user
            //     },
            //     UpdateExpression:"SET Tentative.#date=list_append(if_not_exists(Tentative.#date,:emptylist),:products)",
            //     ExpressionAttributeValues:{
            //         ":emptylist":[],
            //         ":products":allproducts
            //     },
            //     ExpressionAttributeNames:{
            //         "#date":date
            //     },
            //     ReturnValues: "UPDATED_NEW"
            // }
            // try{
            //     var res = await s3.listBuckets().promise()
            //     console.log(res)
            // }catch(err){
            //     console.log(err)
            //     return err
            // }

            // const params1 = {
            //     TableName:'Users',
            //     Key:{
            //         SubId:user
            //     },
            //     UpdateExpression:"Set TentativeAmount=TentativeAmount+:amount",
            //     ExpressionAttributeValues:{
            //         ":amount":amount
            //     },
            //     ReturnValues: "UPDATED_NEW"
            // }

            // try{
            //     // var res = await dynamoDB.update(params).promise();
            //     var res1 = await dynamoDB.update(params1).promise();
            //     console.log(res1)
            // }catch(err){
            //     console.log(err)
            //     return err
            // }
        }
    }
}


module.exports.fetch = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    // const date = data['date']
    const date='2021-05-01'
    console.log(date)
    const status = 'approved'
    const allData = await getAllDataSorted(date,date,status)
    await updateDataToS3(allData,date,status)

    return { statusCode:200 , body:"Successful" }
}