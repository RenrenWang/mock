import {Schema,model} from 'mongoose';

const clientSchema = new Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  grants: [String], // 支持的授权类型（如：authorization_code, password）
  redirectUris: [String] // 客户端允许的重定向URI
});

export default model('Client', clientSchema);


