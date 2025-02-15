import type { CookieOptions, RequestHandler } from "express";

import argon2 from "argon2";
import jwt, { type JwtPayload } from "jsonwebtoken";

// Import access to data
import userRepository from "../user/userRepository";

// Options de hachage (voir documentation : https://github.com/ranisalt/node-argon2/wiki/Options)
// Recommandations **minimales** de l'OWASP : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19 * 2 ** 10 /* 19 Mio en kio (19 * 1024 kio) */,
  timeCost: 2,
  parallelism: 1,
};

const hashPassword: RequestHandler = async (req, _res, next) => {
  try {
    // Extraction du mot de passe de la requête

    const { password } = req.body;

    // Remplacement du mot de passe non haché par le mot de passe haché dans la requête

    req.body.password = await argon2.hash(password, hashingOptions);

    next();
  } catch (err) {
    next(err);
  }
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
};

const createUserAndAccessToken: RequestHandler = async (req, res, next) => {
  try {
    // Extraction des données de la requête

    const newUser = {
      email: req.body.email,
      password: req.body.password,
    };

    // Création du user

    const insertId = await userRepository.create(newUser);

    // Everything is ok

    const { password, ...userWithoutId } = newUser;

    const user = { ...userWithoutId, id: insertId };

    const token = await jwt.sign(
      {
        sub: user.id,
      },
      process.env.APP_SECRET as string,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("auth", token, cookieOptions);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

const createAccessToken: RequestHandler = async (req, res, next) => {
  try {
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

    const { password, ...user } = userWithPassword;

    const token = await jwt.sign(
      {
        sub: user.id,
      },
      process.env.APP_SECRET as string,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("auth", token, cookieOptions);

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

const destroyAccessToken: RequestHandler = async (_req, res, next) => {
  try {
    res.clearCookie("auth", cookieOptions);

    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

const verifyAccessToken: RequestHandler = (req, res, next) => {
  try {
    // Vérifier la présence du token
    const token = req.cookies.auth;

    if (token == null) {
      res.sendStatus(403);
      return;
    }

    // Vérifier la validité du token (son authenticité et sa date d'expériation)
    // En cas de succès, le payload est extrait et décodé
    req.auth = jwt.verify(
      token,
      process.env.APP_SECRET as string,
    ) as JwtPayload;

    next();
  } catch (err) {
    console.error(err);
    res.sendStatus(403);
  }
};

export default {
  hashPassword,
  createUserAndAccessToken,
  createAccessToken,
  destroyAccessToken,
  verifyAccessToken,
};
