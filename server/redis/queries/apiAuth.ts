import { redisAPIAuthTokens } from "..";
import { auth0 } from "../../lib/apis/auth0";
import { encryptToken, decryptToken } from "../../lib/utils/tokenUtils";

type APIType = "Auth0 Management" | "Microsoft Graph";

/**
 * Generates a standard key to use for the APIAuths DB in Redis
 * @todo Infer typeof apiType from some standard to provide consistency
 * @param apiType Type of API the key is generated for
 * @returns redis db key for token of type apiType
 */
const generateAPIAuthKey = (apiType: APIType) => {
  const prefix = "api:token";
  const type = apiType.toLowerCase().split(" ");
  const key = [prefix, ...type].join(":");

  return key;
};

/**
 * Saves an apiType - token key value pair to redis
 * @param apiType
 * @param token
 */
export const SaveAPIAuth = async (
  apiType: APIType,
  token: string,
  expiration: string | number
) => {
  try {
    // Encrypt Token
    const encryptedToken = encryptToken(token);

    const redisAPIAuthTokensKey = generateAPIAuthKey(apiType);
    await redisAPIAuthTokens.set(
      redisAPIAuthTokensKey,
      encryptedToken,
      "EX",
      expiration
    );
  } catch (e) {
    console.error("Save APIAuth Error:", e);
  }
};

/**
 * Gets the api:token stored for api with type apiType
 * @param apiType
 * @returns encoded token
 */
export const GetAPIAuth = async (apiType: APIType): Promise<string | null> => {
  const redisAPIAuthTokensKey = generateAPIAuthKey(apiType);
  const encryptedToken = await redisAPIAuthTokens.get(redisAPIAuthTokensKey);
  if (encryptedToken) {
    const token = decryptToken(encryptedToken);
    return token;
  }

  if (apiType === "Auth0 Management") {
    // if token doesn't exist
    const token = await auth0.getToken();
    if (token) {
      return token.access_token;
    }
  }
  return null;
};

/**
 * Deletes the key-value pair corresponding to the apiType supplied
 * @param apiType
 */
export const DeleteAPIAuth = async (apiType: APIType) => {
  const redisAPIAuthTokensKey = generateAPIAuthKey(apiType);
  await redisAPIAuthTokens.del(redisAPIAuthTokensKey);
};
