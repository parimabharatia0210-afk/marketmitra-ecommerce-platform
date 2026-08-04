const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true }, // bcrypt hash
  role: { type: String, default: 'admin', immutable: true }
}, { collection: 'admin', timestamps: true });

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
