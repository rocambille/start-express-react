import type { RequestHandler } from "express";

const validate: RequestHandler = async (req, res, next) => {
  const errors: ValidationError[] = [];

  const { email, password } = req.body;

  if (email == null) {
    errors.push({ field: "email", message: "The field is required" });
  } else if (email.length > 255) {
    errors.push({
      field: "email",
      message: "Should contain less than 255 characters",
    });
  }

  if (password == null) {
    errors.push({ field: "password", message: "The field is required" });
  } else if (password.length > 255) {
    errors.push({
      field: "password",
      message: "Should contain less than 255 characters",
    });
  }

  if (errors.length === 0) {
    next();
  } else {
    res.status(400).json({ validationErrors: errors });
  }
};

export default { validate };
