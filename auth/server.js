
import Koa from 'koa';
import Router from '@koa/router';
import koaBody from 'koa-bodyparser';
import OAuth2Server from '@node-oauth/oauth2-server';
import mongoose from 'mongoose';
import {connectDatabase}  from './config/database.js';

const { Schema } = mongoose;
connectDatabase()
// 用户模型
const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },  // 注意：密码需要加密存储
});

// 授权码（Authorization Code）模型
const AuthorizationCodeSchema = new Schema({
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client: { type: String, required: true },  // 客户端标识
});

// 访问令牌（Access Token）模型
const AccessTokenSchema = new Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  client: { type: String, required: true },
});

// 刷新令牌（Refresh Token）模型
const RefreshTokenSchema = new Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  client: { type: String, required: true },
});

const clientSchema = new Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  grants: [String], // 支持的授权类型（如：authorization_code, password）
  redirectUris: [String] // 客户端允许的重定向URI
});

const  Client=mongoose.model('Client', clientSchema);
// 引入模型
const User =mongoose.model('User', UserSchema);
const AuthorizationCode =mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
const AccessToken = mongoose.model('AccessToken', AccessTokenSchema);
const RefreshToken =mongoose.model('RefreshToken', RefreshTokenSchema);

// 创建 Koa 实例
const app = new Koa();
const router = new Router();

// 初始化 OAuth2 服务器
const oauth = new OAuth2Server({
  model: {
    getClient: async (clientId, clientSecret) => {
      const client = await Client.findOne({ clientId });
      if (!client) return null;
    
     
      console.log('client',{
        id: client.clientId,
        secret: client.clientSecret,
        grants: ['authorization_code'],
        redirectUris:client.redirectUris,
      });
      return {
        id: client.clientId,
        secret: client.clientSecret,
        grants: ['authorization_code'],
        redirectUris:client.redirectUris,
      };
    },
    saveAuthorizationCode: async (code, client, user) => {
      // 保存授权码
      const authorizationCode = new AuthorizationCode({
        code: code.authorizationCode,
        expiresAt: code.expiresAt,
        user: user._id,
        client: client.id,
      });
      await authorizationCode.save();
      return authorizationCode;
    },
    getAuthorizationCode: async (authorizationCode) => {
      // 查找授权码
      return await AuthorizationCode.findOne({ code: authorizationCode }).populate('user');
    },
    revokeAuthorizationCode: async (authorizationCode) => {
      // 撤销授权码
      await AuthorizationCode.deleteOne({ code: authorizationCode });
      return true;
    },
    saveToken: async (token, client, user) => {
      // 保存访问令牌
      const accessToken = new AccessToken({
        token: token.accessToken,
        expiresAt: token.expiresAt,
        user: user._id,
        client: client.id,
      });
      await accessToken.save();
      return accessToken;
    },
    getAccessToken: async (accessToken) => {
      // 查找访问令牌
      return await AccessToken.findOne({ token: accessToken }).populate('user');
    },
    revokeToken: async (token) => {
      // 撤销令牌
      await AccessToken.deleteOne({ token: token });
      return true;
    },
    saveRefreshToken: async (token, client, user) => {
      // 保存刷新令牌
      const refreshToken = new RefreshToken({
        token: token.refreshToken,
        expiresAt: token.expiresAt,
        client: client.id,
      });
      await refreshToken.save();
      return refreshToken;
    },
    getRefreshToken: async (refreshToken) => {
      // 查找刷新令牌
      return await RefreshToken.findOne({ token: refreshToken });
    },
    revokeRefreshToken: async (token) => {
      // 撤销刷新令牌
      await RefreshToken.deleteOne({ token: token });
      return true;
    },
  },
});

// 中间件：OAuth 认证
const authenticateRequest = async (ctx, next) => {
  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);
  try {
    const token = await oauth.authenticate(request, response);
    ctx.state.user = token.user; // 保存用户信息
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
  }
};

// 授权端点
router.get('/authorize', async (ctx) => {
  // 处理用户授权，通常这里要有一个页面让用户确认是否授权
  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);
  
  try {

   const authorizationCode = await oauth.authorize(request, response);
    ctx.body = authorizationCode;
  } catch (err) {
    console.log('request',err);
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

// 获取令牌端点
router.post('/token', async (ctx) => {
  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);
  
  try {
    const token = await oauth.token(request, response);
    ctx.body = token;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

// API 端点（需要认证）
router.get('/protected', authenticateRequest, async (ctx) => {
  ctx.body = { message: 'This is a protected resource', user: ctx.state.user };
});
router.get('/callback', authenticateRequest, async (ctx) => {
  ctx.body = ctx.query;
});

// 启动 Koa 应用
app.use(koaBody());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('OAuth2 server running on http://localhost:3000');
});