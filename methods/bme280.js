const { execFile } = require('child_process');
const path = require('path');

const filepath = path.join(__dirname,'../scripts/bme280');

function measureBME280 ()  {
    return new Promise( function(fulfill, reject) {
        execFile(filepath, (err,stdout,stderr) => {
            if(err) reject(err);
            if(stderr) reject(stderr);
            else fulfill(JSON.parse(stdout));    
        });
    })
};

module.exports = {measureBME280:measureBME280};

