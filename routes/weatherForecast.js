const express = require('express');
const router = express.Router();
const darkskyForecast = require('../methods/darkSkyWeatherForecast');
const ThingSpeakClient = require('thingspeakclient');
const client = new ThingSpeakClient();
const thingSpeakConfig = {
    writeKey: 'J98WHAKCGFR0GLS8',
    readKey: 'Q8SG8RAV5OP2A8UG',
    channelId: 478630
};
// endpoint to get actual weather info and weather forecast for next hours/days
router.get('/darkskyforecast',(req,res) => {
    let resObj = {
        status: false,
        weatherInfo: {
            currently: null,
            hourly: null,
            daily: null
        }   
    }
    darkskyForecast.darkSkyWeatherForecast((err,data) => {      
        if(err){
            res.json(resObj);
        }
        else {
            resObj.status = true;
            resObj.weatherInfo = {
                currently: data.currently,
                hourly: data.hourly.data.slice(1,25),
                daily: data.daily.data.slice(1,6)
            };
            res.json(resObj);
        }
    });
});

router.get('/raspberryforecast', (req,res) => {
    let resObj = {
        status: false,
        forecastInfo: {}     
    };
    client.attachChannel(thingSpeakConfig.channelId, 
        { writeKey:thingSpeakConfig.writeKey, 
             readKey:thingSpeakConfig.readKey}, (errAttachChannel,resAttachChennel) => {
                if(!errAttachChannel){
                    client.getLastEntryInFieldFeed(thingSpeakConfig.channelId, 1, '', (err,response)=>{
                        if(err) {
                            console.log(err);
                            res.json(resObj);
                        }
                        else {
                            let data = JSON.parse(response.field1);
                            console.log(data)
                            resObj.status = true;
                            resObj.forecastInfo = data;
                            res.json(resObj);
                        }
                    });                            
                }                                      
        }
    );
})

module.exports = router;
