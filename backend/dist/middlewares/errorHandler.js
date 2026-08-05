export const errorHandler = (error, req, res, next) => {
    console.error('Unhandled server error:', error);
    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(status).json({
        success: false,
        message,
        errors: error.errors || []
    });
};
