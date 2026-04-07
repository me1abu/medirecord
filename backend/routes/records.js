const express = require('express');
const Record = require('../models/Record');
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── SPECIFIC ROUTES FIRST (must come before /:id) ───────────────────────────

// GET /api/records/recent — doctor's 10 most recent records across all patients
router.get('/recent', restrictTo('doctor'), async (req, res) => {
  try {
    const records = await Record.find({ doctor: req.user._id })
      .populate('patient', 'name')
      .sort({ visitDate: -1 })
      .limit(10);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/records/patient/:patientId — all records for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    // Access control
    if (req.user.role === 'doctor' && patient.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'patient') {
      // userAccount may be ObjectId or populated object — handle both
      const linkedId = patient.userAccount?._id
        ? patient.userAccount._id.toString()
        : patient.userAccount?.toString();
      if (linkedId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const records = await Record.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });

    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/records/followups — doctor sees all upcoming follow-ups across all patients
router.get('/followups', restrictTo('doctor'), async (req, res) => {
  try {
    const records = await Record.find({
      doctor: req.user._id,
      followUpDate: { $exists: true, $ne: null },
    })
      .populate('patient', 'name phone')
      .sort({ followUpDate: 1 })
      .select('patient diagnosis visitType followUpDate followUpNotes visitDate');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PARAM ROUTES AFTER ──────────────────────────────────────────────────────

// GET /api/records/:id — single record with access control
router.get('/:id', async (req, res) => {
  try {
    const record = await Record.findById(req.params.id)
      .populate('patient', 'name dob gender bloodGroup doctor userAccount')
      .populate('doctor', 'name specialization clinic');

    if (!record) return res.status(404).json({ message: 'Record not found.' });

    // Doctor can only view records they created
    if (req.user.role === 'doctor' && record.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    // Patient can only view their own records
    if (req.user.role === 'patient') {
      const linkedId = record.patient.userAccount?._id
        ? record.patient.userAccount._id.toString()
        : record.patient.userAccount?.toString();
      if (linkedId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    res.json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/records — doctor adds a new visit record
router.post('/', restrictTo('doctor'), async (req, res) => {
  try {
    const {
      patientId, visitDate, visitType, symptoms,
      diagnosis, vitals, prescriptions,
      notes, labTests, followUpDate, followUpNotes,
    } = req.body;

    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'Patient and diagnosis are required.' });
    }

    const patient = await Patient.findOne({ _id: patientId, doctor: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found or access denied.' });

    const record = await Record.create({
      patient: patientId,
      doctor: req.user._id,
      visitDate: visitDate || Date.now(),
      visitType,
      symptoms,
      diagnosis,
      vitals,
      prescriptions,
      notes,
      labTests,
      followUpDate: followUpDate || undefined,
      followUpNotes,
    });

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/records/:id — doctor updates a record
router.patch('/:id', restrictTo('doctor'), async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found or access denied.' });

    const allowed = ['visitDate', 'visitType', 'symptoms', 'diagnosis',
      'vitals', 'prescriptions', 'notes', 'labTests',
      'followUpDate', 'followUpNotes'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) record[field] = req.body[field];
    });

    await record.save();
    res.json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/records/:id
router.delete('/:id', restrictTo('doctor'), async (req, res) => {
  try {
    const record = await Record.findOneAndDelete({ _id: req.params.id, doctor: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found or access denied.' });
    res.json({ message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
