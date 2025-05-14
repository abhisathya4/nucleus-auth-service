import puppeteer, { Page, Browser } from "puppeteer";
import env from "../../lib/config/env";
import type { TestAuth0Mgmt } from "./auth0";
import jwt from "jsonwebtoken";

const {
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_DOMAIN,
  AUTH0_REDIRECT_URI,
  AUTH0_RETURN_TO_URL,
} = env;

export class TestUserAuth {
  private idToken: string | null = null;
  private accessToken: string | null = null;
  private userId: string | null = null;
  private auth_session_cookie: string | null = null;

  // Puppeteer launch options for Docker compatibility
  private readonly puppeteerOptions = {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  };

  constructor(private mgmtClient: TestAuth0Mgmt) {}

  /**
   * Simulates a user logging in through Auth0
   */
  public async simulateUserLogin(params: {
    username: string;
    password: string;
    orgName: string;
  }) {
    const browser: Browser = await puppeteer.launch(this.puppeteerOptions);
    const page: Page = await browser.newPage();

    try {
      // Setup and configure the page
      this.setupPageLogging(page);
      page.setDefaultTimeout(60000);

      // Handle authentication flow
      await this.navigateToLoginPage(page);
      await this.handleUsernameInput(page, params.username);
      await this.handlePasswordInput(page, params.password);

      // Handle post-login redirects if needed
      await this.handlePostLoginFlow(page, params.orgName);

      // Collect and return authentication data
      return this.collectAuthData();
    } catch (error) {
      console.error("Error during login process:", error);
      throw error;
    } finally {
      await browser.close();
      console.log("Browser closed");
    }
  }

  /**
   * Simulates user logout through Auth0
   */
  public async simulateUserLogout() {
    const browser: Browser = await puppeteer.launch(this.puppeteerOptions);
    const page: Page = await browser.newPage();

    try {
      // Construct the logout URL
      const logoutUrl = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
      logoutUrl.searchParams.set("client_id", AUTH0_CLIENT_ID);
      logoutUrl.searchParams.set("returnTo", AUTH0_RETURN_TO_URL);

      // Navigate to the logout URL
      console.log("Navigating to logout URL:", logoutUrl.toString());
      await page.goto(logoutUrl.toString(), {
        waitUntil: "networkidle0",
        timeout: 60000,
      });

      // Take a screenshot for debugging
      await page.screenshot({ path: "auth0-logout-page.png" });

      console.log("Logged out successfully via browser");
      this.idToken = null;
      this.userId = null;
      this.accessToken = null;
      return true;
    } catch (error) {
      console.error("Puppeteer Logout Error:", error);
      throw error;
    } finally {
      // Always close the browser to prevent resource leaks
      await browser.close();
      console.log("Browser closed after logout");
    }
  }

  /**
   * Initialize a TestUserAuth instance
   */
  public static async init(mgmtClient: TestAuth0Mgmt) {
    const userAuth = new TestUserAuth(mgmtClient);
    console.log("Initializing TestUserAuth...");
    const { username, password } =
      userAuth.mgmtClient.User.getTestUserCredentials();
    const testOrgName =
      userAuth.mgmtClient.Organization.getTestOrganizationName();
    console.log(`Logging in as ${username}...`);
    await userAuth.simulateUserLogin({
      username,
      password,
      orgName: testOrgName,
    });
    console.log("TestUserAuth initialized successfully");
    return userAuth;
  }

  /**
   * Get the ID token, throw if not available
   */
  public get id_token() {
    if (!this.idToken) {
      throw new Error("ID token not initialized");
    }
    return this.idToken;
  }

  /**
   * Get the user ID
   */
  public get user_id() {
    if (!this.userId) {
      throw new Error("User ID not initialized");
    }
    return this.userId;
  }

  /**
   * Get the access token
   */
  public get access_token() {
    return this.accessToken;
  }

  /**
   * Reset tokens
   */
  public reset() {
    this.idToken = null;
    this.userId = null;
    this.accessToken = null;
  }

  // Helper methods for login flow
  private setupPageLogging(page: Page) {
    page.on("console", (msg) => console.log("Browser console:", msg.text()));
    page.on("requestfailed", (request) => {
      console.log(`Request failed: ${request.url()}`);
    });
  }

  private buildAuthUrl(redirectPath = AUTH0_REDIRECT_URI) {
    const authUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", AUTH0_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectPath);
    authUrl.searchParams.set("scope", "openid profile email offline_access");
    if (AUTH0_AUDIENCE) authUrl.searchParams.set("audience", AUTH0_AUDIENCE);

    // Add state parameter for security
    const state = Math.random().toString(36).substring(2);
    authUrl.searchParams.set("state", state);

    return authUrl;
  }

  private async navigateToLoginPage(
    page: Page,
    redirectPath = AUTH0_REDIRECT_URI
  ) {
    const authUrl = this.buildAuthUrl(redirectPath);
    console.log("Auth URL:", authUrl.toString());
    console.log("Navigating to Auth0 login page...");
    await page.goto(authUrl.toString(), { waitUntil: "networkidle0" });
    await this.takeDebugScreenshot(page, "auth0-login-page.png");
  }

  private async handleUsernameInput(page: Page, username: string) {
    console.log("Waiting for username field...");
    await page.waitForSelector('input[name="username"], input[type="email"]', {
      visible: true,
    });

    console.log("Entering username:", username);
    await page.type('input[name="username"], input[type="email"]', username);

    await this.takeDebugScreenshot(page, "auth0-username-entered.png");
    await this.clickButton(
      page,
      [
        'button[type="submit"]',
        "button.auth0-lock-submit",
        'button[name="submit"]',
        'button:contains("Continue")',
        'button:contains("Next")',
        "button.c-button",
      ],
      "continue button"
    );

    await this.takeDebugScreenshot(page, "auth0-after-continue.png");
  }

  private async handlePasswordInput(page: Page, password: string) {
    console.log("Waiting for password field...");
    await page.waitForSelector(
      'input[name="password"], input[type="password"]',
      { visible: true }
    );

    console.log("Entering password...");
    await page.type('input[name="password"], input[type="password"]', password);

    await this.takeDebugScreenshot(page, "auth0-password-entered.png");
    await this.clickButton(
      page,
      [
        'button[type="submit"]',
        "button.auth0-lock-submit",
        'button[name="submit"]',
        'button:contains("Log in")',
        'button:contains("Sign in")',
        'button:contains("Login")',
        "button.c-button",
      ],
      "login button"
    );
  }

  private async handlePostLoginFlow(page: Page, orgName: string) {
    // Handle redirects with a maximum number of attempts
    let redirectCount = 0;
    const maxRedirects = 5;
    let finalCode: string | null = null;

    while (redirectCount < maxRedirects) {
      await this.takeDebugScreenshot(
        page,
        `auth0-redirect-${redirectCount}.png`
      );
      const currentUrl = page.url();
      console.log(`Current URL after redirect ${redirectCount}:`, currentUrl);

      // Check if we have an error in the URL
      const urlObj = new URL(currentUrl);
      const errorParam = urlObj.searchParams.get("error");

      // Success case - reached home page
      if (currentUrl.includes("/home")) {
        console.log("Redirected to home page, login successful");
        await this.saveCookies(page);
        finalCode = "success_redirect_to_home";
        break;
      }

      if (errorParam) {
        const errorDescription = urlObj.searchParams.get("error_description");
        console.error("Auth0 returned an error:", errorParam, errorDescription);
        throw new Error(`Auth0 error: ${errorParam} - ${errorDescription}`);
      }

      // Handle different auth flows
      if (currentUrl.includes("/u/organization")) {
        await this.handleOrganizationSelection(page, orgName, redirectCount);
      } else if (currentUrl.includes("/u/consent")) {
        await this.handleConsentPage(page, redirectCount);
      } else {
        console.log("Not on a recognized auth page. Breaking loop.");
        break;
      }

      redirectCount++;
    }

    // Check for successful authentication
    if (!finalCode && !this.auth_session_cookie) {
      console.error(
        "No authorization code received and no cookies saved after all redirects"
      );
      throw new Error(
        `Authentication failed. No code or cookies received after ${maxRedirects} redirects.`
      );
    }
  }

  private async handleOrganizationSelection(
    page: Page,
    orgName: string,
    redirectCount: number
  ) {
    console.log("On organization selection page. Entering org name:", orgName);

    try {
      // Wait for the organization input field
      await page.waitForSelector('input[name="organizationName"]', {
        timeout: 10000,
      });

      // Clear any existing text in the field
      await page.evaluate(() => {
        const input = document.querySelector(
          'input[name="organizationName"]'
        ) as HTMLInputElement;
        if (input) input.value = "";
      });

      // Type the organization name
      await page.type('input[name="organizationName"]', orgName);
      await this.takeDebugScreenshot(
        page,
        `auth0-org-input-${redirectCount}.png`
      );

      // Try to submit the form
      const submitted = await this.clickButton(
        page,
        [
          'button[type="submit"]',
          'button:contains("Continue")',
          'button:contains("Submit")',
          "button.c-button",
          "button.primary",
        ],
        "organization submit button",
        false
      );

      // If no button found, try using Enter key
      if (!submitted) {
        console.log("No submit button found, trying Enter key");
        await page.focus('input[name="organizationName"]');
        await Promise.all([
          page
            .waitForNavigation({
              waitUntil: "networkidle0",
              timeout: 30000,
            })
            .catch((e) =>
              console.log(
                "Navigation after Enter key may have completed:",
                e.message
              )
            ),
          page.keyboard.press("Enter"),
        ]);
      }

      // Check if still on organization page (might be an error)
      await this.checkForOrganizationErrors(page);
    } catch (e: any) {
      console.error("Error handling organization selection:", e);
      throw new Error(`Failed to select organization: ${e.message}`);
    }
  }

  private async checkForOrganizationErrors(page: Page) {
    const newUrl = page.url();
    if (newUrl.includes("/u/organization")) {
      // Check for an error message
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector(
          ".error-message, .c35d21d96, .alert-error"
        );
        return errorElement ? errorElement.textContent : null;
      });

      if (errorText) {
        console.error("Organization error:", errorText);
        throw new Error(`Organization selection failed: ${errorText}`);
      }

      console.log("Still on organization page, trying one more time...");
      await page.focus('input[name="organizationName"]');
      await page.keyboard.press("Enter");
    }
  }

  private async handleConsentPage(page: Page, redirectCount: number) {
    console.log("On consent page, accepting...");
    await this.takeDebugScreenshot(page, `auth0-consent-${redirectCount}.png`);

    try {
      await this.clickButton(
        page,
        [
          'button[type="submit"]',
          "button.primary",
          'button:contains("Accept")',
          'button:contains("Allow")',
          "button.c-button-primary",
        ],
        "consent button"
      );
    } catch (e: any) {
      console.error("Error handling consent page:", e);
      throw new Error(`Failed to accept consent: ${e.message}`);
    }
  }

  private collectAuthData() {
    // Look for token cookies if we don't have explicit tokens
    if (!this.idToken || !this.accessToken || !this.userId) {
      this.checkForTokenCookies();
    }

    // Return authentication data
    return {
      id_token: this.idToken,
      access_token: this.accessToken,
      auth_session_cookie: this.auth_session_cookie,
      user_id: this.userId,
    };
  }

  private checkForTokenCookies() {
    console.log("Successfully logged in and redirected to home page");

    let foundTokens = false;

    if (this.auth_session_cookie) {
      console.log(`Found potential token cookie: auth_session`);
      foundTokens = true;
    }

    if (!foundTokens) {
      console.log(
        "No auth session cookie found. Your application might store them differently."
      );
      console.log("Available cookies:", this.auth_session_cookie);
    }
  }

  // Utility methods
  private async clickButton(
    page: Page,
    selectors: string[],
    buttonType: string,
    throwIfNotFound: boolean = true
  ): Promise<boolean> {
    console.log(`Looking for ${buttonType}...`);

    for (const selector of selectors) {
      try {
        if ((await page.$(selector)) !== null) {
          console.log(`Found ${buttonType} with selector: ${selector}`);

          await Promise.all([
            page
              .waitForNavigation({
                waitUntil: "networkidle0",
                timeout: 30000,
              })
              .catch((e) =>
                console.log("Navigation may have completed:", e.message)
              ),
            page.click(selector),
          ]);

          return true;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found or not clickable`);
      }
    }

    if (throwIfNotFound) {
      console.error(
        `Could not find the ${buttonType}. Taking screenshot for debugging.`
      );
      await this.takeDebugScreenshot(
        page,
        `auth0-${buttonType.replace(/\s+/g, "-")}-not-found.png`
      );
      throw new Error(`${buttonType} not found`);
    }

    return false;
  }

  private async takeDebugScreenshot(page: Page, filename: string) {
    await page.screenshot({ path: filename });
    console.log(`Screenshot saved: ${filename}`);
  }

  private async saveCookies(page: Page) {
    const cookies = await page.cookies();
    console.log("Cookies retrieved:", cookies.length);

    this.auth_session_cookie =
      cookies.find((cookie) => cookie.name === "auth_session")?.value || null;

    if (this.auth_session_cookie) {
      const decoded = jwt.decode(this.auth_session_cookie) as any;
      console.log("Decoded auth session cookie:", decoded);
      this.idToken = decoded.id_token;
      this.accessToken = decoded.accessToken;
      this.userId = decoded.user.sub;
    }
  }

  public get session_cookie() {
    return this.auth_session_cookie;
  }
}
