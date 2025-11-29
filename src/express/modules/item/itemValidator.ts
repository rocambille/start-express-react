import type { RequestHandler } from "express";
import { type ZodError, z } from "zod";

const itemDTOSchema = z.object({
  id: z.number().optional(),
  title: z.string().max(255),
  user_id: z.number(),
});

const validate: RequestHandler = (req, res, next) => {
  try {
    req.body = itemDTOSchema.parse({
      ...req.body,
      user_id: Number(req.auth.sub),
    });

    next();
  } catch (err) {
    const { issues } = err as ZodError;

    res.status(400).json(issues);
  }
};

export default { validate };
