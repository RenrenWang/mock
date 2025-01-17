import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  accessToken: { type: String, unique: true },
  accessTokenExpiresAt: { type: Date },
  refreshToken: { type: String, unique: true },
  refreshTokenExpiresAt: { type: Date },
  client: { 
    id: { type: String, required: true }
  },
  user: {
    id: { type: String, required: true }
  }
});

export default mongoose.model('Token', tokenSchema);
