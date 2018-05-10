const request = require('request');    // npm package from requesting URL

//default address - Brno, Technicka, 612 00, Czech R.
const address = {
    latitude: 49.224317, 
    longtitude: 16.577616
} ;

//API key from Darksky account
const apiKey = '077e9a5e77f09466a7e8a6e1bc0cffa5';
//URL to request to get weather data
const weatherURL = `https://api.darksky.net/forecast/${apiKey}/${address.latitude},${address.longtitude}?units=si`; 

darkSkyWeatherForecast = (callback) => {
    request({
        url: weatherURL,
        json: true
    },(err,res,body) => {
        if(err){
            callback('Unable to connect to ForeCast.io');
        }
        else if(res.statusCode === 400) {
            callback('Unable to fetch weather');
        }
        else if(!err && res.statusCode === 200)
            callback(undefined,body);
    
    })

}

module.exports = {darkSkyWeatherForecast : darkSkyWeatherForecast};
//https://api.darksky.net/forecast/077e9a5e77f09466a7e8a6e1bc0cffa5/49.224317,16.577616?units=si