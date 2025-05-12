import { redisInvalidatedTokens } from "..";

type TokenType = "Nucleus Auth";

/**
 * Generates a standard key to use for the OTPs DB in Redis
 * @todo Infer typeof tokenType from some standard to provide consistency
 * @param tokenType Type of token the key is generated for
 * @param encodedToken Id of the token for which the key is generated for
 * @returns redis db key for token of type tokenType with value token
 */
const generateInvalidatedTokenKey = (
  tokenType: TokenType,
  encodedToken: string
) => {
  const prefix = "invalidated";
  const type = tokenType.toLowerCase().split(" ");
  const key = [prefix, ...type, encodedToken].join(":");

  return key;
};

/**
 * Invalidates a token by saving it in redis
 * @param tokenType
 * @param encodedToken
 */
export const InvalidateToken = async (
  tokenType: TokenType,
  encodedToken: string
) => {
  try {
    const redisInvalidatedTokenKey = generateInvalidatedTokenKey(
      tokenType,
      encodedToken
    );
    await redisInvalidatedTokens.set(redisInvalidatedTokenKey, "true");
  } catch (e) {
    console.error("Save Invalidated Token Error:", e);
  }
};

/**
 * Checks if the supplied encoded token is invalidated
 * @param tokenType
 * @param encodedToken
 * @returns true if token invalidated false otherwise
 */
export const CheckTokenInvalidated = async (
  tokenType: TokenType,
  encodedToken: string
): Promise<boolean> => {
  const redisInvalidatedTokenKey = generateInvalidatedTokenKey(
    tokenType,
    encodedToken
  );
  const isTrue = await redisInvalidatedTokens.get(redisInvalidatedTokenKey);

  return isTrue !== null;
};

/**
 * Deletes the invalidated token from redis
 * @param tokenType
 * @param userId
 */
export const DeleteOTP = async (tokenType: TokenType, encodedToken: string) => {
  const redisInvalidatedTokenKey = generateInvalidatedTokenKey(
    tokenType,
    encodedToken
  );
  await redisInvalidatedTokens.del(redisInvalidatedTokenKey);
};
