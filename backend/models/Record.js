const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  drug: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String },  // e.g. "Twice daily after meals"
  duration: { type: String },   // e.g. "7 days"
  notes: { type: String },
});

const vitalsSchema = new mongoose.Schema({
  bp: { type: String },          // e.g. "120/80"
  heartRate: { type: Number },   // bpm
  temperature: { type: Number }, // Celsius
  weight: { type: Number },      // kg
  height: { type: Number },      // cm
  spo2: { type: Number },        // %
  bloodSugar: { type: Number },  // mg/dL
});

const recordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    visitDate: { type: Date, required: true, default: Date.now },
    visitType: {
      type: String,
      enum: ['Routine Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Lab Review'],
      default: 'Routine Checkup',
    },

    // Chief complaint
    symptoms: { type: String },

    // Diagnosis
    diagnosis: { type: String, required: true },
    icdCode: { type: String }, // optional ICD-10 code

    // Vitals at this visit
    vitals: vitalsSchema,

    // Prescriptions for this visit
    prescriptions: [prescriptionSchema],

    // Clinical notes
    notes: { type: String },

    // Lab test orders / results
    labTests: [{ test: String, result: String, unit: String, referenceRange: String }],

    // Follow-up
    followUpDate: { type: Date },
    followUpNotes: { type: String },
  },
  { timestamps: true }
);

// After saving a record, update patient's lastVisit
recordSchema.post('save', async function () {
  const Patient = require('./Patient');
  await Patient.findByIdAndUpdate(this.patient, { lastVisit: this.visitDate });
});

module.exports = mongoose.model('Record', recordSchema);
