[![][LogoImage]][website] 

# About
Kaholo is an open source workflow automation orchestrator that will help you to focus on what matters.
Build with Node.js and with a growing community and plugins it will allow you to easily build and execute your automation on any amount of agents.

# What to Use Kaholo for

Use Kaholo to automate all your workflow so you can focus on work that matters most. Kaholo is commonly used for:
- CI/CD 
- Running automated tests
- Backup databases

Execute repetitive workflows and tasks, save time, and optimize your development process.

# User Guide & Installation
All instruction on how to install and start using Kaholo can be found on our [user guide][UserGuide].

# Source
You can alwasy find our latest source on [GitHub]. Fork us!

## Building
You can build kaholo by doing the following:
```bash
npm install -g @angular/cli
cd ./console && npm i
cd ./server && npm i
cd ./server && npm run build:prod
```

## Configuring
- Move to server directory
- Rename `.env.example` to `.env`. This is the configuration file for Kaholo. Where you can set custom port, db connection string and more...

## Running
In order to start running kaholo the following must be done:
- Move to server directory
- Run `npm start` to start running Kaholo
- Browse to http://localhost:3000

### Install selected plugins (Optional):
If you wish to install a selected amount of plugins, after building and configuring the system **(Make sure the server not running)**:
- Move to server directory
- Run `npm run install-plugins`

For more plugins visit our [website][plugins]

# News and Website
All information about Kaholo can be found on our [website].


[LogoImage]: /logo.png
[GitHub]: https://github.com/Kaholo/PM-server
[website]: https://kaholo.io/
[plugins]: https://www.kaholo.io/plugins/
[UserGuide]: https://www.kaholo.io/documents/kaholo-user-guide/
