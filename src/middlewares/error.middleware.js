const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    if (statusCode === 500 || statusCode>=400) {
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