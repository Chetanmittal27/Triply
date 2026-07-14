const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        console.error(error);
        const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
        res.status(statusCode).json({
            success: false,
            message: process.env.NODE_ENV === "production" && statusCode === 500 ? "An unexpected server error occurred" : error.message,
            errors: error.errors || []
        });
    }
};

export { asyncHandler };
