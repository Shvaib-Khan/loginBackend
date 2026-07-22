const errorHandler = (err, req, res, next) => {
<<<<<<< HEAD
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
=======
    const statusCode = err.statusCode || 500;

    if (statusCode === 500) {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal Server Error"
                : err.message,
        data: null,
        errors: err.errors || []
    });
};

export { errorHandler };
>>>>>>> 2af45b6 (Enhance API reliability by implementing centralized error handling and response formatting)
