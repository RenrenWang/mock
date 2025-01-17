
import {Schema,model} from 'mongoose';

const authorizationCodeSchema =new Schema({
    authorizationCode: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client' },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
  });

export default  model('AuthorizationCode', authorizationCodeSchema);
  