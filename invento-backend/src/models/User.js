const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['ADMIN', 'OWNER', 'WORKER'], required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  status: { type: String, enum: ['PENDING', 'ACTIVE'], default: 'PENDING' },
  setupToken: { type: String },
  setupTokenExpires: { type: Date }
}, { timestamps: true });

// ✅ Correct async pre-save hook
UserSchema.pre('save', async function() {
  // 'this' refers to the document
  if (!this.isModified('password')) return; // only hash if password changed
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
