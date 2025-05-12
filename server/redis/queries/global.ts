import {
  redisAPIAuthTokens,
  redisInvalidatedTokens,
  redisOTP,
  redisRLSTokens,
} from "..";

export const flushAllRedis = async () => {
  const flushes = [
    redisRLSTokens.flushdb(),
    redisAPIAuthTokens.flushdb(),
    redisInvalidatedTokens.flushdb(),
    redisOTP.flushdb(),
  ];
  await Promise.all(flushes);
  console.log("Flushed all Redis databases");
};
