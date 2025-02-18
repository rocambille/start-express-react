import type { RequestHandler } from "express";
import { type ZodError, z } from "zod";

const userDTOSchema = z.object({
  id: z.number().optional(),
  email: z.string().email().max(255),
  password: z.string().max(255),
});

const validate: RequestHandler = (req, res, next) => {
  try {
    req.body = userDTOSchema.parse(req.body);

    next();
  } catch (err) {
    res.status(400).json((err as ZodError).issues);
  }
};

export default { validate };
