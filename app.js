const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  Permissions,
  ActivityType,
} = require(`discord.js`);
const { token, guildId } = require("./config.json");
const Sequelize = require("sequelize"); //local database
const prefix = "$";
const DEBUG_MODE = false;
const SHOW_UPDATES = false;

const commandlist = {
  ethan: `' ${prefix}ethan <noun> '\n    Have the bot call Ethan names`,
  help: `' ${prefix}help '\n    You used this command to get here, you are either dumb or super meta...`,
  link: `' ${prefix}link <Game> <Voice Channel ID> '\n    Link a specific video game to a specific channel. \n    Users will automatically switch to that channel if they are in a voice channel before they start the game.\n    Type Game and Voice Channel Id exactly as is, if Game contains multiple words, surround title in quotations " . "\n    You can only link one Voice Channel per game, but multiple games can be linked to the same Voice Channel.\n    Right click voice channel and click "Copy ID" to find Voice Channel ID`,
  viewlinks: `' ${prefix}viewLinks '\n    View current Voice Channel and Game links`,
  removelink: `' ${prefix}removeLink <Game> '\n    Remove Voice Channel link from Game.\n    Type Game exactly as is, if Game contains multiple words, surround in quotations " . "`,
  jointoggle: `' ${prefix}joinToggle <true | false> '\n    Toggle whether users can use the join command to join a server they otherwise would not have access to.`,
  //join: `' ${prefix}join <Voice Channel Name> '\n    Sends request to users in a targeted voice channel to join.\n    Request is auto approved if no action is taken within 3 minutes.`,
  //yes: `' ${prefix}yes '\n    Accepts join request to last person to send a request to join voice channel you are currently in.`,
  //no: `' ${prefix}no '\n    Denies join request to last person to send a request to join voice channel you are currently in.`,
  bottextchannel: `' ${prefix}botTextChannel <Text Channel ID> '\n    Use to configure which channel Nuetool sends texts to.\n    Leave blank to set to any channel / whichever channel you called it from.`,
  setaccess: `' ${prefix}setAdmin <Role ID> '\n    Use to set which roles can access Nuetool setup commands.\n    Leave blank for any.\n    Copy Role ID from Server Settings > Roles`,
  botdetails: `' ${prefix}botDetails '\n    Bot Details`,
  initialize: `' ${prefix}initialize '\n    CAUTION: WILL RESET SERVER BOT (Links will not be removed)`,
};

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

//When bot first connects
client.on("ready", () => {
  if (DEBUG_MODE || SHOW_UPDATES) {
    console.log("Bot is moovin and groovin");
  }
  client.user.setActivity("Ready to buck some fitches up!", {
    type: ActivityType.Playing,
  });
  ChannelLinks.sync();
  ServerDetails.sync();
});

//connect to local database
const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "database.sqlite",
});

//create ChannelLinks table on local database
const ChannelLinks = sequelize.define("links", {
  game: {
    type: Sequelize.STRING,
    unique: true,
  },
  voiceChannel: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const ServerDetails = sequelize.define("guilds", {
  serverId: {
    type: Sequelize.INTEGER,
    default: guildId,
    unique: true,
  },
  joinToggle: {
    type: Sequelize.BOOLEAN,
    default: true,
  },
  botTextChannel: {
    type: Sequelize.STRING,
    allowNull: true,
    default: null,
  },
  botAccessRole: {
    type: Sequelize.STRING,
    allowNull: true,
    default: null,
  },
});

//initialize server database
async function initializeServer() {
  const server = await ServerDetails.findAll();
  if (server.length == 0) {
    const newServer = await ServerDetails.create({
      serverId: guildId,
      joinToggle: true,
      botTextChannel: null,
      botAccessRole: null,
    });
  }
}

async function adminChannel(channel) {
  const server = await ServerDetails.findOne({ where: { serverId: guildId } });
  if (server && server.botTextChannel != null) {
    channel = await client.channels.fetch(server.botTextChannel);
  }
  return channel;
}

async function adminCommand(message) {
  const server = await ServerDetails.findOne({ where: { serverId: guildId } });
  if (
    message.member.roles.cache.has(server.botAccessRole) ||
    server.botAccessRole == null
  ) {
    return true;
  } else {
    return false;
  }
}

//function called when command "link" is called in server chat. Adds link to the link database
async function addLink(message, game, voice) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    if (isNaN(parseInt(voice))) {
      throw "notANumber";
    }
    const link = await ChannelLinks.create({
      game: game,
      voiceChannel: voice,
    });
    const voiceChannel = client.channels.cache.get(link.voiceChannel);
    channel.send(`Link ${link.game} -> ${voiceChannel.name} added.`);
  } catch (error) {
    if (error === "SequelizeUniqueConstraintError") {
      channel.send("That game is already connected to a Voice Channel.");
    } else if (error === "notANumber") {
      channel.send(
        "Right click on your designated Voice Channel and select 'Copy ID', then paste that after your Game name."
      );
    } else if (error === "notAnAdmin") {
      channel.send("This command requires Admin privilieges.");
    } else {
      channel.send(
        `Something went wrong with adding a link.\n${prefix}link <Game Name> <Voice Channel ID>`
      );
    }
  }
}

//function called when command "viewlinks" is called in server chat. Displays all links in link database.
async function viewLink(message) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    const links = await ChannelLinks.findAll();
    if (links.length > 0) {
      var tagString = "";
      for (let i in links) {
        tagString += `Game: "${
          links[i].game
        }" -> Voice Channel: "${client.channels.cache.get(
          links[i].voiceChannel
        )}"\n`;
      }
      channel.send(tagString);
      if (DEBUG_MODE) {
        console.log(tagString);
      }
    } else {
      channel.send(
        `No active links. To set one up, use command '${prefix}link <Game> <Voice Channel ID>'`
      );
    }
  } catch (error) {
    if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    }
  }
}

//function called when command "removelink" is called in server chat. Removes links from link database
async function removeLink(message, name) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    const remove = await ChannelLinks.destroy({ where: { game: name } });
    if (!remove) {
      channel.send(`No valid game link under the game "${name}"`);
    } else {
      channel.send(`Removed ${name} link`);
    }
  } catch (error) {
    if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    }
  }
}

//function called when command "joinToggle" is called in server chat
async function joinToggle(message, bool) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    const update = await ServerDetails.update(
      { joinToggle: bool },
      { where: { serverId: guildId } }
    );
    if (update > 0) {
      channel.send(
        `joinToggle is now ${bool}. AKA Users can use the ${prefix}join command = ${bool}`
      );
    } else {
      channel.send("something went wrong, contact dev.");
    }
  } catch (error) {
    if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    }
  }
}

//function called when command "bottextchannel" is called in server chat
async function setBotTextChannel(message, textChannel) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    if (!textChannel) {
      textChannel = null;
    }
    if (isNaN(parseInt(textChannel)) && textChannel != null) {
      throw "notANumber";
    }
    const update = await ServerDetails.update(
      { botTextChannel: textChannel },
      { where: { serverId: guildId } }
    );
    if (update > 0) {
      channel.send(
        `bottextchannel is now set to ${client.channels.cache.get(textChannel)}`
      );
    } else {
      channel.send("something went wrong, contact dev.");
    }
  } catch (error) {
    if (error === "notANumber") {
      message.channel.send(
        "Right click on the designated text channel ID and copy ID"
      );
    } else if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    } else {
      if (DEBUG_MODE) {
        console.log(error);
      }
    }
  }
}

async function setBotAccessRole(message, roleID) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    if (!roleID) {
      roleID = null;
    }
    if (isNaN(parseInt(roleID)) && roleID != null) {
      throw "notANumber";
    }
    const update = await ServerDetails.update(
      { botAccessRole: roleID },
      { where: { serverId: guildId } }
    );
    if (update > 0) {
      channel.send(
        `Primary access to bot setup commands is now set to ${roleID}`
      );
    } else {
      channel.send("something went wrong, contact dev.");
    }
  } catch (error) {
    if (error === "notANumber") {
      message.channel.send("Copy the Role ID from Settings > Roles");
    } else if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    } else {
      if (DEBUG_MODE) {
        console.log(error);
      }
    }
  }
}

async function botDeatils(message) {
  const admin = await adminCommand(message);
  try {
    if (!admin) {
      throw "notAnAdmin";
    }
    channel = await adminChannel(message.channel);
    const links = await ChannelLinks.findAll();
    const server = await ServerDetails.findOne({
      where: { serverId: guildId },
    });
    channel.send(
      `Total links: ${links.length}\n Join Toggle: ${server.joinToggle}\n Bot Channel: ${server.botTextChannel}\n Access Role: ${server.botAccessRole}`
    );
  } catch (error) {
    if (error === "notAnAdmin") {
      message.channel.send("This command requires Admin privilieges.");
    }
  }
}

//functions when any message is sent, filters for commands, sends to runCommand function, returns invalid command if command isn't recgonized .
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return; //check for texts that start with designated prefix
  const regex = /"[^"]+"|[^\s]+/g;
  const args = message.content
    .slice(prefix.length)
    .match(regex)
    .map((e) => e.replace(/"(.+)"/, "$1")); //returns array of arguments, const command removes command from argument array
  const command = args.shift().toLowerCase(); //returns requested command name
  if (command in commandlist) {
    runCommand(command, args, message);
  } else {
    if (DEBUG_MODE) {
      console.log("Invalid Command");
    }
    message.channel.send(
      `Invalid Command! Please type " ${prefix}help " for help :)`
    );
  }
});

//runs commands.
function runCommand(command, args, message) {
  const channel = message.channel;
  switch (command) {
    case "ethan":
      channel.send(`Ethan is a ${args.join(" ")}`);
      if (DEBUG_MODE) {
        console.log("command 'ethan' called");
      }
      break;
    case "help":
      var output = "Available commands list:\n";
      for (let key in commandlist) {
        output += `**${key}**: ${commandlist[key]}\n`;
      }
      message.author.send(output);
      if (DEBUG_MODE) {
        console.log("command 'help' called");
      }
      break;
    case "link":
      addLink(message, args[0], args[1]);
      if (DEBUG_MODE) {
        console.log("command 'link' called");
      }

      break;
    case "viewlinks":
      viewLink(message);
      if (DEBUG_MODE) {
        console.log("command 'viewlinks' called");
      }

      break;
    case "removelink":
      removeLink(message, args[0]);
      if (DEBUG_MODE) {
        console.log("command 'removelink' called");
      }

      break;
    case "jointoggle":
      joinToggle(message, args[0]);
      if (DEBUG_MODE) {
        console.log("command 'jointoggle' called");
      }
      break;
    case "bottextchannel":
      setBotTextChannel(message, args[0]);
      if (DEBUG_MODE) {
        console.log("command 'bottextchannel' called");
      }
      break;
    case "join":
      if (DEBUG_MODE) {
        console.log("command 'join' called");
      }
      break;
    case "yes":
      if (DEBUG_MODE) {
        console.log("command 'yes' called");
      }
      break;
    case "no":
      if (DEBUG_MODE) {
        console.log("command 'no' called");
      }
      break;
    case "setaccess":
      setBotAccessRole(message, args[0]);
      if (DEBUG_MODE) {
        console.log("command 'setaccess' called");
      }
      break;
    case "botdetails":
      if (DEBUG_MODE) {
        console.log("command 'botdetails' called");
      }
      botDeatils(message);
      break;
    case "initialize":
      if (DEBUG_MODE) {
        console.log("command 'initialize' called");
      }
      initializeServer();
      break;
  }
}

//alerts console of user's channel switch, mostly useful for debugging
client.on("voiceStateUpdate", (oldState, newState) => {
  //if user joined new channel
  if (newState.channelId && (DEBUG_MODE || SHOW_UPDATES)) {
    // if user moved channel
    if (oldState.channelId !== null) {
      console.log(
        `${newState.member.nickname} switched to ${newState.channel.name}`
      );
    } else {
      console.log(
        `${newState.member.nickname} joined ${newState.channel.name}`
      );
    }
  } else {
    console.log(`${newState.member.nickname} left ${oldState.channel.name}`);
  }
});

//If a player is in a voice channel, this detects when the player switches/starts games, and moves them to a channel designated by adding a Game -> Voice Channel link
client.on("presenceUpdate", async (oldState, newState) => {
  const user = newState.member;
  //detects if user is currently in a channel
  if (user.voice.channel) {
    //user started activity
    if (user.presence.activities.length != 0) {
      //user activity is of "Playing" type
      if (user.presence.activities[0].type == ActivityType.Playing) {
        var gameName = user.presence.activities.toString();
        console.log(`${user.nickname} started playing ${gameName}`);
        //move user to appropriate channel
        const link = await ChannelLinks.findOne({ where: { game: gameName } });
        if (link) {
          user.voice.setChannel(link.voiceChannel);
          if (DEBUG_MODE) {
            console.log(
              `Nuetools moved ${user.nickname} to ${user.voiceChannel}`
            );
          }
        }
      }
    } else {
      //user stops activity
    }
  } else {
    //user is not currently in a channel
  }
});

//connects discord bot to nodejs server via bot token
client.login(token);
