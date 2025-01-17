// /models/authorizationCode.js
import mongoose from 'mongoose';

const AuthorizationCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  redirectUri: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export default mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
