import { ShardingManager } from "discord.js";
import "dotenv/config";

const manager = new ShardingManager("./bot.js", {
  token: process.env.BOT_TOKEN,
  totalShards: "auto",
  respawn: true
});

manager.on("shardCreate", shard => {
  console.log(`🚀 Shard ${shard.id} launched`);
});

manager.spawn();
