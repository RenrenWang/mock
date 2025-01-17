// index.js
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import OAuth2Server from '@node-oauth/oauth2-server';
import connectDB from './config/database.js';
import authModel from './authModel.js';
import { Client, User } from './models/index.js';
import './config/env.js';
import crypto from 'crypto';
// 连接数据库
await connectDB();

const app = new Koa();
const router = new Router();

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = err.stack;
    }
    ctx.app.emit('error', err, ctx);
  }
});
// 使用中间件
app.use(bodyParser());

// 配置 OAuth2Server
const oauth = new OAuth2Server({
  model: authModel,
  accessTokenLifetime: 60 * 60,
  allowBearerTokensInQueryString: true
});

// 中间件
const obtainToken = async (ctx) => {

  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);

  try {
    
    const token = await oauth.token(request, response);
    ctx.body = token;
  } catch (error) {
    console.error('Access token error:', error);
    ctx.status = error.code || 500;
    ctx.body = error;
  }
};


const authenticateRequest = async (ctx, next) => {
  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);

  try {
    await oauth.authenticate(request, response);
    await next();
  } catch (error) {
    ctx.status = error.code || 500;
    ctx.body = error;
  }
};

// 路由定义
router
  .post('/oauth/token',obtainToken)
  .get('/secure', authenticateRequest, async (ctx) => {
    ctx.body = { message: 'Access granted to secure resource.' };
  })
  .post('/init', async (ctx) => {
    try {

      const { response_type, client_id, redirect_uri} = ctx.query;

      // 验证客户端和重定向 URI
      const client = await Client.findOne({ clientId: client_id });
      if (!client || !client.redirectUris.includes(redirect_uri)) {
        ctx.status = 400;
        ctx.body = { error: 'Invalid client or redirect URI' };
        return;
      }
    
      // 生成授权码
      const authorizationCode = new AuthorizationCode({
        authorizationCode: crypto.randomBytes(20).toString('hex'),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟有效期
        redirectUri: redirect_uri,
        client: client._id,
      });
      await authorizationCode.save();
    
      // 重定向回客户端并附带授权码
      const redirectUrl = `${redirect_uri}?code=${authorizationCode.authorizationCode}`;
      ctx.redirect(redirectUrl);

    // authorization_code: 适用于服务器端应用，安全性较高。
    // implicit: 适用于单页应用，安全性较低。
    // password: 适用于受信任的客户端，不适用于第三方应用。
    // client_credentials: 适用于机器对机器通信，不涉及用户授权。
    // refresh_token: 适用于延长访问令牌的有效期，通常与其他授权类型结合使用。
    //   // 创建测试客户端
    //  const result= await Client.create({
    //     clientId: 'app2',
    //     clientSecret: 'adddd_wwww',
    //     grants: ['authorization_code'],
    //     redirectUris: ['http://localhost:8899/callback']
    //   });
    //  console.log('result',result);
    //   // // 创建测试用户
    //   // await User.create({
    //   //   username: 'testUser',
    //   //   password: '123456'  // 实际应用中应该加密
    //   // });

    //   ctx.body = { message: 'Test data initialized successfully' };
    } catch (error) {
      console.error('Initialization error:', error);
      ctx.status = 500;
      ctx.body = { error: error.message };
    }
  });



// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 错误事件监听
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth2.0 server is running at http://localhost:${PORT}`);
});