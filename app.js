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

const list = {
  lucas: "https://chuddy.dev",
  ethan: "EthanElfGamer",
  ben: "Your Captian",
  help: "To use a command, type out an asterisk before one of the following words:\nhelp - displays command list, although you are already here (meta af)\nlucas - lucas stuff\nethan - alienelf-gainer?\nben - i made this bot, expect something stupid",
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
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);

  const command = args.shift().toLowerCase();

  const messageArray = message.content.split(" ");
  const argument = message.content.slice(1);
  const cmd = messageArray[0];

  if (command in list) {
    message.channel.send(list[command]);
  }
});

/* client.on("voiceStateUpdate", (oldState, newState) => {
  if (newState.channelId) {
    //joined channel
    if (oldState.channelId !== null) {
      //moved channel
      client.channels
        .fetch("417051296479182859")
        .then((channel) =>
          channel.send(
            `${newState.member.nickname} switched to ${newState.channel.name}!`
          )
        );
    }
  } else {
    //if user leaves the channel
  }
}); */

client.on("presenceUpdate", (oldState, newState) => {
  const user = newState.member;
  if (user.presence.activities.length != 0) {
    //user started activity
    if (user.presence.activities[0].type == ActivityType.Playing) {
      //user activity is Playing type
      console.log(
        `${user.nickname} started playing ${user.presence.activities}`
      );
      let newChannel = voiceChannel[user.presence.activities];
      user.voice.setChannel(newChannel);
    }
  } else {
    //user stops activity
  }
});
client.login(token);
