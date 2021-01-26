const merchantFlipkart = (link,user,ctx) =>{
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
        for(var i=0;i<listOfStrings.length;){
            if(listOfStrings[i].includes('cmpid')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            else if(listOfStrings[i].includes('affid')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            else if(listOfStrings[i].includes('affExtParam1')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }
            else if(listOfStrings[i].includes('affExtParam2')){
                console.log("Removed "+ listOfStrings[i])
                listOfStrings.splice(i,1)
            }else{
                i++;
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

module.exports = { merchantFlipkart }