const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  Permissions,
  ActivityType,
} = require(`discord.js`);
const { token } = require("./config.json");
const Sequelize = require("sequelize"); //local database
const prefix = "$";

/* xxxxxxxxxxxxxxxxxxxx Mutatable constants xxxxxxxxxxxxxxxxxxxx */
const botCommandsTextChannel = "417051296479182859";
const voiceChannel = {
  Fortnite: "749072919329636442",
  "Rocket League": "816850966401908758",
  "Grand Theft Auto": "816851523299835954",
  Minecraft: "817082193897717821",
  Wizard101: "817081411805773855",
  "Codey-boys": "1027025370530185297",
  "The Closet": "816852787862044672",
  General: "690735847108116491",
};
const games = {
  Wizard101: "",
};
/* xxxxxxxxxxxxxxxxxxxx Mutatable constants xxxxxxxxxxxxxxxxxxxx */

const commandlist = {
  ethan: `' ${prefix}ethan <noun> '\n    Have the bot call Ethan names`,
  help: `' ${prefix}help '\n    You used this command to get here, you are either dumb or super meta...`,
  bottextchannel: `' ${prefix}botTextChannel <Text Channel Name> '\n    Use to configure which channel Nuetool sends texts to.\n    Leave blank to set to any channel / whichever channel you called it from.`,
  setaccess: `' ${prefix}setAdmin <Role> '\n    Use to set which roles can access Nuetool setup commands.\n    Leave blank for default (Server Owner)`,
  link: `' ${prefix}link <Game> <Voice Channel Name> '\n    Link a specific video game to a specific channel. \n    Users will automatically switch to that channel if they are in a voice channel before they start the game.\n    Type Game and Voice Channel exactly as is, if either contain multiple words, surround title in quotations " . "\n    You can only link one Voice Channel per game, but multiple games can be linked to the same Voice Channel.`,
  viewlinks: `' ${prefix}viewLinks '\n    View current Voice Channel and Game links`,
  removelink: `' ${prefix}removeLink <Game> '\n    Remove Voice Channel link from Game.\n    Type Game exactly as is, if Game contains multiple words, surround in quotations " . "`,
  jointoggle: `' ${prefix}joinToggle <true | false> '\n    Toggle whether users can use the join command to join a server they otherwise would not have access to.`,
  join: `' ${prefix}join <Voice Channel Name> '\n    Sends request to users in a targeted voice channel to join.\n    Request is auto approved if no action is taken within 3 minutes.`,
  yes: `' ${prefix}yes '\n    Accepts join request to last person to send a request to join voice channel you are currently in.`,
  no: `' ${prefix}no '\n    Denies join request to last person to send a request to join voice channel you are currently in.`,
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

client.on("ready", () => {
  console.log("Bot is moovin and groovin");
  client.user.setActivity("Ready to buck some fitches up!", {
    type: ActivityType.Playing,
  });
  ChannelLinks.sync();
});

const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "database.sqlite",
});

const ChannelLinks = sequelize.define("tags", {
  game: {
    type: Sequelize.STRING,
    unique: true,
  },
  voiceChannel: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

async function addLink(channel, game, voice) {
  try {
    // equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
    const link = await ChannelLinks.create({
      game: game,
      voiceChannel: voice,
    });
    channel.send(`Link ${link.game} -> ${link.voiceChannel} added.`);
  } catch (error) {
    if (error.game === "SequelizeUniqueConstraintError") {
      channel.send("That game is already connected to a Voice Channel.");
    } else if (error.voiceChannel === "SequelizeUniqueConstraintError") {
      channel.send("That Voice Channel is already connected to a game.");
    }
    channel.send("Something went wrong with adding a link.");
  }
}

async function viewLink(channel) {
  const links = await ChannelLinks.findAll();
  const tagString =
    links
      .map((l) => `Game: "${l.game}" -> Voice Channel: "${l.voiceChannel}"`)
      .join("\n") || "No Links set.";
  channel.send(tagString);
  console.log(tagString);
}

async function removeLink(channel, name) {
  const remove = await ChannelLinks.destroy({ where: { game: name } });
  if (!remove) {
    channel.send(`No valid game link under the game "${name}"`);
  } else {
    channel.send(`Removed ${name} link`);
  }
}

//functions when any message is sent, filters for commands, runs command.
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
    case "help":
      var output = "Available commands list:\n";
      for (let key in textCommandlist) {
        output += `**${key}**: ${textCommandlist[key]}\n`;
      }
      for (let key in actionCommandlist) {
        output += `**${key}**: ${actionCommandlist[key]}\n`;
      }
      channel.send(output);
      break;
    case "link":
      addLink(channel, args[0], args[1]);
      console.log("command link called");
      break;
    case "viewlinks":
      viewLink(channel);
      console.log("command viewlinks called");
      break;
    case "removelink":
      removeLink(channel, args[0]);
      console.log("command removelink called");
      break;
    case "ethan":
      channel.send(`Ethan is a ${args.join(" ")}`);
      break;
  }
}

//alerts console of user's channel switch
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

client.on("presenceUpdate", (oldState, newState) => {
  const user = newState.member;
  //detects if user is currently in a channel
  if (user.voice.channel) {
    //user started activity
    if (user.presence.activities.length != 0) {
      //user activity is of "Playing" type
      if (user.presence.activities[0].type == ActivityType.Playing) {
        console.log(
          `${user.nickname} started playing ${user.presence.activities}`
        );
        let newChannel = voiceChannel[user.presence.activities];
        //move user to appropriate channel
        user.voice.setChannel(newChannel);
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
