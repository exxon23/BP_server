const express = require('express');
const router = express.Router();
const bme280 = require('../methods/bme280');


router.get('/bme280', (req,res) => {
    let resObj = {
        status: false,
        sensorData: {}  
    };
    bme280.measureBME280()
        .then(sensorData => {
            resObj = {
                status: true,
                sensorData: sensorData
            }
            res.json(resObj);
        })
        .catch(err => {
            console.log('<BME280>' + err);
            res.json(resObj);
        });        
});

module.exports = router;