/*
  Purpose:
  Centralize all authentication-related actions and middleware.

  This file handles:
  - User authentication (magic link)
  - JWT creation and verification
  - Authentication cookie management

  This file intentionally does NOT:
  - Handle routing concerns (handled by authRoutes)
  - Implement authorization logic (handled elsewhere)

  Security model:
  - Stateless authentication via JWT stored in HttpOnly cookies
  - Medium-lived tokens (7 days)
*/

import crypto from "node:crypto";
import type { CookieOptions, RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";

import { serverEnv } from "../../../env/server";
import userRepository from "../user/userRepository";
import authRepository from "./authRepository";

/*
  Extend Express Request to carry authenticated user data.
  This is populated exclusively by verifyAccessToken.
*/
declare global {
  namespace Express {
    interface Request {
      me: User;
    }
  }
}

/* ************************************************************************ */
/* Security options                                                         */
/* ************************************************************************ */

const magicLinkTimeout = 15 * 60 * 1000; // 15 minutes

/*
  Cookie configuration for authentication token.

  Notes:
  - HttpOnly: inaccessible to JavaScript
  - SameSite=strict: mitigates CSRF
  - Secure: HTTPS only
*/
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/*
  Minimal JWT wrapper to:
  - Encapsulate signing and verification
  - Enforce payload typing between sign and verify methods
*/
class TokenSigner<Payload extends JwtPayload | string = JwtPayload> {
  #secret: string;

  constructor(secret: string) {
    this.#secret = secret;
  }

  signSession(payload: Payload): string {
    return jwt.sign(payload, this.#secret, { expiresIn: cookieOptions.maxAge });
  }

  verify(token: string): Payload {
    return jwt.verify(token, this.#secret) as Payload;
  }
}

const tokenSigner = new TokenSigner(serverEnv.APP_SECRET);

const transporter = serverEnv.SMTP_URL
  ? nodemailer.createTransport({
      url: serverEnv.SMTP_URL,
      ...(serverEnv.DKIM_PRIVATE_KEY &&
        serverEnv.DKIM_DOMAIN && {
          dkim: {
            domainName: serverEnv.DKIM_DOMAIN,
            keySelector: serverEnv.DKIM_SELECTOR,
            privateKey: serverEnv.DKIM_PRIVATE_KEY,
          },
        }),
    })
  : null;

const trustedBaseUrl = serverEnv.APP_BASE_URL.replace(/\/+$/, "");

/* ************************************************************************ */
/* Actions                                                                  */
/* ************************************************************************ */

/*
  Send a magic link to the user's email.

  Response:
  - 204 on success
*/
const sendMagicLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.sendStatus(400);
    return;
  }

  // Find or create user ID
  const userId = userRepository.findByEmailOrCreate(email);

  // Generate opaque token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Store in DB
  const expiresAt = new Date(Date.now() + magicLinkTimeout);
  authRepository.insertOrReplaceToken(userId, tokenHash, expiresAt);

  const magicLink = `${trustedBaseUrl}/verify?token=${rawToken}`;

  if (transporter) {
    await transporter.sendMail({
      from: "starter@mail.com",
      to: email,
      subject: "Login link",
      html: `<a href="${magicLink}">Click here to login</a>`,
    });
  } else {
    console.info("----------------------------------------------------------");
    console.info(`Magic Link for ${email}:`);
    console.info(magicLink);
    console.info("----------------------------------------------------------");
  }

  res.sendStatus(204);
};

/* ************************************************************************ */

/*
  Authenticate an existing user and issue an access token.

  Response:
  - 201 with user
  - 401 on error
*/
const verifyMagicLink: RequestHandler = (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    res.sendStatus(400);
    return;
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const storedToken = authRepository.findByHash(tokenHash);

    if (storedToken == null) {
      throw new Error("Invalid token");
    }

    if (storedToken.consumed_at != null) {
      throw new Error("Token already consumed");
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      throw new Error("Token expired");
    }

    // Mark as consumed
    authRepository.markAsConsumed(storedToken.user_id);

    const user = userRepository.find(storedToken.user_id);

    if (user == null) {
      throw new Error("User not found");
    }

    const sessionToken = tokenSigner.signSession({ sub: user.id.toString() });

    res.cookie("__Host-auth", sessionToken, cookieOptions);

    res.status(201).json(user);
  } catch {
    res.sendStatus(401);
  }
};

/* ************************************************************************ */

/*
  Destroy the authentication cookie.

  Notes:
  - Stateless logout: token invalidation relies on expiration
*/
const destroyAccessToken: RequestHandler = (_req, res) => {
  res.clearCookie("__Host-auth", cookieOptions);

  res.sendStatus(204);
};

/* ************************************************************************ */
/* Middleware                                                               */
/* ************************************************************************ */

/*
  Verify the access token from cookies and attach the user to req.me.

  Preconditions:
  - Cookie parser has already run

  Response:
  - 401 if token is missing or invalid
*/
const verifyAccessToken: RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies["__Host-auth"];

    if (token == null) {
      throw new Error("Access token is missing in cookies");
    }

    const payload = tokenSigner.verify(token);

    const me = userRepository.find(Number(payload.sub));

    if (me == null) {
      throw new Error("User not found");
    }

    // Refresh cookie (extends expiration)
    const freshToken = tokenSigner.signSession({ sub: me.id.toString() });
    res.cookie("__Host-auth", freshToken, cookieOptions);

    req.me = me;

    next();
  } catch {
    res.sendStatus(401);
  }
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  sendMagicLink,
  verifyMagicLink,
  destroyAccessToken,
  verifyAccessToken,
};
