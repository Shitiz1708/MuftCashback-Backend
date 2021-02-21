// This fetches all the tentative tracked and update to db
'use-strict'

const AWS = require('aws-sdk')
const axios = require('axios')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

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

const sortAllDataAccToSubId = async(data) =>{
    var sortedData = new Object
    for(var i=0;i<data.length;i++){
        const entry = data[i]
        var clearedData = clearUnnecessaryDetails(entry)
        if(sortedData.hasOwnProperty(entry['affExtParam1'])){
            sortedData[entry['affExtParam1']].push(clearedData)
        }else{
            sortedData[entry['affExtParam1']]=new Array()
            sortedData[entry['affExtParam1']].push(clearedData)
        }
    }
    console.log(sortedData)
    return sortedData
}

const updateDataToDb = async(data) =>{
    

    for (var key in data){
        var products=data[key]
        console.log(key)
        var tentativeamount = 0
        for(var entry in data[key]){
            tentativeamount+=data[key]['tentativeCommission']
        }

        const params = {
            TableName:'TrackedClicks',
            Key:{
                SubId:key
            },
            UpdateExpression:"SET Tentative=list_append(if_not_exists(Tentative,:emptylist),:products)",
            ExpressionAttributeValues:{
                ":emptylist":[],
                ":products":products
            },
            ReturnValues: "UPDATED_NEW"
        }

        const params1 = {
            TableName:'Users',
            Key:{
                SubId:key
            },
            UpdateExpression:"Set TentativeAmount=TentativeAmount+:amount",
            ExpressionAttributeValues:{
                ":amount":tentativeamount
            },
            ReturnValues: "UPDATED_NEW"
        }

        try{
            var res = await dynamoDB.update(params).promise();
            var res1 = await dynamoDB.update(params1).promise();
            console.log(res)
        }catch(err){
            console.log(err)
            return err
        }
    }

}

module.exports.fetch = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const date = formatDate(new Date())
    const status = 'tentative'
    const allData = await getAllDataSorted(date,date,status)
    await updateDataToDb(allData)

    return { statusCode:200 , body:"SUCCESSFULLY UPDATED" }
}