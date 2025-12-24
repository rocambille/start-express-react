/*
  Purpose:
  Centralize all authentication-related actions and middleware.

  This file handles:
  - Password hashing and verification
  - User authentication (login / register)
  - JWT creation and verification
  - Authentication cookie management

  This file intentionally does NOT:
  - Perform request validation (handled by validators)
  - Handle routing concerns (handled by authRoutes)
  - Implement authorization logic (handled elsewhere)

  Security model:
  - Stateless authentication via JWT stored in HttpOnly cookies
  - Short-lived access tokens
  - Strong password hashing using Argon2id
*/

import argon2 from "argon2";
import type { CookieOptions, RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import userRepository from "../user/userRepository";

/* ************************************************************************ */
/* Configuration & primitives                                               */
/* ************************************************************************ */

/*
  Application secret used to sign JWTs.
  Must be defined at startup; failing fast is intentional.
*/
const appSecret = process.env.APP_SECRET;

if (appSecret == null) {
  throw new Error("process.env.APP_SECRET is not defined");
}

/*
  Minimal JWT wrapper to:
  - Encapsulate signing and verification
  - Enforce payload typing between methods
*/
class Auth<Payload extends JwtPayload | string = JwtPayload> {
  #secret: string;

  constructor(secret: string) {
    this.#secret = secret;
  }

  sign(payload: Payload): string {
    return jwt.sign(payload, this.#secret, {
      expiresIn: "1h",
    });
  }

  verify(token: string): Payload {
    return jwt.verify(token, this.#secret) as Payload;
  }
}

const auth = new Auth(appSecret);

/*
  Extend Express Request to carry authenticated user data.
  This is populated exclusively by verifyAccessToken.
*/
declare global {
  namespace Express {
    interface Request {
      auth: ReturnType<typeof auth.verify>;
    }
  }
}

/* ************************************************************************ */
/* Security options                                                         */
/* ************************************************************************ */

/*
  Password hashing options.

  - Uses Argon2id (recommended by OWASP)
  - Values are conservative but suitable for most applications

  References:
  - https://github.com/ranisalt/node-argon2/wiki/Options
  - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
*/
const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19 * 2 ** 10, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

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
  maxAge: 60 * 60 * 1000, // 1 hour
};

/* ************************************************************************ */
/* Middleware                                                               */
/* ************************************************************************ */

/*
  Hash a plaintext password before persistence.

  Preconditions:
  - req.body.password exists and is a string

  Postconditions:
  - req.body.password contains a secure hash
*/
const hashPassword: RequestHandler = async (req, _res, next) => {
  req.body.password = await argon2.hash(req.body.password, hashingOptions);

  next();
};

/* ************************************************************************ */

/*
  Verify the access token from cookies and attach its payload to req.auth.

  Preconditions:
  - Cookie parser has already run

  Response:
  - 401 if token is missing or invalid
*/
const verifyAccessToken: RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies.auth;

    if (token == null) {
      throw new Error("Access token is missing in cookies");
    }

    req.auth = auth.verify(token);

    next();
  } catch {
    res.sendStatus(401);
  }
};

/* ************************************************************************ */
/* Actions                                                                  */
/* ************************************************************************ */

/*
  Register a new user and issue an access token.

  Preconditions:
  - req.body has been validated
  - req.body.password has been hashed

  Response:
  - 201 with the new user's id
  - Sets authentication cookie
*/
const createUserAndAccessToken: RequestHandler = async (req, res) => {
  const insertId = await userRepository.create(req.body);

  const token = auth.sign({ sub: insertId.toString() });

  res.cookie("__Host-auth", token, cookieOptions);

  res.status(201).json({ insertId });
};

/* ************************************************************************ */

/*
  Authenticate an existing user and issue an access token.

  Preconditions:
  - req.body.email and req.body.password are present

  Response:
  - 201 with user payload (without password)
  - 401 on invalid credentials
*/
const createAccessToken: RequestHandler = async (req, res) => {
  const userWithPassword = await userRepository.readByEmailWithPassword(
    req.body.email,
  );

  if (userWithPassword == null) {
    res.sendStatus(401);
    return;
  }

  const verified = await argon2.verify(
    userWithPassword.password,
    req.body.password,
  );

  if (!verified) {
    res.sendStatus(401);
    return;
  }

  const { password: _password, ...user } = userWithPassword;

  const token = auth.sign({ sub: user.id.toString() });

  res.cookie("__Host-auth", token, cookieOptions);

  res.status(201).json(user);
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

/*
  Return the currently authenticated user.

  Preconditions:
  - verifyAccessToken has run successfully
*/
const readMe: RequestHandler = async (req, res) => {
  const me = await userRepository.read(Number(req.auth.sub));

  res.json(me);
};

/* ************************************************************************ */
/* Export                                                                   */
/* ************************************************************************ */

export default {
  hashPassword,
  verifyAccessToken,
  createUserAndAccessToken,
  createAccessToken,
  destroyAccessToken,
  readMe,
};
