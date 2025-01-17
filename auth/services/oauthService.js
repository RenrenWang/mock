// /services/oauthService.js
import OAuth2Server from '@node-oauth/oauth2-server';
import Client from '../models/client.js';
import AuthorizationCode from '../models/authorizationCode.js';
import AccessToken from '../models/accessToken.js';
import User from '../models/user.js';
const oauth2 = new OAuth2Server({
  model: {
    getClient: async (clientId, clientSecret) => {
      return await Client.findOne({ clientId, clientSecret });
    },
    getUserFromClient: async (client) => {
          // 你可以根据你的业务逻辑获取与客户端关联的用户
      return await User.findOne({ clientId: client._id });
    },
    saveAuthorizationCode: async (code, client, user) => {
        console.log('code',client);
      const authorizationCode = new AuthorizationCode({
        code: code.authorizationCode,
        client: client._id,
        redirectUri: code.redirectUri,
        // user: user._id,
        expiresAt: code.expiresAt
      });

      await authorizationCode.save();
      return authorizationCode; // 需要返回一个保存后的授权码对象
    },
    getAuthorizationCode: async (authorizationCode) => {
      return await AuthorizationCode.findOne({ code: authorizationCode });
    },
    revokeAuthorizationCode: async (authorizationCode) => {
      return await AuthorizationCode.deleteOne({ code: authorizationCode.code });
    },
    saveToken: async (token, client, user) => {
      const accessToken = new AccessToken({
        token: token.accessToken,
        client: client._id,
        user: user._id,
        expiresAt: token.accessTokenExpiresAt
      });

      await accessToken.save();
      return accessToken; // 需要返回一个保存后的访问令牌对象
    },
    getAccessToken: async (accessToken) => {
      return await AccessToken.findOne({ token: accessToken });
    },
    revokeToken: async (token) => {
      return await AccessToken.deleteOne({ token: token.accessToken });
    },
    verifyScope: async (token, scope) => {
      return true; // 可以根据需求调整 scope 校验
    }
  }
});

export default oauth2;
