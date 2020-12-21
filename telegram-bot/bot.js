// This file contains all bot functions

const { Telegraf } = require('telegraf');

const bot = new Telegraf('1439119247:AAFhbFCsa9LkVN4x9f-Gq549z4GSNQ_mI8s')

bot.start((ctx)=>{
    return ctx.reply('Hello There');
})

bot.on('text',(ctx)=>{
    return ctx.reply('You entered some text');
})

module.exports = {
    bot
}

