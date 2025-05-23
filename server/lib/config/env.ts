const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_AUTHENTICATED_URL: process.env.DATABASE_AUTHENTICATED_URL!,
  // Kinde
  KINDE_DOMAIN: process.env.KINDE_DOMAIN!,
  KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID!,
  KINDE_CLIENT_SECRET: process.env.KINDE_CLIENT_SECRET!,
  KINDE_REDIRECT_URI: process.env.KINDE_REDIRECT_URI!,
  KINDE_LOGOUT_REDIRECT_URI: process.env.KINDE_LOGOUT_REDIRECT_URI!,
  // Auth0
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET!,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID!,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN!,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_REDIRECT_URI: process.env.AUTH0_REDIRECT_URI!,
  AUTH0_RETURN_TO_URL: process.env.AUTH0_RETURN_TO_URL!,
  AUTH0_ID_TOKEN_EXPIRATION: process.env.AUTH0_ID_TOKEN_EXPIRATION!,

  // Auth0 Management
  AUTH0_MANAGEMENT_CLIENT_SECRET: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET!,
  AUTH0_MANAGEMENT_CLIENT_ID: process.env.AUTH0_MANAGEMENT_CLIENT_ID!,
  AUTH0_MANAGEMENT_DOMAIN: process.env.AUTH0_MANAGEMENT_DOMAIN!,
  AUTH0_MANAGEMENT_AUDIENCE: process.env.AUTH0_MANAGEMENT_AUDIENCE!,

  // AES Encryption
  AES_ENCRYPTION_KEY: process.env.AES_ENCRYPTION_KEY!,

  // Ed25519 Keys
  ED25519_SIGNING_KEY: process.env.ED25519_SIGNING_KEY!,
  ED25519_PUBLIC_KEY: process.env.ED25519_PUBLIC_KEY!,

  // Application State
  APPLICATION_STATE:
    process.env.APPLICATION_STATE === "prod"
      ? "prod"
      : ("dev" as "prod" | "dev"),
};

export default env;
