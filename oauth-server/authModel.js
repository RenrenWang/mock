// authModel.js
import { Client, User, AccessToken } from './models/index.js';

const authModel = {
  getClient: async (clientId, clientSecret) => {
    const client = await Client.findOne({ clientId, clientSecret });
    if (!client) throw new Error('Invalid client credentials');
    return {
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      grants: client.grants,
      redirectUris: client.redirectUris,
    };
  },

  getUser: async (username, password) => {
    const user = await User.findOne({ username, password });
    if (!user) throw new Error('Invalid user credentials');
    return user;
  },

  saveToken: async (token, client, user) => {
    const accessToken = new AccessToken({
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client: client._id,
      user: user._id,
    });
    await accessToken.save();
    return token;
  },

  getAccessToken: async (accessToken) => {
    const token = await AccessToken.findOne({ accessToken }).populate('client user');
    if (!token) throw new Error('Invalid access token');
    return token;
  },

  // 其他 OAuth2 模型方法...
};

export default authModel;
