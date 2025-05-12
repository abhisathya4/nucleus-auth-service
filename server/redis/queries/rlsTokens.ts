/**
 * Redis queries for RLS tokens
 *
 * Defines the API to interact with the redis database for RLS tokens
 */

import { redisRLSTokens } from "..";
import env from "../../lib/config/env";

const generateRLSTokenKey = (user_id: string) => {
  const prefix = "rls:token";
  const key = [prefix, user_id].join(":");
  return key;
};

export const SaveRLSToken = async (
  user_id: string,
  token: string | undefined
) => {
  if (!token) throw new Error("Token is required");
  
  const redisRLSTokensKey = generateRLSTokenKey(user_id);
  await redisRLSTokens.set(
    redisRLSTokensKey,
    token,
    "EX",
    env.AUTH0_ID_TOKEN_EXPIRATION
  );
};

export const GetRLSToken = async (user_id: string) => {
  const redisRLSTokensKey = generateRLSTokenKey(user_id);
  return await redisRLSTokens.get(redisRLSTokensKey);
};

export const DeleteRLSToken = async (user_id: string) => {
  const redisRLSTokensKey = generateRLSTokenKey(user_id);
  await redisRLSTokens.del(redisRLSTokensKey);
};

export const DeleteAllRLSTokens = async () => {
  await redisRLSTokens.flushdb();
};
