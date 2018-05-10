const { spawn } = require('child_process');


const options = ['-t', '300', '-h' ,'640', '-w' ,'640','-q', '100' ,'-o'  , 'cameraTest.jpg']
const raspistill = spawn("raspistill",options);

raspistill.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

raspistill.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

raspistill.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});