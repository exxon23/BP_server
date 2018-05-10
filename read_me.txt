NAVOD NA INSTALACIU PROGRAMU PRE BP - SEBASTIAN MACH
1. instalacia RASPBIAN STRETCH LITE(https://www.raspberrypi.org/downloads/raspbian/)

2. instalacia NODEJS
$ curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
$ sudo apt install nodejs

3. instalacia UV4L
$ sudo nano /etc/apt/sources.list
	- pridat link: deb http://www.linux-projects.org/listing/uv4l_repo/raspbian/stretch stretch main
$ sudo apt-get update
$ sudo apt-get install uv4l uv4l-raspicam
$ sudo raspi-config
	- povolit v interface kameru
$ sudo rpi-update
$ sudo apt-get install uv4l-webrtc
$ sudo apt-get install uv4l-server uv4l-uvc uv4l-xscreen uv4l-mjpegstream uv4l-dummy uv4l-raspidisp

4. spustenie servera
$cd bp
$node app.js