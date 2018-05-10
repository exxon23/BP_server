const { spawn } = require('child_process');
const path = require('path');

const filepath = path.join(__dirname,'../scripts/button');

function buttonListener () {
    return new Promise( function(fulfill, reject) {
        const child = spawn(filepath);
        child.stdout.on('data', fulfill);
        child.stderr.on('data', reject);   
        child.on('exit', reject);
    })
};

module.exports = {buttonListener:buttonListener};