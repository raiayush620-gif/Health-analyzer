import mongoose from 'mongoose';

const energyRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sleep: {
      type: Number,
      required: [true, 'Please add sleep hours'],
      min: [0, 'Sleep hours cannot be negative'],
      max: [24, 'Sleep hours cannot exceed 24'],
    },
    screenTime: {
      type: Number,
      required: [true, 'Please add screen time'],
      min: [0, 'Screen time cannot be negative'],
      max: [24, 'Screen time cannot exceed 24'],
    },
    waterIntake: {
      type: Number,
      required: [true, 'Please add water intake in glasses'],
      min: [0, 'Water intake cannot be negative'],
      max: [50, 'Water intake cannot exceed 50'],
    },
    stressLevel: {
      type: Number,
      required: [true, 'Please add stress level'],
      min: [1, 'Stress level must be at least 1'],
      max: [10, 'Stress level cannot exceed 10'],
    },
    energyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const EnergyRecord = mongoose.model('EnergyRecord', energyRecordSchema);

export default EnergyRecord;
