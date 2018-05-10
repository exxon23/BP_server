const { spawn , spawnSync } = require('child_process');
const kill  = require('tree-kill');
//child process for capturing photo
const options = ['-t', '1', '-h' ,'1500', '-w' ,'1000','-q', '100' ,'-o', 'doorbellCamera.jpg']
const raspistill = spawnSync("raspistill",options);

if(!raspistill.stderr.toString()){
    kill(raspistill.pid,'SIGTERM',err=>{
        process.send('success');
    })
}
else    {
    kill(raspistill.pid,'SIGTERM',err=>{
        process.send(raspistill.stderr.toString());
    })
}
