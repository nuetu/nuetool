const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField,
  Permissions,
} = require(`discord.js`);
const { token } = require("./config.json");
const prefix = "*";

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
  ],
});

client.on("ready", () => {
  console.log("Bot is moovin and groovin");
  client.user.setActivity("Ready to buck some fitches up!", {
    type: "PLAYING",
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

client.login(token);
