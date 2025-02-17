import type { RequestHandler } from "express";

const validate: RequestHandler = async (req, res, next) => {
  const errors: ValidationError[] = [];

  const { title, user_id } = req.body;

  if (title == null) {
    errors.push({ field: "title", message: "The field is required" });
  } else if (title.length > 255) {
    errors.push({
      field: "title",
      message: "Should contain less than 255 characters",
    });
  }

  if (user_id == null) {
    errors.push({ field: "user_id", message: "The field is required" });
  } else if (Number.isNaN(Number(user_id))) {
    errors.push({
      field: "user_id",
      message: "Should be a valid number",
    });
  }

  if (errors.length === 0) {
    next();
  } else {
    res.status(400).json({ validationErrors: errors });
  }
};

export default { validate };
