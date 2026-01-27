import express from "express";
import { ShardingManager } from "discord.js";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/oauth-link", (req, res) => {
  const { guildId } = req.body;
  if (!guildId) return res.status(400).json({ error: "Missing guildId" });

  const url = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot&guild_id=${guildId}&disable_guild_select=true`;
  res.json({ url });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Dashboard online")
);

/* ===== SHARDING ===== */
const manager = new ShardingManager("./bot.js", {
  token: process.env.BOT_TOKEN,
  totalShards: "auto",
  respawn: true
});

manager.on("shardCreate", shard => {
  console.log(`🚀 Shard ${shard.id} launched`);
});

manager.spawn();
