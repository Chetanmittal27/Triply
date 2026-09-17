const asyncHandler = (func) => async (req, res, next) => {

    try {

        await func(req, res, next);

    } catch (error) {

        res.status(Number(error.statusCode) || 500).json({
            
            success: false,
            message: error.message || "Something Went Wrong",
        });
    }
};

export { asyncHandler };