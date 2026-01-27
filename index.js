import { ShardingManager } from "discord.js";
import "dotenv/config";

const manager = new ShardingManager("./bot.js", {
  token: process.env.BOT_TOKEN,
  totalShards: "auto" // Discord tự quyết định số shard tối ưu
});

manager.on("shardCreate", shard => {
  console.log(`🚀 Shard ${shard.id} launched`);
});

manager.spawn();
