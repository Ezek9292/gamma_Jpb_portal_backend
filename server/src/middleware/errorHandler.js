import multer from 'multer';

export const notFound = (req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found`, errors: [] });

export const errorHandler = (error, _req, res, _next) => {
  let status = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = error.errors || [];
  if (error.name === 'CastError') { status = 400; message = 'Invalid resource identifier'; }
  if (error.code === 11000) { status = 409; message = 'A record with these details already exists'; errors = Object.keys(error.keyPattern || {}).map((field) => ({ field, message: 'Must be unique' })); }
  if (error.name === 'ValidationError') { status = 422; message = 'Database validation failed'; errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })); }
  if (error instanceof multer.MulterError) { status = 400; message = error.code === 'LIMIT_FILE_SIZE' ? 'Each uploaded file must be 5 MB or smaller' : error.message; }
  if (process.env.NODE_ENV !== 'test' && status >= 500) console.error(error);
  res.status(status).json({ success: false, message, errors });
};
