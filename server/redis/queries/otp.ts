import { redisOTP } from "..";

type NucleusUserType = "Customer" | "Vendor" | "Business";

/**
 * Generates a standard key to use for the OTPs DB in Redis
 * @todo Infer typeof userType from some standard to provide consistency
 * @param userType Type of user the key is generated for
 * @param userId Id of the user for which the key is generated for
 * @returns redis db key for user of type userType with id userId
 */
const generateOTPKey = (userType: NucleusUserType, userId: string) => {
  const prefix = "otp";
  const type = userType.toLowerCase();
  const key = [prefix, type, userId].join(":");

  return key;
};

/**
 * Saves an userId - hashedOtp key value pair to redis
 * @param userType
 * @param hashedOtp
 * @param userId
 */
export const SaveOTP = async (
  userType: NucleusUserType,
  hashedOtp: string,
  userId: string
) => {
  try {
    const redisOTPKey = generateOTPKey(userType, userId);
    await redisOTP.set(
      redisOTPKey,
      hashedOtp,
      "EX",
      process.env.OTP_EXPIRATION!
    );
  } catch (e) {
    console.error("Save OTP Error:", e);
  }
};

/**
 * Gets the hashed otp stored for user with type userType and id userId
 * @param userType
 * @param userId
 * @returns hashedOtp
 */
export const GetOTP = async (
  userType: NucleusUserType,
  userId: string
): Promise<string | null> => {
  const redisOTPKey = generateOTPKey(userType, userId);
  const hashedOtp = await redisOTP.get(redisOTPKey);

  return hashedOtp;
};

/**
 * Deletes the key-value pair corresponding to the userId and userType supplied
 * @param userType
 * @param userId
 */
export const DeleteOTP = async (userType: NucleusUserType, userId: string) => {
  const redisOTPKey = generateOTPKey(userType, userId);
  await redisOTP.del(redisOTPKey);
};
