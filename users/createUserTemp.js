'use strict';

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

const pool_region = 'ap-south-1';
const cognitoclient = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-19",
    region: "ap-south-1"
});

module.exports.register = (event,context,callback) =>{
    const data = JSON.parse(event.body)
    const name = data['name']
    const email = data['email']
    const phone = data['phone']
    const pass = data['password']

    const poolData = {    
        UserPoolId : "ap-south-1_WuenH36Ot", // Your user pool id here    
        ClientId : "4r55pffr5mnalc1dbkes1d3h6" // Your client id here
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    console.log(userPool)

    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value:name}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:email}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"phone_number",Value:phone}));
    console.log(attributeList)

    // var poolData = {
    //     UserPoolId: "ap-south-1_WuenH36Ot",
    //     Username: email,
    //     DesiredDeliveryMediums: ["EMAIL"],
    //     TemporaryPassword: pass,
    //     UserAttributes: attributeList
    // };

    userPool.signUp(email,pass,attributeList, (err, result) => {
        if (err) {
            console.log(err);

            callback(null, {
                statusCode: err.statusCode || 400,
                headers: { 'Content-Type': 'text/plain' },
                body: err,
            });
            return;
        }
        console.log(result)
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
        callback(null,result);

    });

}