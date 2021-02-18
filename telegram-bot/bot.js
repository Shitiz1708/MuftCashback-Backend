// This file contains all bot functions

const { Telegraf } = require('telegraf');
const axios = require('axios');
const { merchantFlipkart } = require('./flipkart.js')
const { merchantAmazon } = require('./amazon.js')

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

const shortenLink = async(url,ctx) =>{
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

const unshortenLink = async(link,ctx) =>{
    try{
        var response = await axios.get(link)
        return response.request.res.responseUrl
    }catch(err){
        console.log(err)
        return err
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

const getAccessToken = async() =>{
    const client_id = 'y7FC42QPcbVEaZB7bdSFvck3LdFh4s'
    const client_secret = '6LmGAmP1Sn1ctUXdabyPRDNOnjHvZ7'
    const base64header = 'eTdGQzQyUVBjYlZFYVpCN2JkU0Z2Y2szTGRGaDRzOjZMbUdBbVAxU24xY3RVWGRhYnlQUkROT25qSHZaNw=='

    const params = new URLSearchParams()
    params.append('grant_type','client_credentials')
    params.append('client_id',client_id)
    params.append('scope','advcampaigns banners websites deeplink_generator')
    const config = {
        headers:{
            'Authorization': 'Basic '+base64header,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    try{
        const response = await axios.post('https://api.admitad.com/token/',params,config)
        const token = response['data']['access_token']
        console.log(token)
        return token
    }catch(err){
        console.log(err)
        return err
    }
}

const merchantThirdParty = async(link,user,ctx) =>{
    //Get the access token
    const accessToken = await getAccessToken()
    return ctx.reply(accessToken)
    //Get c_id from the link

    //Convert into deeplink
}

const createAffLink = async (link,user,ctx) =>{
    var merchant = checkMerchant(link)
    var afflink = null
    if(merchant=='flipkart'){
        afflink = merchantFlipkart(link,user,ctx)
    }else if(merchant=='amazon'){
        afflink = merchantAmazon(link,user,ctx)
    }else{
        afflink = await merchantThirdParty(link,user,ctx)
    }
    return afflink
}

const convertLink = async(link,currUser,ctx) =>{
    console.log(link)

    //unshorten the link
    var unshortedLink = await unshortenLink(link,ctx)
    console.log(unshortedLink)
    
    //Create Affiliate Link
    var afflink = await createAffLink(unshortedLink,currUser,ctx)
    console.log(afflink)

    //Shorten the link
    var shortlink = await shortenLink(afflink,ctx)
    console.log(shortlink)

    return shortlink
}

function validURL(str) {
    var pattern = new RegExp(
        "^" +
          // protocol identifier (optional)
          // short syntax // still required
          "(?:(?:(?:https?|ftp):)?\\/\\/)" +
          // user:pass BasicAuth (optional)
          "(?:\\S+(?::\\S*)?@)?" +
          "(?:" +
            // IP address exclusion
            // private & local networks
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            // IP address dotted notation octets
            // excludes loopback network 0.0.0.0
            // excludes reserved space >= 224.0.0.0
            // excludes network & broadcast addresses
            // (first & last IP address of each class)
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
          "|" +
            // host & domain names, may end with dot
            // can be replaced by a shortest alternative
            // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
            "(?:" +
              "(?:" +
                "[a-z0-9\\u00a1-\\uffff]" +
                "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
              ")?" +
              "[a-z0-9\\u00a1-\\uffff]\\." +
            ")+" +
            // TLD identifier name, may end with dot
            "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
          ")" +
          // port number (optional)
          "(?::\\d{2,5})?" +
          // resource path (optional)
          "(?:[/?#]\\S*)?" +
        "$", "i"
      );
    return !!pattern.test(str);
}

const convertMessage = async(message,currUser,ctx) =>{
    var messageLines = message.split("\n")
    var messageList = []
    var linkFound=false
    var counter = 0
    for(var line=0;line<messageLines.length;line++){
        var strings = messageLines[line].split(" ")
        var l = []
        
        for(var i=0;i<strings.length;i++){
            if(validURL(strings[i])==true){
                console.log("VALID URL")
                linkFound=true
                var converted_link = await convertLink(strings[i],currUser,ctx) 
                l.push(converted_link)
                counter+=1
                if(counter==6){
                    return "Please send less than 5 links in single message"
                }
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

async function register (ctx){
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
}

bot.command('register',register)
bot.command('Register',register)



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
    console.log(message)

    var return_message = await convertMessage(message,currUser,ctx)

    //Return the link
    return ctx.reply(return_message)
})

module.exports = {
    bot
}

