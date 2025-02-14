# What is this project?
 a minecraft server dashboard
**Features:**
- **Linux, Windows and Android(Termux) supported**
- **Intuitive Single-Page UI:** A clean and straightforward user interface for easy navigation and usage
- **Plugins and Mods Management:** Manage plugins and mods for your Minecraft server
- **Server Properties Editor:** Easily edit server.properties file to customize server settings
- **FTP Server:** Integrated FTP server for convenient file transfer
- **File Manager:** File manager with syntax highlighting for managing server files
- **Users and Roles System:** Manage users and roles with access restrictions to servers

**Natively supported cores:**
- Official Vanilla Server
- PaperMC
- Spigot
- Waterfall
- Velocity
- Purpur
- Magma

# Installation


## Build from sources

Clone repository and install libs
**Node.js >= 20 required!**
```
git clone https://github.com/nglmercer/server-minecraft-dashboard.git
cd server-minecraft-dashboard
npm install
```

Start after installation
```
npm start
```



## Use Docker container

If you know all the ports you need to use, you can run Kubek in Docker using a command like this. In this example, port 3000 is used for the panel itself, and 25565 for the server
Replace YOUR_DIRECTORY with your folder path

```
docker run -d --name kubek \
            --restart unless-stopped \
			-p 3000:3000 \
			-p 25565:25565 \
			-v /YOUR_DIRECTORY/servers:/usr/kubek/servers \
			-v /YOUR_DIRECTORY/logs:/usr/kubek/logs \
			-v /YOUR_DIRECTORY/binaries:/usr/kubek/binaries \
			-v /YOUR_DIRECTORY/config.json:/usr/kubek/config.json \
			nglmercer/server-minecraft-dashboard
```

If you want to open all ports, then use the command below (with it, Kubek will always work on port 3000, port remapping is not available)
```
docker run -d --name kubek --network host \
            --restart unless-stopped \
			-v /YOUR_DIRECTORY/servers:/usr/kubek/servers \
			-v /YOUR_DIRECTORY/logs:/usr/kubek/logs \
			-v /YOUR_DIRECTORY/binaries:/usr/kubek/binaries \
			-v /YOUR_DIRECTORY/config.json:/usr/kubek/config.json \
			nglmercer/server-minecraft-dashboard
```
## Use termux (Android)

1. Install termux
	- https://f-droid.org/en/packages/com.termux/
	- https://github.com/termux/termux-app
2. Install Packages
	- pkg install nodejs
	- pkg install git
	- pkg install nodejs-npm
4. clone repository
	- git clone https://github.com/nglmercer/kubek-minecraft-dashboard
	- cd kubek-minecraft-dashboard
	- npm install
	- npm run start
### Optional
5. install code-server
	- pkg install code-server
	- code-server --auth none --port 8080 &

### install termux shell
```
pkg update
pkg upgrade
pkg install git
pkg install nodejs
git clone https://github.com/nglmercer/server-minecraft-dashboard
cd server-minecraft-dashboard
npm install
npm run start
```
