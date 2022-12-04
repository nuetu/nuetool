# nuetool

** Nuetu's Nuetool **- a server management application for switching users into game-specific channels on discord.

***Current version allows all server members to use commands, including `$initialize`, `$link`, and `$removelink` commands.***

Packages installed:

Node.js `npm install node`

Discord.js `npm install discord.js`  

Sequelize `npm install discord.js sequelize sqlite3`

## Initial Setup 

1. Run the `$initialize` command on the bot to create the local database that contains the botTextChannel and joinToggle settings

2. If running bot on personal server, you can edit constants `DEBUG_MODE` and `SHOW_UPDATES` to display events in the console

## Current Commands: 

1. ethan: `$ethan <noun>`
    > Have the bot call Ethan names
2. help: `$help`
    > Display commands list in server 
3. link: `$link <Game> <Voice Channel ID>`
    >Link a specific video game to a specific channel. 
    >Users will automatically switch to that channel if they are in a voice channel before they start the game.
    >Type Game and Voice Channel Id exactly as is, if Game contains multiple words, surround title in quotations " . "
    >You can only link one Voice Channel per game, but multiple games can be linked to the same Voice Channel.
    >Right click voice channel and click "Copy ID" to find Voice Channel ID
4. viewlinks: `$viewLinks`
    >View current Voice Channel and Game links
5. removelink: `$removeLink <Game>`
    >Remove Voice Channel link from Game.
    >Type Game exactly as is, if Game contains multiple words, surround in quotations " . "
6. jointoggle: `$joinToggle <true | false>`
    >Toggle whether users can use the join command to join a server they otherwise would not have access to.
7. bottextchannel: `$botTextChannel <Text Channel ID>`
    >Use to configure which channel Nuetool sends texts to.
    >Leave blank to set to any channel / whichever channel you called it from.
8. botdetails: `$botDetails` 
    >Bot Details
9. initialize: `$initialize` 
    >Create local database table row with server settings
    >CAUTION: WILL RESET SERVER BOT (Links will not be removed)
