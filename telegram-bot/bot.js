// This file contains all bot functions

const { Telegraf } = require('telegraf');


const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const bot = new Telegraf('1439119247:AAFhbFCsa9LkVN4x9f-Gq549z4GSNQ_mI8s')

bot.start((ctx)=>{
    return ctx.reply('Hello There! Please register to the bot using /register <email>');
})

bot.command('register',(ctx)=>{
    var msg = ctx.message.text
    var email = msg.substring(10);
    if(validateEmail(email)==false){
        return ctx.reply('Please Enter Valid Email')
    }

    const params = {
        TableName:'Users',
        Key:{
            SubId:subid
        },
        ProjectionExpression:
    }
})

bot.on('text',(ctx)=>{
    return ctx.reply("HEY");
})

module.exports = {
    bot
}

