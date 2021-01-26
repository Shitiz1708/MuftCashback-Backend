const merchantAmazon = (link,user,ctx) =>{
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

module.exports = { merchantAmazon }