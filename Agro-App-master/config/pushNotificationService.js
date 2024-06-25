const{ONE_SIGNAL_CONFIG}=require('./app.config');
const https = require('https');


async function sendNotification(data,callback){
    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONE_SIGNAL_CONFIG.API_KEY}`
    }
    const options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers,
        // rejectUnauthorized: false
    }
    const req = https.request(options, function(res) {  
        res.on('data', function(data) {
            console.log("Response:");
            console.log(JSON.parse(data));
            callback(null,JSON.parse(data));
        });
    });
    req.on('error', function(e) {
        console.log("ERROR:");
        console.log(e);
        callback(e);
    });
    req.write(JSON.stringify(data));
    req.end();
}

module.exports = {sendNotification}
