import express from "express";
import { ShardingManager } from "discord.js";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(express.static("public"));

/* ===== Dashboard API: tạo link add bot theo Guild ID ===== */
app.post("/oauth-link", (req, res) => {
  const { guildId } = req.body;
  if (!guildId) return res.status(400).send("❌ Thiếu Guild ID");

  const perms = "8"; // Administrator
  const url = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot&permissions=${perms}&guild_id=${guildId}&disable_guild_select=true`;
  res.json({ url });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Dashboard online")
);

/* ===== Sharding Manager ===== */
const manager = new ShardingManager("./bot.js", {
  token: process.env.BOT_TOKEN,
  totalShards: "auto",
  respawn: true
});

manager.on("shardCreate", shard => {
  console.log(`🚀 Shard ${shard.id} launched`);
});

manager.spawn();
