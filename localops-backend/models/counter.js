const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { collection: 'counters' });

counterSchema.statics.getNextSequence = async function(key) {
  const updated = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return updated.seq;
};

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

