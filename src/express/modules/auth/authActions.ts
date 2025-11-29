import argon2 from "argon2";
import cookieParser from "cookie-parser";
import type { CookieOptions, RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import userRepository from "../user/userRepository";

declare global {
  namespace Express {
    export interface Request {
      auth: JwtPayload;
    }
  }
}

const appSecret = process.env.APP_SECRET;

if (appSecret == null) {
  throw new Error("process.env.APP_SECRET is not defined");
}

/* ************************************************************************ */

// Options de hachage (voir documentation : https://github.com/ranisalt/node-argon2/wiki/Options)
// Recommandations **minimales** de l'OWASP : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19 * 2 ** 10 /* 19 Mio en kio (19 * 1024 kio) */,
  timeCost: 2,
  parallelism: 1,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
};

/* ************************************************************************ */

const hashPassword: RequestHandler = async (req, _res, next) => {
  // Remplacement du mot de passe non haché par le mot de passe haché dans la requête

  req.body.password = await argon2.hash(req.body.password, hashingOptions);

  next();
};

/* ************************************************************************ */

const createUserAndAccessToken: RequestHandler = async (req, res) => {
  // Création du user

  const insertId = await userRepository.create(req.body);

  // Everything is ok

  const payload: typeof req.auth = {
    sub: insertId.toString(),
  };

  const token = await jwt.sign(payload, appSecret, {
    expiresIn: "1h",
  });

  res.cookie("auth", token, cookieOptions);

  res.status(201).json({ insertId });
};

/* ************************************************************************ */

const createAccessToken: RequestHandler = async (req, res) => {
  // Check email

  const userWithPassword = await userRepository.readByEmailWithPassword(
    req.body.email,
  );

  if (userWithPassword == null) {
    res.sendStatus(403);
    return;
  }

  // Check password

  const verified = await argon2.verify(
    userWithPassword.password,
    req.body.password,
  );

  if (!verified) {
    res.sendStatus(403);
    return;
  }

  // Everything is ok

  const { password: _password, ...user } = userWithPassword;

  const payload: typeof req.auth = {
    sub: user.id.toString(),
  };

  const token = await jwt.sign(payload, appSecret, {
    expiresIn: "1h",
  });

  res.cookie("auth", token, cookieOptions);

  res.status(201).json(user);
};

/* ************************************************************************ */

const destroyAccessToken: RequestHandler = (_req, res) => {
  res.clearCookie("auth", cookieOptions);

  res.sendStatus(204);
};

/* ************************************************************************ */

const verifyAccessToken: RequestHandler[] = [
  cookieParser(),
  (req, res, next) => {
    try {
      // Vérifier la présence du token
      const token = req.cookies.auth;

      if (token == null) {
        throw new Error("Access token is missing in cookies");
      }

      // Vérifier la validité du token (son authenticité et sa date d'expériation)
      // En cas de succès, le payload est extrait et décodé
      req.auth = jwt.verify(token, appSecret) as typeof req.auth;

      next();
    } catch (_err) {
      res.sendStatus(403);
    }
  },
];

/* ************************************************************************ */

const readMe: RequestHandler = async (req, res) => {
  const me = await userRepository.read(Number(req.auth.sub));

  res.json(me);
};

/* ************************************************************************ */

export default {
  hashPassword,
  createUserAndAccessToken,
  createAccessToken,
  destroyAccessToken,
  verifyAccessToken,
  readMe,
};
