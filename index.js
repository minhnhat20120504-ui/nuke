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

/* ===== GLOBAL CRASH SHIELD ===== */
process.on("unhandledRejection", err => console.error("🔥 Promise:", err));
process.on("uncaughtException", err => console.error("🔥 Exception:", err));
/* ============================== */

/* ===== EXPRESS SERVER ===== */
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h2>Bot Online ✅</h2>
    <form method="POST" action="/invite">
      <input name="client_id" placeholder="Bot Client ID" required />
      <button>Generate Invite</button>
    </form>
  `);
});

app.post("/invite", (req, res) => {
  const { client_id } = req.body;
  const url = `https://discord.com/oauth2/authorize?client_id=${client_id}&scope=bot%20applications.commands&permissions=8`;
  res.send(`<a href="${url}" target="_blank">👉 Add bot</a>`);
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Web server running")
);
/* ============================ */

/* ===== DISCORD CLIENT ===== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});
/* ========================== */

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ===== Slash Command ===== */
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash OK");
  } catch (e) {
    console.error(e);
  }
})();

client.once("ready", () => {
  console.log(`🤖 Online: ${client.user.tag}`);
});

client.login(process.env.BOT_TOKEN);
