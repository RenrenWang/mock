import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import OAuth2Server from '@node-oauth/oauth2-server';
import connectDB from './config/database.js';
import authModel from './authModel.js';
import { Client, User } from './models/index.js';
import './config/env.js';

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
  console.log('request', request,response);
  try {
    const token = await oauth.token(request, response);
    ctx.body = token;
  } catch (error) {
    console.error('Access token error:', error);
    ctx.status = error.code || 500;
    ctx.body = { error: error.message };
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
    ctx.body = { error: error.message };
  }
};

// 路由定义
router
  .post('/api/oauth/token', obtainToken)
  .get('/secure', authenticateRequest, async (ctx) => {
    ctx.body = { message: 'Access granted to secure resource.' };
  })
  .post('/init', async (ctx) => {
    try {
      // 创建测试客户端
      const result = await Client.create({
        clientId: 'app3',
        clientSecret: 'adddd_wwww',
        grants: ['client_credentials'],
      });
      console.log('result', result);

      ctx.body = { message: 'Test data initialized successfully' };
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