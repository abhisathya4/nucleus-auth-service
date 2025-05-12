import Redis from "ioredis";

// In Memory Redis (OTP and App Auth Tokens)
// DB 0: 3rd Party App Auth Tokens
// Apps:
// ----  Kinde
export const redisAPIAuthTokens = new Redis({
  host: process.env.REDIS_OTP_AUTH_HOST!,
  port: parseInt(process.env.REDIS_OTP_AUTH_PORT!),
  db: 0,
  password: process.env.REDIS_OTP_AUTH_SECRET!,
});

// DB 1: OTPs for Nucleus Auth
export const redisOTP = new Redis({
  host: process.env.REDIS_OTP_AUTH_HOST!,
  port: parseInt(process.env.REDIS_OTP_AUTH_PORT!),
  db: 1,
  password: process.env.REDIS_OTP_AUTH_SECRET!,
});

// Persistent Redis (for Invalidated Tokens)
export const redisInvalidatedTokens = new Redis({
  host: process.env.REDIS_INVALIDATED_HOST!,
  port: parseInt(process.env.REDIS_INVALIDATED_PORT!),
  db: 0,
  password: process.env.REDIS_INVALIDATED_SECRET!,
});

// DB 1: User Tokens for RLS
export const redisRLSTokens = new Redis({
  host: process.env.REDIS_INVALIDATED_HOST!,
  port: parseInt(process.env.REDIS_INVALIDATED_PORT!),
  db: 1,
  password: process.env.REDIS_INVALIDATED_SECRET!,
});

redisAPIAuthTokens.on("ready", () => {
  console.log("API Auth Tokens Redis is ready to accept commands.");
});

redisAPIAuthTokens.on("close", () => {
  console.warn("API Auth Tokens Redis connection closed.");
});

redisAPIAuthTokens.on("reconnecting", (delay: any) => {
  console.log(`API Auth Tokens Redis is reconnecting in ${delay}ms.`);
});

redisOTP.on("ready", () => {
  console.log("OTP Redis is ready to accept commands.");
});

redisOTP.on("close", () => {
  console.warn("OTP Redis connection closed.");
});

redisOTP.on("reconnecting", (delay: any) => {
  console.log(`OTP Redis is reconnecting in ${delay}ms.`);
});

redisInvalidatedTokens.on("ready", () => {
  console.log("Persistent Redis is ready to accept commands.");
});

redisInvalidatedTokens.on("close", () => {
  console.warn("Persistent Redis connection closed.");
});

redisInvalidatedTokens.on("reconnecting", (delay: any) => {
  console.log(`Persistent Redis is reconnecting in ${delay}ms.`);
});

redisRLSTokens.on("ready", () => {
  console.log("RLS Tokens Redis is ready to accept commands.");
});

redisRLSTokens.on("close", () => {
  console.warn("RLS Tokens Redis connection closed.");
});

redisRLSTokens.on("reconnecting", (delay: any) => {
  console.log(`RLS Tokens Redis is reconnecting in ${delay}ms.`);
});

