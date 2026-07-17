import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';

const authPayload = (user) => ({ token: signToken(user.id), user: user.toJSON() });

export async function signup(req, res) {
  const { name, email, password, role } = req.body;
  if (await User.exists({ email })) throw new AppError('An account with this email already exists', 409);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });
  res.status(201).json({ success: true, data: authPayload(user) });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError('We could not match that email and password', 401);
  res.json({ success: true, data: authPayload(user) });
}

export async function me(req, res) { res.json({ success: true, data: { user: req.user.toJSON() } }); }
