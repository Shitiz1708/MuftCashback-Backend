// This file contains all bot functions

const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf('1439119247:AAFhbFCsa9LkVN4x9f-Gq549z4GSNQ_mI8s')


const AWS = require('aws-sdk');
const { link } = require('fs');
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

    // console.log(params)

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

const alreadyRegistered = async (email) =>{
    const allUsers = await getCompleteUsertable()
    // console.log(allUsers)
    for(var i=0;i<allUsers.length;i++){
        console.log("Inside Loop")
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
                'Authorization': 'Bearer 5009a293812d670bf4b0a678803db114a0a8edad',
                'Content-Type': 'application/json'
            }
        })
        // console.log(response['data']['link'])
        return response['data']['link']
    }catch(err){
        console.log(err)
        return err
    }
}

const unshortenLink = async(link) =>{
    try{
        var response = await axios.get(link)
        return response.request.res.responseUrl
    }catch(err){
        console.log(err)
        return err
    }
}

const merchantFlipkart = (link,user) =>{
    //2. For Flipkart
    //2.1 Remove cmpid,affid,affExtparam1
    //2.2 Add personal affid and affExtParam as User Subid
    //2.3 Replace www by dl
    var [baseUrl,headers] = link.split("?")
    var listOfStrings=[];
    if(typeof headers !== 'undefined')
    {
        listOfStrings = headers.split("&")
        console.log(listOfStrings)
        for(var i=0;i<listOfStrings.length;i++){
            if(listOfStrings[i].includes('cmpid')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            if(listOfStrings[i].includes('affid')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            if(listOfStrings[i].includes('affExtParam1')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            if(listOfStrings[i].includes('affExtParam2')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
        }
    }
    listOfStrings.push('affid=bansalsid')
    listOfStrings.push('affExtParam1='+user['SubId'])
    var headerString = listOfStrings.join('&')
    baseUrl = baseUrl.replace('www','dl')
    var affLink = baseUrl+'?'+headerString
    return affLink
}

const merchantAmazon = (link,user) =>{
    if('AmazonEnabled' in user){
        var idx = link.indexOf("tag=")
        var affLink = null
        // console.log(idx)
        if(idx!=-1){
            var tempstr = ""
            for(var i=idx+4;i<link.length;i++){
                if(link[i]=='&'){
                    break
                }
                tempstr+=link[i]
            }
            console.log(tempstr)
            affLink = link.replace(tempstr,user['SubId']+'-21')
        }else{
            affLink = link+"?tag="+user['SubId']+'-21'
        }
        return affLink
    }else{
        return ctx.reply('Please register on our app for using amazon affiliate')
    }
}

const checkMerchant = (link) =>{
    //1. Check for merchant
    if(link.includes("flipkart")){
        return "flipkart"
    }else if(link.includes("amazon")){
        return "amazon"
    }else{
        return "third-party"
    }
}

const createAffLink = (link,user) =>{
    var merchant = checkMerchant(link)
    var afflink = null
    if(merchant=='flipkart'){
        afflink = merchantFlipkart(link,user)
    }else if(merchant=='amazon'){
        afflink = merchantAmazon(link,user)
    }
    return afflink
}

const convertLink = async(link,currUser) =>{
    console.log(link)

    //unshorten the link
    var unshortedLink = await unshortenLink(link)
    console.log(unshortedLink)
    
    //Create Affiliate Link
    var afflink = createAffLink(unshortedLink,currUser)
    console.log(afflink)

    //Shorten the link
    var shortlink = await shortenLink(afflink)
    console.log(shortlink)

    return shortlink
}

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    // var pattern = new RegExp('_^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}-\x{ffff}0-9]+-?)*[a-z\x{00a1}-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}-\x{ffff}0-9]+-?)*[a-z\x{00a1}-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}-\x{ffff}]{2,})))(?::\d{2,5})?(?:/[^\s]*)?$_iuS')
    return !!pattern.test(str);
}

const convertMessage = async(message,currUser) =>{
    var messageLines = message.split("\n")
    var messageList = []
    var linkFound=false
    for(var line=0;line<messageLines.length;line++){
        var strings = messageLines[line].split(" ")
        var l = []
        for(var i=0;i<strings.length;i++){
            if(validURL(strings[i])==true){
                console.log("VALID URL")
                linkFound=true
                var converted_link = await convertLink(strings[i],currUser) 
                l.push(converted_link)
            }else{
                l.push(strings[i])
            }
        }
        messageList.push(l.join(" "))
    }

    var return_message = messageList.join("\n")
    
    return return_message
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
    var alreadyUser = await alreadyRegistered(email)
    console.log(alreadyUser)
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


bot.on('text',async(ctx)=>{
    //Check if a person with this chat id is registered or not
    const chat_id = ctx.chat.id
    const allUsers = await getCompleteUsertable()
    var currUser = null
    for(var i=0;i<allUsers.length;i++){
        if(allUsers[i]['UserBotId']==chat_id){
            currUser = allUsers[i]
            console.log('User Found')
        }
    }

    if(currUser==null){
        return ctx.reply('User Not Found! Please Register to our app and use the same email to register to this bot')
    }

    var message = ctx.message.text
    // message.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    // console.log(typeof message)
    console.log(message)
    // message = removeEmojis(message)
    // console.log(message)
    

    var return_message = await convertMessage(message,currUser)

    //Return the link
    return ctx.reply(return_message)
})

module.exports = {
    bot
}

