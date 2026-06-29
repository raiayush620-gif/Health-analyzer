import EnergyRecord from '../models/EnergyRecord.js';
import User from '../models/User.js';
import { getMockRecords, saveMockRecords, getMockUsers, saveMockUsers } from '../utils/mockDb.js';

// Calculate energy score based on the original formula:
// energy = 100 - (8 - sleep) * 6 - screen * 2 + water * 2 - stress * 3
const calculateEnergyScore = (sleep, screen, water, stress) => {
  let score = 100;
  score -= (8 - sleep) * 6;
  score -= screen * 2;
  score += water * 2;
  score -= stress * 3;
  return Math.max(0, Math.min(100, Math.round(score)));
};

// @desc    Create a new energy record
// @route   POST /api/records
// @access  Private
export const createRecord = async (req, res) => {
  const { sleep, screenTime, waterIntake, stressLevel, date } = req.body;

  try {
    if (sleep === undefined || screenTime === undefined || waterIntake === undefined || stressLevel === undefined) {
      return res.status(400).json({ message: 'All record fields are required' });
    }

    const energyScore = calculateEnergyScore(
      Number(sleep),
      Number(screenTime),
      Number(waterIntake),
      Number(stressLevel)
    );

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();

      const record = {
        _id: `mock_record_${Date.now()}`,
        user: req.user._id,
        sleep: Number(sleep),
        screenTime: Number(screenTime),
        waterIntake: Number(waterIntake),
        stressLevel: Number(stressLevel),
        energyScore,
        date: date ? new Date(date) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRecords.push(record);
      saveMockRecords(mockRecords);
      return res.status(201).json(record);
    }
    // =================================================

    const record = await EnergyRecord.create({
      user: req.user._id,
      sleep: Number(sleep),
      screenTime: Number(screenTime),
      waterIntake: Number(waterIntake),
      stressLevel: Number(stressLevel),
      energyScore,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Server error creating record' });
  }
};

// @desc    Get user's energy records with search & filters
// @route   GET /api/records
// @access  Private
export const getRecords = async (req, res) => {
  try {
    const { startDate, endDate, minScore, maxScore, sortBy } = req.query;

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();
      let filtered = mockRecords.filter(r => r.user === req.user._id);

      // Date range filter
      if (startDate) {
        filtered = filtered.filter(r => new Date(r.date) >= new Date(startDate));
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(r => new Date(r.date) <= end);
      }

      // Energy score filter
      if (minScore) {
        filtered = filtered.filter(r => r.energyScore >= Number(minScore));
      }
      if (maxScore) {
        filtered = filtered.filter(r => r.energyScore <= Number(maxScore));
      }

      // Sorting (Priority: createdAt ensures newest logs logged on the same day are sorted correctly)
      if (sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === 'highestScore') {
        filtered.sort((a, b) => b.energyScore - a.energyScore || new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'lowestScore') {
        filtered.sort((a, b) => a.energyScore - b.energyScore || new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        // Default: Newest creation time first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      return res.json(filtered);
    }
    // =================================================

    const query = { user: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Energy score filter
    if (minScore || maxScore) {
      query.energyScore = {};
      if (minScore) {
        query.energyScore.$gte = Number(minScore);
      }
      if (maxScore) {
        query.energyScore.$lte = Number(maxScore);
      }
    }

    // Sorting (Use createdAt as first sort key or secondary key to resolve same-day timestamp ordering)
    let sortOption = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOption = { date: 1, createdAt: 1 };
    } else if (sortBy === 'highestScore') {
      sortOption = { energyScore: -1, createdAt: -1 };
    } else if (sortBy === 'lowestScore') {
      sortOption = { energyScore: 1, createdAt: -1 };
    }

    const records = await EnergyRecord.find(query).sort(sortOption);
    res.json(records);
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error retrieving records' });
  }
};

// @desc    Update an energy record
// @route   PUT /api/records/:id
// @access  Private
export const updateRecord = async (req, res) => {
  const { sleep, screenTime, waterIntake, stressLevel, date } = req.body;

  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();
      const recordIndex = mockRecords.findIndex(r => r._id === req.params.id);

      if (recordIndex === -1) {
        return res.status(404).json({ message: 'Record not found' });
      }

      const record = mockRecords[recordIndex];

      // Verify ownership
      if (record.user !== req.user._id) {
        return res.status(401).json({ message: 'Not authorized to edit this record' });
      }

      if (sleep !== undefined) record.sleep = Number(sleep);
      if (screenTime !== undefined) record.screenTime = Number(screenTime);
      if (waterIntake !== undefined) record.waterIntake = Number(waterIntake);
      if (stressLevel !== undefined) record.stressLevel = Number(stressLevel);
      if (date !== undefined) record.date = new Date(date);

      record.energyScore = calculateEnergyScore(
        record.sleep,
        record.screenTime,
        record.waterIntake,
        record.stressLevel
      );
      record.updatedAt = new Date();

      mockRecords[recordIndex] = record;
      saveMockRecords(mockRecords);
      return res.json(record);
    }
    // =================================================

    const record = await EnergyRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify ownership
    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this record' });
    }

    if (sleep !== undefined) record.sleep = Number(sleep);
    if (screenTime !== undefined) record.screenTime = Number(screenTime);
    if (waterIntake !== undefined) record.waterIntake = Number(waterIntake);
    if (stressLevel !== undefined) record.stressLevel = Number(stressLevel);
    if (date !== undefined) record.date = new Date(date);

    // Recalculate score
    record.energyScore = calculateEnergyScore(
      record.sleep,
      record.screenTime,
      record.waterIntake,
      record.stressLevel
    );

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Server error updating record' });
  }
};

// @desc    Delete an energy record
// @route   DELETE /api/records/:id
// @access  Private
export const deleteRecord = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();
      const recordIndex = mockRecords.findIndex(r => r._id === req.params.id);

      if (recordIndex === -1) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Verify ownership
      if (mockRecords[recordIndex].user !== req.user._id) {
        return res.status(401).json({ message: 'Not authorized to delete this record' });
      }

      mockRecords.splice(recordIndex, 1);
      saveMockRecords(mockRecords);
      return res.json({ message: 'Record removed successfully' });
    }
    // =================================================

    const record = await EnergyRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify ownership
    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this record' });
    }

    await record.deleteOne();
    res.json({ message: 'Record removed successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Server error deleting record' });
  }
};

// @desc    Get user wellness statistics
// @route   GET /api/records/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockRecords = getMockRecords();
      const userRecs = mockRecords.filter(r => r.user === req.user._id);

      if (userRecs.length === 0) {
        return res.json({
          avgSleep: 0,
          avgScreenTime: 0,
          avgWaterIntake: 0,
          avgStressLevel: 0,
          avgEnergyScore: 0,
          totalEntries: 0,
        });
      }

      const sumSleep = userRecs.reduce((acc, r) => acc + r.sleep, 0);
      const sumScreen = userRecs.reduce((acc, r) => acc + r.screenTime, 0);
      const sumWater = userRecs.reduce((acc, r) => acc + r.waterIntake, 0);
      const sumStress = userRecs.reduce((acc, r) => acc + r.stressLevel, 0);
      const sumScore = userRecs.reduce((acc, r) => acc + r.energyScore, 0);
      const len = userRecs.length;

      return res.json({
        avgSleep: Math.round((sumSleep / len) * 10) / 10,
        avgScreenTime: Math.round((sumScreen / len) * 10) / 10,
        avgWaterIntake: Math.round((sumWater / len) * 10) / 10,
        avgStressLevel: Math.round((sumStress / len) * 10) / 10,
        avgEnergyScore: Math.round((sumScore / len) * 10) / 10,
        totalEntries: len,
      });
    }
    // =================================================

    const stats = await EnergyRecord.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          avgSleep: { $avg: '$sleep' },
          avgScreenTime: { $avg: '$screenTime' },
          avgWaterIntake: { $avg: '$waterIntake' },
          avgStressLevel: { $avg: '$stressLevel' },
          avgEnergyScore: { $avg: '$energyScore' },
          totalEntries: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({
        avgSleep: 0,
        avgScreenTime: 0,
        avgWaterIntake: 0,
        avgStressLevel: 0,
        avgEnergyScore: 0,
        totalEntries: 0,
      });
    }

    res.json({
      avgSleep: Math.round(stats[0].avgSleep * 10) / 10,
      avgScreenTime: Math.round(stats[0].avgScreenTime * 10) / 10,
      avgWaterIntake: Math.round(stats[0].avgWaterIntake * 10) / 10,
      avgStressLevel: Math.round(stats[0].avgStressLevel * 10) / 10,
      avgEnergyScore: Math.round(stats[0].avgEnergyScore * 10) / 10,
      totalEntries: stats[0].totalEntries,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error fetching user statistics' });
  }
};

// ================= ADMIN CONTROLLERS =================

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const safeUsers = mockUsers.map(({ password, ...u }) => u);
      return res.json(safeUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
    // =================================================

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

// @desc    Delete a user and all their records (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const mockRecords = getMockRecords();

      const userIndex = mockUsers.findIndex(u => u._id === req.params.id);
      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.params.id === req.user._id) {
        return res.status(400).json({ message: 'You cannot delete your own admin account' });
      }

      // Delete user & user records
      const updatedRecords = mockRecords.filter(r => r.user !== req.params.id);
      mockUsers.splice(userIndex, 1);

      saveMockRecords(updatedRecords);
      saveMockUsers(mockUsers);

      return res.json({ message: 'User and all associated records deleted successfully' });
    }
    // =================================================

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    await EnergyRecord.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ message: 'User and all associated records deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// @desc    Update a user's role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  const { role } = req.body;

  try {
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection' });
    }

    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const userIndex = mockUsers.findIndex(u => u._id === req.params.id);

      if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (req.params.id === req.user._id && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot change your own admin role' });
      }

      mockUsers[userIndex].role = role;
      const user = mockUsers[userIndex];
      saveMockUsers(mockUsers);

      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }
    // =================================================

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot change your own admin role' });
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

// @desc    Get global stats (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getGlobalStats = async (req, res) => {
  try {
    // =============== MOCK DB FALLBACK ===============
    if (global.isMockDB) {
      const mockUsers = getMockUsers();
      const mockRecords = getMockRecords();

      const totalUsers = mockUsers.length;
      const totalRecords = mockRecords.length;

      if (totalRecords === 0) {
        return res.json({
          totalUsers,
          totalRecords,
          avgSleep: 0,
          avgScreenTime: 0,
          avgWaterIntake: 0,
          avgStressLevel: 0,
          avgEnergyScore: 0,
        });
      }

      const sumSleep = mockRecords.reduce((acc, r) => acc + r.sleep, 0);
      const sumScreen = mockRecords.reduce((acc, r) => acc + r.screenTime, 0);
      const sumWater = mockRecords.reduce((acc, r) => acc + r.waterIntake, 0);
      const sumStress = mockRecords.reduce((acc, r) => acc + r.stressLevel, 0);
      const sumScore = mockRecords.reduce((acc, r) => acc + r.energyScore, 0);

      return res.json({
        totalUsers,
        totalRecords,
        avgSleep: Math.round((sumSleep / totalRecords) * 10) / 10,
        avgScreenTime: Math.round((sumScreen / totalRecords) * 10) / 10,
        avgWaterIntake: Math.round((sumWater / totalRecords) * 10) / 10,
        avgStressLevel: Math.round((sumStress / totalRecords) * 10) / 10,
        avgEnergyScore: Math.round((sumScore / totalRecords) * 10) / 10,
      });
    }
    // =================================================

    const totalUsers = await User.countDocuments({});
    const totalRecords = await EnergyRecord.countDocuments({});

    const globalAverages = await EnergyRecord.aggregate([
      {
        $group: {
          _id: null,
          avgSleep: { $avg: '$sleep' },
          avgScreenTime: { $avg: '$screenTime' },
          avgWaterIntake: { $avg: '$waterIntake' },
          avgStressLevel: { $avg: '$stressLevel' },
          avgEnergyScore: { $avg: '$energyScore' },
        },
      },
    ]);

    const averages = globalAverages.length > 0 ? {
      avgSleep: Math.round(globalAverages[0].avgSleep * 10) / 10,
      avgScreenTime: Math.round(globalAverages[0].avgScreenTime * 10) / 10,
      avgWaterIntake: Math.round(globalAverages[0].avgWaterIntake * 10) / 10,
      avgStressLevel: Math.round(globalAverages[0].avgStressLevel * 10) / 10,
      avgEnergyScore: Math.round(globalAverages[0].avgEnergyScore * 10) / 10,
    } : {
      avgSleep: 0,
      avgScreenTime: 0,
      avgWaterIntake: 0,
      avgStressLevel: 0,
      avgEnergyScore: 0,
    };

    res.json({
      totalUsers,
      totalRecords,
      ...averages,
    });
  } catch (error) {
    console.error('Admin global stats error:', error);
    res.status(500).json({ message: 'Server error retrieving global statistics' });
  }
};
