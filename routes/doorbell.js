const express = require('express');
const router = express.Router();
const Raspistill = require('node-raspistill').Raspistill;
const {exec , spawn} = require('child_process');
const commands = require('../commands/commands');
const path = require('path');
var Jimp = require("jimp");



router.get('/takephoto',(req,res) => {
    // photo parameters
    const camera = new Raspistill({
        verticalFlip: false,
        width: 640,
        height: 480,
        noFileSave: true,
        time: 0,
    });
    if(camera) {
        camera.takePhoto()
            .then( photo => {
                res.send(photo);
            })
            .catch (error => {
                console.log(error);
            });
    }

});

router.get('/cmdphoto',(req,res) => {
    let img;
    const bat = spawn('raspivid',['-o','-']);
    let resObj = {
        status: false,
        imgBase64: '',
    };
    bat.stdout.on('data',(image) => {
        resObj.imgBase64 = new Buffer(image).toString('base64');
    });
    bat.stderr.on('data', (data) => {
        console.log('<DoorBell> Error by taking photo ' +data.toString());
        res.json(resObj);
      });
    bat.on('exit', (code) => {
        if(code === 0) {
            resObj.status = true;
            res.json(resObj);
        } else {
            res.json(resObj);
        }

        
    });
});


// this endpoint http://[raspberryipaddress]:5000/doorbell/startstream starts stream server http://[raspberryipaddress]:8080/stream
router.get('/startstream', (req,res) => {
    let resObj = {
        status: false
    };
    exec(commands.startUV4Lserver,(error,stdout,stderr) => {
        if(error){
            console.log(error);
            res.json(resObj);
        }
        else{
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            resObj.status = true;
            res.json(resObj);
        }
    });
});

router.get('/stopstream', (req,res) => {
    let resObj = {
        status: false
    };
    exec(commands.stopUV4Lserver,(error,stdout,stderr) => {
        if(error){
            console.log(error);
            res.json(resObj);
            console.log(resObj);
        }
        else{
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            resObj.status = true;
            res.json(resObj);
        }
    });
});


router.get('/lastanalyse', (req,res) => {
    let resObj = {
        status: false
    };
    Jimp.read(`last_analyse.jpg`)
                    .then(function (image) {
                        image.resize(240, 320)            // resize w x h
                        image.getBase64(Jimp.MIME_JPEG,(err,obr) => {
                            if(!err) {
                                resObj.status = true;
                            resObj.imgBase64 = obr;
                            res.json(resObj);
                            }  
                        })
                    })
                    .catch(function (err) {
                        console.error(err);
                        res.json(resObj);
                    }); 
})


/*
router.get('/hq', (req,res) => {
    let resObj = {
        status: false
    };
    exec(commands.startUV4LserverHQ,(error,stdout,stderr) => {
        if(error){
            console.log(err);
            res.json(resObj);
            console.log(resObj);
        }
        else{
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            resObj.status = true;
            res.json(resObj);
        }
    });
});*/



module.exports = router;


