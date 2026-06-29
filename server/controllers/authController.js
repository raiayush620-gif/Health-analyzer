import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { getMockUsers, saveMockUsers } from '../utils/mockDb.js';

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailLower = email.toLowerCase();

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      
      const emailExists = mockUsers.find(u => u.email === emailLower);
      if (emailExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      const usernameExists = mockUsers.find(u => u.username === username);
      if (usernameExists) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      const role = mockUsers.length === 0 ? 'admin' : 'user';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: `mock_user_${Date.now()}`,
        username,
        email: emailLower,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsers.push(newUser);
      saveMockUsers(mockUsers);

      return res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        token: generateToken(newUser._id),
      });
    }
    // =================================================

    // Check if user already exists in real MongoDB
    const emailExists = await User.findOne({ email: emailLower });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Determine role
    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? 'admin' : 'user';

    // Create user
    const user = await User.create({
      username,
      email: emailLower,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const queryStr = emailOrUsername.toLowerCase();

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const user = mockUsers.find(
        u => u.email === queryStr || u.username.toLowerCase() === queryStr
      );

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    // =================================================

    // Find by email OR username in real MongoDB
    const user = await User.findOne({
      $or: [
        { email: queryStr },
        { username: emailOrUsername },
      ],
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const user = getMockUsers().find(u => u._id === req.user._id);
      if (user) {
        return res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }
    // =================================================

    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const emailInput = req.body.email ? req.body.email.toLowerCase() : null;

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const userIndex = mockUsers.findIndex(u => u._id === req.user._id);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = mockUsers[userIndex];

      if (req.body.username && req.body.username !== user.username) {
        const usernameExists = mockUsers.find(u => u.username === req.body.username);
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        user.username = req.body.username;
      }

      if (emailInput && emailInput !== user.email) {
        const emailExists = mockUsers.find(u => u.email === emailInput);
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already taken' });
        }
        user.email = emailInput;
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      user.updatedAt = new Date();
      mockUsers[userIndex] = user;
      saveMockUsers(mockUsers);

      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
    // =================================================

    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.username && req.body.username !== user.username) {
        const usernameExists = await User.findOne({ username: req.body.username });
        if (usernameExists) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        user.username = req.body.username;
      }

      if (emailInput && emailInput !== user.email) {
        const emailExists = await User.findOne({ email: emailInput });
        if (emailExists) {
          return res.status(400).json({ message: 'Email is already taken' });
        }
        user.email = emailInput;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
