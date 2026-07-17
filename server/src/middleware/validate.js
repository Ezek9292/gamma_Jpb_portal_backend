import { AppError } from '../utils/AppError.js';

export const validate = (schema, target = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return next(new AppError('Request validation failed', 422, errors));
  }
  req[target] = result.data;
  next();
};
