import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // Optional; sparse so many users can omit it while still being unique when present.
    phone: { type: String, trim: true, unique: true, sparse: true },
    // Never trimmed (spaces are valid password characters) and never returned by default.
    password: { type: String, required: true, select: false },
    // Virtual cash in INR. Set explicitly on register from STARTING_BALANCE.
    balance: { type: Number, required: true, min: 0 },
    startingBalance: { type: Number, required: true, min: 0 },
    // Incremented on logout; refresh tokens carrying an older version are rejected.
    tokenVersion: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** The only shape of a user that is ever sent to the client. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    phone: this.phone || null,
    balance: this.balance,
    startingBalance: this.startingBalance,
    isDemo: this.isDemo,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
