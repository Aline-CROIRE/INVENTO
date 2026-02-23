const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Rent', 'Salary', 'Utilities', 'Marketing', 'Logistics', 'Maintenance', 'Other'] 
  },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'Cash' },
  receiptUrl: { type: String }, // For optional attachment uploads
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // To link to a Batch/Stock if needed for cashflow audits
  isRecurring: { type: Boolean, default: false }, // Ready for future features
  status: { type: String, enum: ['PENDING', 'APPROVED', 'PAID'], default: 'PAID' } // Ready for approval workflows
}, { timestamps: true });

// Indexing for fast report generation
ExpenseSchema.index({ shopId: 1, date: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);