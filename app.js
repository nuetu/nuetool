const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  Permissions,
  ActivityType,
} = require(`discord.js`);
const { token } = require("./config.json");
const prefix = "*";

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

const textCommandlist = {
  lucas: "https://chuddy.dev",
  ethan: "EthanElfGamer",
  ben: "Your Captian",
  help: "You used this command to get here, you are either dumb or super meta...",
};

const actionCommandlist = {
  botTextChannel: `' ${prefix}botTextChannel <Text Channel Name> 'Use to configure which channel Nuetool sends texts to. Leave blank to set to any channel / whichever channel you called it from.`,
  setAccess: `' ${prefix}setAdmin <Role> 'Use to set which roles can access Nuetool setup commands. Leave blank for default (Server Owner)`,
  link: `' ${prefix}link <Game> <Voice Channel Name> 'Link a video game to a specific channel. Users will automatically switch to that channel if they are in a voice channel before they start the game.`,
  joinToggle: `' ${prefix}joinToggle <true | false> 'Toggle whether users can use the join command to join a server they otherwise would not have access to.`,
  join: `' ${prefix}join <Voice Channel Name> 'Sends request to users in a targeted voice channel to join. Request is auto approved if no action is taken within 3 minutes.`,
  yes: `' ${prefix}yes 'Accepts join request to last person to send a request to join voice channel you are currently in.`,
  no: `' ${prefix}no 'Denies join request to last person to send a request to join voice channel you are currently in`,
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
});

//functions when any message is sent
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return; //check for texts that start with designated prefix

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase(); //returns requested command name

  if (command in textCommandlist || command in actionCommandlist) {
    runCommand(command, message.channel);
  }
});

function runCommand(command, channel) {
  channel.send(textCommandlist[command]);
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
