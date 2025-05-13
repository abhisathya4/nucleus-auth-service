import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { hexToBytes } from "@noble/hashes/utils";

ed25519.etc.sha512Sync = sha512;

export class RLSTokenManager {
  private signingKeyBytes: Uint8Array;
  private publicKeyBytes: Uint8Array;

  // Store the JWK as an object instead of a string
  private jwk: any = null;

  private auth0Domain: string | null = null;
  private auth0Audience: string | null = null;
  private auth0JwksClientInstance: jwksClient.JwksClient | null = null;
  private auth0PublicKey: string | null = null;

  // TODO: Support these if needed
  private awsCognitoDomain: string | null = null;
  private awsCognitoAudience: string | null = null;

  private clerkDomain: string | null = null;
  private clerkAudience: string | null = null;

  private kindeDomain: string | null = null;
  private kindeAudience: string | null = null;

  constructor(ed25519SigningKeyHex: string, ed25519PublicKeyHex: string) {
    try {
      this.signingKeyBytes = hexToBytes(ed25519SigningKeyHex);
      this.publicKeyBytes = hexToBytes(ed25519PublicKeyHex);
    } catch {
      throw new Error("Invalid Ed25519 key format. Must be valid hex.");
    }
  }

  public async init(
    authDomain: string,
    authAudience: string,
    authProvider: "Auth0" | "AWS Cognito" | "Clerk" | "Kinde"
  ) {
    switch (authProvider) {
      case "Auth0":
        this.auth0Domain = authDomain;
        this.auth0Audience = authAudience;
        this.auth0JwksClientInstance = jwksClient({
          jwksUri: `https://${authDomain}/.well-known/jwks.json`,
        });
        // Initialize our own Ed25519 JWK instead of trying to use Auth0's RSA key
        this.jwk = this.generateEd25519JWK();
        break;
      case "AWS Cognito":
        this.awsCognitoDomain = authDomain;
        this.awsCognitoAudience = authAudience;
        break;
      case "Clerk":
        this.clerkDomain = authDomain;
        this.clerkAudience = authAudience;
        break;
      case "Kinde":
        this.kindeDomain = authDomain;
        this.kindeAudience = authAudience;
        break;
      default:
        throw new Error("Unsupported auth provider");
    }

    return this;
  }

  public get Jwk() {
    // Return the JWK as a string if needed
    return this.jwk ? JSON.stringify(this.jwk) : null;
  }

  /**
   * Generate an Ed25519 JWK from our public key
   */
  private generateEd25519JWK() {
    // Convert the public key to base64url format
    const publicKeyBase64 = Buffer.from(this.publicKeyBytes).toString(
      "base64url"
    );

    return {
      kty: "OKP",
      crv: "Ed25519",
      x: publicKeyBase64,
      use: "sig",
      alg: "EdDSA",
    };
  }

  private async getAuth0SigningKey(kid: string): Promise<string> {
    if (!this.auth0JwksClientInstance) {
      throw new Error("Auth0 JWK client not initialized");
    }

    const key = await this.auth0JwksClientInstance.getSigningKey(kid);
    if (!key) throw new Error("Failed to retrieve Auth0 signing key");

    this.auth0PublicKey = key.getPublicKey();
    return this.auth0PublicKey;
  }

  private async verifyAuth0Token(authToken: string): Promise<jwt.JwtPayload> {
    const [headerB64] = authToken.split(".");
    if (!headerB64) throw new Error("Invalid token");

    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const auth0Key = await this.getAuth0SigningKey(header.kid);

    const payload = jwt.verify(authToken, auth0Key, {
      algorithms: ["RS256"],
      audience: this.auth0Audience!,
      issuer: `https://${this.auth0Domain!}/`,
    });

    return payload as jwt.JwtPayload;
  }

  public async createSecureDbToken(
    authToken: string,
    authProvider: "Auth0" | "AWS Cognito" | "Clerk" | "Kinde"
  ): Promise<string> {
    try {
      let payload: jwt.JwtPayload;

      switch (authProvider) {
        case "Auth0":
          payload = await this.verifyAuth0Token(authToken);
          break;
        default:
          throw new Error(`${authProvider} is not yet implemented`);
      }

      const dbTokenPayload = {
        sub: payload.sub,
        jti: crypto.randomUUID(),
        role: payload.role || payload["https://nucleus-platform.com/roles"],
        exp: payload.exp,
        nbf: payload.nbf || Math.floor(Date.now() / 1000),
        tenant_id:
          payload.tenant_id ||
          payload["https://nucleus-platform.com/tenant_id"],
      };

      return await this.signJwtWithEd25519(dbTokenPayload);
    } catch (err) {
      console.error("Token creation failed:", err);
      throw new Error("Authentication failed");
    }
  }

  private async signJwtWithEd25519(payload: object): Promise<string> {
    const header = {
      alg: "EdDSA",
      typ: "JWT",
      // Include the key ID if you have multiple signing keys
      kid: "db-token-signer-1",
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );

    const message = `${headerB64}.${payloadB64}`;
    const messageBytes = new TextEncoder().encode(message);

    const signature = await ed25519.signAsync(
      messageBytes,
      this.signingKeyBytes
    );
    const signatureB64 = Buffer.from(signature).toString("base64url");

    return `${message}.${signatureB64}`;
  }
}
