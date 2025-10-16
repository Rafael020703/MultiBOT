const mongoose = require('mongoose');

const memberXPSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastMessage: { type: Date, default: null }
});

memberXPSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('MemberXP', memberXPSchema);
