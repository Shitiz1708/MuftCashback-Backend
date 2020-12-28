// This file contains all bot functions

const { Telegraf } = require('telegraf');
// const axios = require('axios');





const bot = new Telegraf('1439119247:AAFhbFCsa9LkVN4x9f-Gq549z4GSNQ_mI8s')


const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const initiateReferrer = async(subid,chat_id) =>{
    console.log(subid,chat_id)
    const params = {
        TableName:'Users',
        Key:{
            SubId:subid
        },
        UpdateExpression:"Set BotEnabled=:value, UserBotId=:chat_id",
        ExpressionAttributeValues:{
            ':value':true,
            ':chat_id':chat_id
        }
    }

    console.log(params)

    try{
        var res = await dynamoDB.update(params).promise()
        console.log(res)
        return true
    }catch(err){
        console.log(err)
        return false
    }
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

const alreadyRegistered = async(email) =>{
    const allUsers = getCompleteUsertable()
    for(var i=0;i<allUsers.length;i++){
        if(allUsers[i]['Email']==email && "BotEnabled" in allUsers[i]){
            console.log('User Found')
            return true
        }
    } 
    return false
}

const shortenLink = async(url) =>{
    try{
        const response = await axios({
            method:'post',
            url:'https://api-ssl.bitly.com/v4/shorten',
            data:{ 
                "long_url": url, 
                "domain": "bit.ly"
            },
            headers:{
                'Authorization': 'Bearer d060d7146eb5ba6f901ce28bf3c161b690391ed3',
                'Content-Type': 'application/json'
            }
        })
        console.log(response['link'])
        return response['link']
    }catch(err){
        console.log(err)
        return err
    }
}



bot.start((ctx)=>{
    return ctx.reply('Hello There! Please register to the bot using /register <email>');
})

bot.command('register',async (ctx)=>{
    var msg = ctx.message.text
    var email = msg.substring(10);


    if(validateEmail(email)==false){
        return ctx.reply('Please Enter Valid Email')
    }

    // If email is already registered as referrer . Break the operation
    var alreadyUser = alreadyRegistered(email)
    if(alreadyUser){
        console.log('Inside this')
        return ctx.reply("Email Already Registered. Please contact support for help!")
    }

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

    for(var i=0;i<res.Items.length;i++){
        if(res.Items[i]['Email']==email){
            var result = initiateReferrer(res.Items[i]['SubId'],ctx.chat.id)
            console.log(result)
            if(result)
                return ctx.reply('Referrer Account Initiated')
            else
                return ctx.reply('Something Went Wrong! Please try again..')
        }
    }

    return ctx.reply('Account Not Found. Please register to our app')    

})

bot.on('text',(ctx)=>{
    //Check if a person with this chat id is registered or not
    const chat_id = ctx.chat.id
    var allUsers = getCompleteUsertable()
    var currUser = null
    for(var i=0;i<allUsers.length;i++){
        if(allUsers[i]['UserBotId']==chat_id){
            currUser = allUsers[i]
        }
    }

    if(currUser==null){
        return ctx.reply('User Not Found! Please Register to our app and use the same email to register to this bot')
    }

    //Check if the link is shortened or not


    //Add affid to the link

    //Shorten the link
    var link = shortenLink('https://www.amazon.in/Ambrane-PP-150-15000mAH-Lithium-Polymer/dp/B07MHMKSXZ?ref_=Oct_DLandingS_D_c7cbd4d0_61&smid=A14CZOWI0VEHLG')
    // var link = 'https://www.amazon.in/Ambrane-PP-150-15000mAH-Lithium-Polymer/dp/B07MHMKSXZ?ref_=Oct_DLandingS_D_c7cbd4d0_61&smid=A14CZOWI0VEHLG'

    //Return the link
    return ctx.reply(link)
})

module.exports = {
    bot
}

