const { Client, Intents } = require('discord.js');
const config = require('./config.json');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  ],
});
client.login(config.botToken);

client.on('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);
    const guild = client.guilds.resolve(config.guildId);
    if (!guild)
      throw new Error(`Could not find guild with the id ${config.guildId}`);

    const channel = guild.channels.resolve(config.channelId);
    if (!channel)
      throw new Error(`Could not find channel with id ${config.channelId}`);
    if (!channel.isText()) throw new Error('Channel is not a text channel');

    await channel.messages.fetch();
    const message = channel.messages.resolve(config.messageId);
    if (!message)
      throw new Error(`Could not find message with id ${config.messageId}`);

    const reactions = message.reactions.cache;
    const reaction = reactions.at(0);
    const userdata = await reaction.users.fetch();
    await guild.members.fetch();

    // we have eligible users
    const users = userdata
      .filter((u) => {
        const guild_member = guild.members.resolve(u.id);
        if (!guild_member) return false;

        const joined = guild_member.joinedTimestamp;
        const cutoff = new Date(2021, 11, 12, 00, 00, 00);
        return joined < cutoff;
      })
      .map((u) => ({ id: u.id, username: u.username }));

    // get prizes
    const prizeMessage = channel.messages.resolve(config.prizeMessageId);
    let prizes = prizeMessage.content.split('\n');
    prizes = prizes.slice(1, prizes.length);

    // get winners
    const alreadyWon = [];
    const winners = prizes.map((prize) => {
      let winner = null;
      while (!winner) {
        const randomNumber = Math.floor(Math.random() * users.length);
        const randomMember = users[randomNumber];

        if (alreadyWon.includes(randomMember.id)) continue;

        winner = randomMember;
        alreadyWon.push(winner.id);
      }

      return { prize, ...winner };
    });

    const winnermessage = winners.map(w => `Prize: ${w.prize}\nWinner: ${w.username} (<@${w.id}>)\n`).join("\n");
    console.log(winnermessage);
  } catch (err) {
    console.error(err.message);
  } finally {
    client.destroy();
  }
});
