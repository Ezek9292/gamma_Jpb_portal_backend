import { Router } from 'express';
import { login, me, signup } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, signupSchema } from '../validators/schemas.js';

export const authRouter = Router();
authRouter.post('/signup', validate(signupSchema), asyncHandler(signup));
authRouter.post('/login', validate(loginSchema), asyncHandler(login));
authRouter.get('/me', authenticate, asyncHandler(me));
