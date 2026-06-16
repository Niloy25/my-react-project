const { validationResult } = require("express-validator");
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Return the first error per field for clean UX
    const formattedErrors = errors
      .array({ onlyFirstError: true })
      .map((err) => ({
        field: err.path,
        message: err.msg,
      }));

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = validate;
