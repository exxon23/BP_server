const express = require('express');
const router = express.Router();
const pythonListener = require('../app')
const sqlite3 = require('sqlite3').verbose();
const { exec, spawnSync } = require('child_process');
var Jimp = require("jimp");

//connecting to sqlite database
let db = new sqlite3.Database('./sqlite3_db_test', (err) => {
    if(err){
        return console.log('<Sqlite> ' + err.message);
    }
});

//route to create folder in training-data for new user to store his train photos
router.get('/adduser',(req,res) => {
    let resObj = {
        status: false,
    }
    // get last id
    db.get("SELECT id FROM users ORDER BY id DESC",(err,row) => {
        if(err) {
            res.json(resObj);
            console.log('<CreatingUser> Error '+ err);
        }
        else {
            let lastUserID;
            if(row.id == undefined) {
                lastUserID = 0;
            }
            else {
                lastUserID = row.id;
            }
            exec(`mkdir -p training-data/s${lastUserID+1}`,[],(error,stdout,stderr) => {
                if(error || stderr) {
                    res.json(resObj);
                    console.log('<CreatingUser> Error '+ error || stderr);
                }
                else {
                    resObj.status = true;
                    resObj.newUserID = lastUserID+1;
                    res.json(resObj);
                }            
        })};
    });
});

//route to remove created folder for new user after cancel saving process
router.get('/cancelusersaving',(req,res) => {
    let resObj = {
        status: false,
    }
    // get last id
    db.get("SELECT id FROM users ORDER BY id DESC",(err,row) => {
        if(err) {
            res.json(resObj);
            console.log('<CreatingUser> Error '+ err);
        }
        else {
            let lastUserID;
            if(row.id == undefined) {
                lastUserID = 0;
            }
            else {
                lastUserID = row.id;
            }
        exec(`rm -rf training-data/s${lastUserID+1}`,[],(error,stdout,stderr) => {
            if(error || stderr) {
                res.json(resObj);
                console.log('<CreatingUser> Error '+ error || stderr);
            }
            else {
                resObj.status = true;
                res.json(resObj);
            }            
        })};
    });
});

//route to take photo of new user, save this photo in folder which belongs to new user, return compressed base64 thumbnail
router.post('/takeuserphoto', (req,res) => {
    let resObj = {
        status: false,
    }
    const photoID = req.body.photoID;
    // get last id
    db.get("SELECT id FROM users ORDER BY id DESC",(err,row) => {
        if(err) {
            res.json(resObj);
            console.log('<CreatingUser> Error '+ err);
        }
        else {
            let lastUserID;
            if(row.id == undefined) {
                lastUserID = 0;
            }
            else {
                lastUserID = row.id;
            }
            
            //child process for capturing photo
            const options = ['-t', '1', '-h' ,'640', '-w' ,'640','-q', '100' ,'-o', `training-data/s${lastUserID+1}/${photoID}.jpg`]
            const raspistill = spawnSync("raspistill",options);
            if(raspistill.stderr.toString()){
                console.log('<Raspistill> Error ' + raspistill.stderr.toString());
                res.json(resObj);
            }
            else {
                Jimp.read(`training-data/s${lastUserID+1}/${photoID}.jpg`)
                    .then(function (image) {
                        image.resize(240, 320)            // resize w x h
                        image.getBase64(Jimp.MIME_JPEG,(err,obr) => {
                            resObj.status = true;
                            resObj.imgBase64 = obr;
                            res.json(resObj);
                        })
                    })
                    .catch(function (err) {
                        resObj.status = false;
                        res.json(resObj);
                    });                    
            }    
        }
    })
});

// route to load information about user
router.post('/showuser', (req,res) => {
    let resObj = {
        status: false,
    }
    if(req.body.userID) {
        Jimp.read(`training-data/s${req.body.userID}/1.jpg`)
                    .then(function (image) {
                        image.resize(120, 160)            // resize w x h
                        image.getBase64(Jimp.MIME_JPEG,(err,obr) => {
                            resObj.status = true;
                            resObj.imgBase64 = obr;
                            res.json(resObj);
                        })
                    })
                    .catch(function (err) {
                        console.error(err);
                        res.json(resObj);
                    }); 
    }         
});
/*
//route to save new user to sqlite database
router.post('/saveuser',(req,res) => {
    // insert one row into the  table users
    let resObj = {
        status: false,
    }
    let userToAdd = {
        name: req.body.name,
        unlock_rights: req.body.unlock_rights,
    }
    db.run("INSERT INTO users VALUES(?,?,?,?)",[null,userToAdd.name,userToAdd.unlock_rights,null], err => {
        if(err) {
            res.json(resObj)
        }
        console.log('1'+pythonListener.pythonListener)
        console.log('2'+pythonListener)
        pythonListener.pythonListener.send("user_added");
        resObj.user = userToAdd;
        resObj.status = true;
        res.json(resObj);
    });
    
});*/

//route to get all user with details
router.get('/getallusers',(req,res) => {
    let resObj = {
        users: [],
        status: false,
    }
    db.each("SELECT id,name,unlock_rights,last_unlock FROM users", (err,row) => {
        if(err){
            res.json(resObj);
        }
        //console.log(row);
        resObj.users.push(row);
    },(e,r) => {
        resObj.status = true;
        res.json(resObj);
      });
    
});

//route to get ID of last entered user
router.get('/lastentry',(req,res) => {
    let resObj = {
        lastEntryID: null,
        status: false
    }
    db.get("SELECT id FROM users ORDER BY id DESC",(err,row) => {
        if(err){
            res.json(resObj);
        }
        
    },(e,rowid) => {
        if(!e) {
            resObj.status = true;
            resObj.lastEntryID = rowid.id;
            res.json(resObj);
        }
        
      });
     
});
//route to delete user by his id
router.post('/deleteuser',(req,res) => {
    let resObj = {
        status: false
    }
    const userID = req.body.id;
    db.run(`DELETE FROM users WHERE rowid=?`, userID, err => {
        if (err) {
          res.json(resObj)
        }
        exec(`rm -rf training-data/s${userID}`,[],(error,stdout,stderr) => {
            if(error || stderr) {
                res.json(resObj);
                console.log('<DeletingUser> Error '+ error || stderr);
            }
            else {
                resObj.status = true;
                res.json(resObj);
            }            
        });  
    });
});






module.exports = router;