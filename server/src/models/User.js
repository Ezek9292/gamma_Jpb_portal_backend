import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'applicant'], default: 'applicant', required: true },
}, { timestamps: true });

userSchema.set('toJSON', { transform: (_doc, value) => { value.id = String(value._id); delete value._id; delete value.__v; delete value.passwordHash; return value; } });
export const User = mongoose.model('User', userSchema);
