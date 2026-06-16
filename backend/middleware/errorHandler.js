const logger = require("../config/logger");
const AppError = require("../utils/AppError");

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} is already in use`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join(". ");
  return new AppError(`Validation failed: ${messages}`, 422);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Token has expired. Please log in again.", 401);

// Must have exactly 4 params — Express detects error handlers by arity
const errorHandler = (err, req, res, next) => {
  // eslint-disable-line
  let error = Object.assign(
    new AppError(err.message, err.statusCode || 500),
    err,
  );

  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  if (isOperational) {
    logger.warn(
      `${statusCode} - ${error.message} - ${req.method} ${req.originalUrl}`,
    );
  } else {
    logger.error(`UNEXPECTED: ${err.message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    status: error.status || "error",
    message: isOperational
      ? error.message
      : "Something went wrong. Please try again later.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
