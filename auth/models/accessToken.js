// /models/accessToken.js
import mongoose from 'mongoose';

const AccessTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true }
});

export default mongoose.model('AccessToken', AccessTokenSchema);
