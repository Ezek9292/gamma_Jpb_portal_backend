import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Authentication is required', 401);
  let payload;
  try { payload = verifyToken(token); } catch { throw new AppError('Token is invalid or expired', 401); }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError('The account for this token no longer exists', 401);
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('You do not have permission to perform this action', 403));
  next();
};
