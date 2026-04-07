const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── SPECIFIC ROUTES FIRST ────────────────────────────────────────────────────

// GET /api/patients/stats
router.get('/stats', restrictTo('doctor'), async (req, res) => {
  try {
    const doctorId = req.user._id;
    const Record = require('../models/Record');
    const [total, critical, monitor] = await Promise.all([
      Patient.countDocuments({ doctor: doctorId }),
      Patient.countDocuments({ doctor: doctorId, status: 'critical' }),
      Patient.countDocuments({ doctor: doctorId, status: 'monitor' }),
    ]);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const recordsThisMonth = await Record.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: startOfMonth },
    });
    res.json({ total, critical, monitor, stable: total - critical - monitor, recordsThisMonth });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/patients
router.get('/', restrictTo('doctor'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { doctor: req.user._id };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { existingConditions: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const patients = await Patient.find(filter)
      .populate('userAccount', 'name email')
      .sort({ lastVisit: -1, createdAt: -1 });
    res.json({ count: patients.length, patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PARAM ROUTES ─────────────────────────────────────────────────────────────

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userAccount', 'name email');
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    if (req.user.role === 'doctor') {
      if (patient.doctor.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Access denied.' });
    } else if (req.user.role === 'patient') {
      // userAccount may be a populated object or a raw ObjectId — handle both
      const linkedId = patient.userAccount?._id
        ? patient.userAccount._id.toString()
        : patient.userAccount?.toString();
      if (!linkedId || linkedId !== req.user._id.toString())
        return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/patients
router.post('/', restrictTo('doctor'), async (req, res) => {
  try {
    const { name, dob, gender, phone, email, bloodGroup, allergies, existingConditions, address } = req.body;
    if (!name || !dob || !gender || !phone)
      return res.status(400).json({ message: 'Name, DOB, gender and phone are required.' });
    const patient = await Patient.create({
      doctor: req.user._id, name, dob, gender, phone, email, bloodGroup,
      allergies: allergies || [],
      existingConditions: existingConditions || [],
      address,
    });
    res.status(201).json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/patients/:id/link-account
router.patch('/:id/link-account', restrictTo('doctor'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Patient account email is required.' });

    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const userAccount = await User.findOne({ email: email.toLowerCase().trim(), role: 'patient' });
    if (!userAccount) {
      return res.status(404).json({
        message: 'No patient account found with that email. The patient needs to register on MediRecord first.',
      });
    }

    const alreadyLinked = await Patient.findOne({ userAccount: userAccount._id });
    if (alreadyLinked && alreadyLinked._id.toString() !== patient._id.toString()) {
      return res.status(409).json({ message: 'This account is already linked to another patient record.' });
    }

    patient.userAccount = userAccount._id;
    await patient.save();
    userAccount.patientProfile = patient._id;
    await userAccount.save();

    const populated = await Patient.findById(patient._id).populate('userAccount', 'name email');
    res.json({ message: 'Account linked successfully.', patient: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/patients/:id/unlink-account
router.patch('/:id/unlink-account', restrictTo('doctor'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    if (patient.userAccount) {
      await User.findByIdAndUpdate(patient.userAccount, { $unset: { patientProfile: 1 } });
      patient.userAccount = undefined;
      await patient.save();
    }
    res.json({ message: 'Account unlinked successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/patients/:id — update info or status (must come AFTER named sub-routes)
router.patch('/:id', restrictTo('doctor'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    const allowed = ['name', 'dob', 'gender', 'phone', 'email', 'bloodGroup',
      'allergies', 'existingConditions', 'address', 'status'];
    allowed.forEach(f => { if (req.body[f] !== undefined) patient[f] = req.body[f]; });
    await patient.save();
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', restrictTo('doctor'), async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, doctor: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    const Record = require('../models/Record');
    await Record.deleteMany({ patient: req.params.id });
    if (patient.userAccount) {
      await User.findByIdAndUpdate(patient.userAccount, { $unset: { patientProfile: 1 } });
    }
    res.json({ message: 'Patient and all associated records deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
