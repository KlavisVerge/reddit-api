require('dotenv/config');
const AWS = require('aws-sdk');
const request = require('request-promise');
AWS.config.update({region: 'us-east-1'});

exports.handler = (event, context) => {
    if(event){
        if(!event.body){
            event.body = {};
        }else if(typeof event.body === 'string'){
            event.body = JSON.parse(event.body);
        }
    }
    const required = ['game'].filter((property) => !event.body[property]);
    if(required.length > 0){
        return Promise.reject({
            statusCode: 400,
            message: `Required properties missing: "${required.join('", "')}".`
        });
    }
    let promises = [];
    var options = {
        url: 'https://www.reddit.com/r/' + event.body.game  + '/hot/.json?limit=10',
        headers: {
        }
    };
    promises.push(request(options).promise().then((res) => {
        return res;
    }).catch(function (err) {
        return Promise.reject({
            statusCode: err.statusCode,
            message: 'Error interacting with Reddit API.'
        });
    }));

    return Promise.all(promises).then((responses) => {
        const[results] = responses;
        let parsedResults = JSON.parse(results).data.children;
        const maxLength = parsedResults.length < 10 ? parsedResults.length : 10;
        let returnObject = {
            data: []
        };
        for(var i = 0; i < maxLength; i++){
            returnObject.data.push(
              {
                  title: parsedResults[i].data.title,
                  permalink: 'https://www.reddit.com' + parsedResults[i].data.permalink
              }  
            );
        }
        return context.succeed({
            statusCode: 200,
            // body: JSON.stringify(results),
            body: JSON.stringify(returnObject),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,XAmz-Security-Token',
                'Access-Control-Allow-Origin': '*'
            }
        });
    });
}