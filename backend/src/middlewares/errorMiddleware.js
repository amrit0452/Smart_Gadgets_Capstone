function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Avoid leaking stack traces in API responses.
  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || "INTERNAL_ERROR",
    },
  });
}

module.exports = { errorMiddleware };

