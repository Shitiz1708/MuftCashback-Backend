'use-strict'

const AWS = require('aws-sdk')
const axios = require('axios')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

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

const sortAllDataAccToSubId = async(data) =>{
    var sortedData = new Object
    for(var i=0;i<data.length;i++){
        const entry = data[i]
        if(sortedData.hasOwnProperty(entry['affExtParam1'])){
            sortedData[entry['affExtParam1']].push(entry)
        }else{
            sortedData[entry['affExtParam1']]=new Array()
            sortedData[entry['affExtParam1']].push(entry)
        }
    }
    console.log(sortedData)
    return sortedData
}

module.exports.send = async(event,context,callback) =>{
    const data = JSON.parse(event.body)
    const startDate = data['startDate']
    const endDate = data['endDate']
    const status = data['status']
    
    const allData = await getAllDataSorted(startDate,endDate,status)

    return { statusCode:200, body:JSON.stringify(allData) }

}