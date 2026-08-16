export function errorHandler(err, _req, res, _next) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
}
