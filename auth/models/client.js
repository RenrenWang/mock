// /models/client.js
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  grants: { type: [String], required: true },
  redirectUris: { type: [String], required: true }
});

export default mongoose.model('Client', ClientSchema);
