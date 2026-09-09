const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;
  const errors = Array.isArray(err.errors) ? err.errors : [];

  if (statusCode === 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  });
};

export { errorHandler };
