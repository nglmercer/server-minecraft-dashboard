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
git clone https://github.com/nglmercer/server-minecraft-dashboard
cd server-minecraft-dashboard
npm install
```

Start after installation
```
npm start
```

## Use termux (Android)

1. Install termux
	- https://f-droid.org/en/packages/com.termux/
	- https://github.com/termux/termux-app
	- update packages and upgrade
```bash
pkg update
pkg upgrade
```
2. Install Packages with pkg or apt
	- apt install nodejs
	- apt install git
	- apt install nodejs-npm
4. clone repository
	- git clone https://github.com/nglmercer/kubek-minecraft-dashboard
	- cd kubek-minecraft-dashboard
	- npm install
	- npm run start
### Optional
5. install code-server
	- apt install code-server
	- code-server --auth none --port 8080 &

### install termux(apt)/linux(apt,dnf,etc) shell 
- termux [pkg], linux [apt,dnf,etc]
```
pkg update 
pkg upgrade
apt install git
apt install nodejs
git clone https://github.com/nglmercer/server-minecraft-dashboard
cd server-minecraft-dashboard
npm install --ignore-scripts
npm run start
```
- install java `openjdk-21`
- support build app with electron
###  Client Manager FrontEND
https://github.com/nglmercer/serverMCASTRO
