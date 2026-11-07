import express from 'express'

import { signup,login,logout } from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const authRouter=express.Router();


authRouter.post('/register',signup);
authRouter.post('/login',login);
authRouter.post('/logout',logout);


authRouter.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



export default authRouter
