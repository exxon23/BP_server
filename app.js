const express = require('express');
const http = require('http');
const app = express();
const kill  = require('tree-kill');
const { spawn , spawnSync,fork } = require('child_process');
const session = require('express-session');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
const path = require('path');
const server = http.createServer(app)
const cors = require('cors');
const schedule = require('node-schedule');
const expressWs = require('express-ws')(app,server);
const ThingSpeakClient = require('thingspeakclient');
const client = new ThingSpeakClient();
const sqlite3 = require('sqlite3').verbose();
const PythonShell = require('python-shell');
const bme280 = require('./methods/bme280');
const EventEmitter = require("events").EventEmitter;
const myEmitter = new EventEmitter();
// Thingspeak channel for indoor values of temp,humidity and pressure
const thingSpeakConfig = {
    writeKey: 'AIPS9P36XNM8ZSCC',
    readKey: '3BS1TNBC3MIVZWJO',
    channelId: 483270
};


//load routes
const forecast = require('./routes/weatherForecast');
const doorbell = require('./routes/doorbell');
const index = require('./routes/index');
const sensors = require('./routes/sensors');
const users = require('./routes/users');

// bodyparser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// cors
app.use(cors());

app.use(express.static(path.join(__dirname,'public')));


//express session middleware
app.use(session({

secret: 'secret',
     resave: true, 
     saveUninitialized: true
 }));

 // use routes
app.use('/', index);
app.use('/users', users);
app.use('/forecast', forecast);
app.use('/doorbell', doorbell);
app.use('/sensors', sensors);

// //child process for communicating between NODEJS and Python - stdin and stdout
const pythonListener = new PythonShell('python_stdin.py');
//connecting to sqlite database
let db = new sqlite3.Database('./sqlite3_db_test', (err) => {
    if(err){
        return console.log('<Sqlite> ' + err.message);
    }
    console.log('SQLITE Database connected');
});

pythonListener.on('message', message => {
    console.log('<PythonListerner> ' + message);
    const pythonMsg = JSON.parse(message);
    // face recognition was made -> refresh photo of last analyse
    if(pythonMsg.action == 'Face recognition complete') {
        myEmitter.emit('last_analyse');
    }
    // face recognition was successful -> update last unlock data in database for recognized user
    if(pythonMsg.action == 'Face match') {
        db.run('UPDATE users SET last_unlock = ? WHERE id = ?', [new Date().toLocaleString(), pythonMsg.userID], err => {
            if(err) {
                console.log('<SQLite> Error by updating last_unlock ' + err);
            }
        })
    }
});

pythonListener.on('error', error => {
    console.log('<PythonListerner> Error' + error);
});
pythonListener.on('close', error => {
    console.log('<PythonListerner> Error' + error);
});


// run child process, which is listening to button output
const btnListernerPath = path.join(__dirname,'./scripts/button');
const buttonListener = spawn(btnListernerPath)
buttonListener.stderr.on('data', data => {
    console.log('<ButtonListener> ' + data );
});

// WebSocket for calling after button was holded for more than 2 seconds
app.ws('/stream', ws => {
    const wsSending = () => {
        try {
            ws.send('btn_hold');
        }
        catch(err) {
            console.log('<WebSocket> Warning : Not opened for videocall request')
        }
    }
    console.log('<WebSocket> Opened for videocall request');
    myEmitter.on('call_request', wsSending);
    ws.on('close',() => {
        console.log('<WebSocket> Disconnected for videocall request');
        myEmitter.removeListener('call_request',wsSending);
    });
});
// WebSocket for refresh last analyse photo after face recognition was made
app.ws('/lastanalyse', ws => {
    const wsSending = () => {
        try {
            ws.send("last_analyse_changed");
        }
        catch(err) {
            console.log('<WebSocket> Warning : Not opened for last analyse photo refresh')
        }
    }
    console.log("<WebSocket> Opened for last analyse photo refresh");
    myEmitter.on("last_analyse", wsSending);
    ws.on('close',() => {
        console.log("<WebSocket> Disconnected for last analyse photo refresh");
        myEmitter.removeListener("last_analyse",wsSending);
    });
});

buttonListener.stdout.on('data', data => {
    console.log('<ButtonListener> ' + data.toString());
    // stdout from buttonListener 'btn_push' -> take photo of user in front of camera and start recognition
    if(data.toString() =='btn_push\t')  {       
        const raspistill = fork(`${__dirname}/raspistill.js`);
        raspistill.on('message', stdio => {
            if(stdio == 'success'){
                console.log('<Raspistill> Photo was taken');
                pythonListener.send("btn_push");  
            }
            else {
                console.log('<Raspistill> ' + stdio);
            }
          });
                
    };
    // stdout from buttonListener 'btn_hold' -> start call to UI (user will decide about answer/decline)
    if(data.toString() =='btn_hold\t')   {
        try {
            //send data to WebSocket to visualize call component
            myEmitter.emit("call_request"); 
        }
        catch(err) {
            console.log('Noone is listening' + err);
        }
        
    } 
});


buttonListener.on('close', code => {
    console.log(`<ButtonListener> Child process exited with code ${code}`);
});

// function for sending data from BME sensor to ThingSpeak
// scheduler for time managment these fuction
var scheduler = schedule.scheduleJob('*/10 * * * *', function(){

    client.attachChannel(thingSpeakConfig.channelId, 
        { writeKey:thingSpeakConfig.writeKey, 
            readKey:thingSpeakConfig.readKey}, (errAttachChannel,resAttachChennel) => {
                if(!errAttachChannel){
                    // start measuring and get data from BME sensor
                    bme280.measureBME280()
                        .then(sensorData => {
                        // send data to channel TS
                        client.updateChannel(thingSpeakConfig.channelId, {field1: sensorData.temperature, field2: sensorData.humidity, field3: sensorData.pressure}, (updateErr,updateRes) => {
                                console.log('<ThingSpeak> Data posted to ThingSpeak at', new Date());
                            });     
                        })
                        .catch(err => {
                            console.log('<ThingSpeak> Error by sending data to ThingSpeak ' + err);
                        });            
                }
    });
});   

//route to save new user to sqlite database
app.post('/users/saveuser',(req,res) => {
    pythonListener.send("user_added");
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
        
        resObj.user = userToAdd;
        resObj.status = true;
        res.json(resObj);
    });
    
});

server.listen(port, ()=>{
    console.log(`Server started on port ${port}`);
});

module.exports={pythonListener:pythonListener};