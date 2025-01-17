// /controllers/oauthController.js
import oauth2 from '../services/oauthService.js';
import Client from '../models/client.js';
import OAuth2Server from '@node-oauth/oauth2-server';

export const getToken = async (ctx) => {

  const request = new OAuth2Server.Request(ctx.request);
  const response = new OAuth2Server.Response(ctx.response);
  try {
    const token = await oauth2.token(request, response);
    ctx.body = token;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { error: 'invalid_request', message: err.message };
  }
};

export const authorize = async (ctx) => {
  const { client_id, redirect_uri, response_type, scope } = ctx.request.query;
  
  // 验证 client_id 和其它参数
  const client = await Client.findOne({ clientId: client_id });
  if (!client) {
    ctx.status = 400;
    ctx.body = 'Invalid client';
    return;
  }

  ctx.body = `
    <form method="POST" action="/oauth/authorize">
      <p>Authorize the application?</p>
      <input type="hidden" name="client_id" value="${client_id}">
      <button type="submit">Authorize</button>
    </form>
  `;
};

export const authorizePost = async (ctx) => {
  const { client_id, redirect_uri } = ctx.request.body;
  // 生成授权码
  const code = Math.random().toString(36).substring(7);
  const authorizationCode = {
    authorizationCode: code,
    redirectUri: redirect_uri,
    expiresAt: new Date(Date.now() + 3600 * 1000)
  };

  // console.log('client',client_id);
  // await Client.create({clientId:"app6",clientSecret:"ddsdsdsds"});
 const client = await Client.findOne({ clientId: client_id });
  // await oauth2.options.model.saveAuthorizationCode(authorizationCode, client);
  ctx.body=client;
  // // 重定向到授权回调
  // ctx.redirect(`${redirect_uri}?code=${code}`);
};
