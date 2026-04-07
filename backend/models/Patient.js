const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    // Linked user account (optional — doctor can create patients without user account)
    userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Registered by which doctor
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Demographics
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },

    // Medical info
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      default: 'Unknown',
    },
    allergies: [{ type: String }],
    existingConditions: [{ type: String }],

    // Status
    status: { type: String, enum: ['stable', 'monitor', 'critical'], default: 'stable' },

    // Computed — last visit date, updated when records are added
    lastVisit: { type: Date },
  },
  { timestamps: true }
);

// Virtual: age from dob
patientSchema.virtual('age').get(function () {
  if (!this.dob) return null;
  const diff = Date.now() - new Date(this.dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Patient', patientSchema);
