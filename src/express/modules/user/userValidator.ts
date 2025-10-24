import type { RequestHandler } from "express";
import { type ZodError, z } from "zod";

const userDTOSchema = z
  .object({
    id: z.number().optional(),
    email: z.email().max(255),
    password: z.string().max(255),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // path of error
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
