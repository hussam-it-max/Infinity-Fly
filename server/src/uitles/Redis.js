import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const redis = new Redis(
  "rediss://default:" + process.env.UPSTASH_REDIS_REST_TOKEN + "@flying-eft-41803.upstash.io:6379",
);

export default redis;
