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

const commandlist = {
  ethan: `' ${prefix}ethan <noun> '\n    Have the bot call Ethan names`,
  help: `' ${prefix}help '\n    You used this command to get here, you are either dumb or super meta...`,
  link: `' ${prefix}link <Game> <Voice Channel ID> '\n    Link a specific video game to a specific channel. \n    Users will automatically switch to that channel if they are in a voice channel before they start the game.\n    Type Game and Voice Channel Id exactly as is, if Game contains multiple words, surround title in quotations " . "\n    You can only link one Voice Channel per game, but multiple games can be linked to the same Voice Channel.\n    Right click voice channel and click "Copy ID" to find Voice Channel ID`,
  viewlinks: `' ${prefix}viewLinks '\n    View current Voice Channel and Game links`,
  removelink: `' ${prefix}removeLink <Game> '\n    Remove Voice Channel link from Game.\n    Type Game exactly as is, if Game contains multiple words, surround in quotations " . "`,
  jointoggle: `' ${prefix}joinToggle <true | false> '\n    Toggle whether users can use the join command to join a server they otherwise would not have access to.`,
  join: `' ${prefix}join <Voice Channel Name> '\n    Sends request to users in a targeted voice channel to join.\n    Request is auto approved if no action is taken within 3 minutes.`,
  yes: `' ${prefix}yes '\n    Accepts join request to last person to send a request to join voice channel you are currently in.`,
  no: `' ${prefix}no '\n    Denies join request to last person to send a request to join voice channel you are currently in.`,
  bottextchannel: `' ${prefix}botTextChannel <Text Channel ID> '\n    Use to configure which channel Nuetool sends texts to.\n    Leave blank to set to any channel / whichever channel you called it from.`,
  setaccess: `' ${prefix}setAdmin <Role> '\n    Use to set which roles can access Nuetool setup commands.\n    Leave blank for default (Server Owner)`,
  botdetails: `Bot Details`,
  initialize: `CAUTION: WILL RESET SERVER BOT (Links will not be removed)`,
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
  console.log("Bot is moovin and groovin");
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
    type: Sequelize.INTEGER,
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
});

//initialize server database
async function initializeServer() {
  const server = await ServerDetails.findAll();
  if (server.length == 0) {
    const newServer = await ServerDetails.create({
      serverId: guildId,
      joinToggle: true,
      botTextChannel: null,
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

//function called when command "link" is called in server chat. Adds link to the link database
async function addLink(channel, game, voice) {
  channel = await adminChannel(channel);
  try {
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
    } else {
      channel.send(
        `Something went wrong with adding a link.\n${prefix}link <Game Name> <Voice Channel ID>`
      );
    }
  }
}

//function called when command "viewlinks" is called in server chat. Displays all links in link database.
async function viewLink(channel) {
  channel = await adminChannel(channel);
  const links = await ChannelLinks.findAll();
  var tagString = "";
  for (let i in links) {
    tagString += `Game: "${
      links[i].game
    }" -> Voice Channel: "${client.channels.cache.get(
      links[i].voiceChannel
    )}"\n`;
  }
  channel.send(tagString);
  console.log(tagString);
}

//function called when command "removelink" is called in server chat. Removes links from link database
async function removeLink(channel, name) {
  channel = await adminChannel(channel);
  const remove = await ChannelLinks.destroy({ where: { game: name } });
  if (!remove) {
    channel.send(`No valid game link under the game "${name}"`);
  } else {
    channel.send(`Removed ${name} link`);
  }
}

//function called when command "joinToggle" is called in server chat
async function joinToggle(channel, bool) {
  channel = await adminChannel(channel);
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
}

//function called when command "bottextchannel" is called in server chat
async function setBotTextChannel(channel, textChannel) {
  channel = await adminChannel(channel);
  if (!textChannel) {
    textChannel = null;
  }
  try {
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
      channel.send("Right click on the designated text channel ID and copy ID");
    } else {
      console.log(error);
    }
  }
}

async function botDeatils(channel) {
  channel = await adminChannel(channel);
  const links = await ChannelLinks.findAll();
  const server = await ServerDetails.findOne({ where: { serverId: guildId } });
  channel.send(
    `Total links: ${links.length}\n Join Toggle: ${server.joinToggle}\n Bot Channel: ${server.botTextChannel}`
  );
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
    runCommand(command, args, message.channel);
  } else {
    console.log("Invalid Command");
    message.channel.send(
      `Invalid Command! Please type " ${prefix}help " for help :)`
    );
  }
});

//runs commands.
function runCommand(command, args, channel) {
  switch (command) {
    case "ethan":
      channel.send(`Ethan is a ${args.join(" ")}`);
      break;
    case "help":
      var output = "Available commands list:\n";
      for (let key in commandlist) {
        output += `**${key}**: ${commandlist[key]}\n`;
      }
      channel.send(output);
      break;
    case "link":
      addLink(channel, args[0], args[1]);
      console.log("command 'link' called");
      break;
    case "viewlinks":
      viewLink(channel);
      console.log("command 'viewlinks' called");
      break;
    case "removelink":
      removeLink(channel, args[0]);
      console.log("command 'removelink' called");
      break;
    case "jointoggle":
      joinToggle(channel, args[0]);
      break;
    case "bottextchannel":
      setBotTextChannel(channel, args[0]);
      break;
    case "join":
      break;
    case "yes":
      break;
    case "no":
      break;
    case "setaccess":
      break;
    case "botdetails":
      botDeatils(channel);
      break;
    case "initialize":
      initializeServer();
  }
}

//alerts console of user's channel switch, mostly useful for debugging
client.on("voiceStateUpdate", (oldState, newState) => {
  //if user joined new channel
  if (newState.channelId) {
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
          console.log("Link request channel");
          user.voice.setChannel(link.voiceChannel);
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
