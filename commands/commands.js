// Object with commands to run on Raspberry

const commands = {
    startUV4Lserver: 'uv4l --driver raspicam --auto-video_nr --width 640 --height 480 --encoding h264',
    stopUV4Lserver: 'pkill uv4l',
    startUV4LserverHQ: 'uv4l --driver raspicam --auto-video_nr --encoding h264 --width 1920 --height 1080',
    takePhoto: 'raspivid -o -'
    }

module.exports = commands;