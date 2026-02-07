const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  phone: { 
    type: String, 
    default: '+250 ' 
  },
  password: { 
    type: String, 
    select: false // Prevents password from leaking in "find" queries
  },
  role: { 
    type: String, 
    enum: ['ADMIN', 'OWNER', 'WORKER'], 
    required: true 
  },
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'DEACTIVATED'], 
    default: 'PENDING' 
  },
  setupToken: { type: String },
  setupTokenExpires: { type: Date }
}, { timestamps: true });

// ✅ Hashing logic
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // Since password has select: false, we ensure we are comparing against a valid string
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);