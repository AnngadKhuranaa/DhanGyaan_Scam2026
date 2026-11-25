import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';

const signToken = (id, username, email) =>
  jwt.sign({ id, username, email }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

export const register = async (req, res, next) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!username || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { phone }]
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists with that email, username, or phone.' });
    }

    const user = await User.create({ username, email, phone, password });
    
    // Bootstrap empty portfolio (assuming paperBalance or default balance exists)
    await Portfolio.create({ user: user._id, cashBalance: user.balance || 100000 });

    const token = signToken(user._id, user.username, user.email);

    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone } 
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ success: false, message: 'Identifier and password required' });

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { phone: identifier }]
    }).select('+password');

    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id, user.username, user.email);

    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone } 
    });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
