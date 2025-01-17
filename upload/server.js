import Koa from 'koa';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import path from 'path';
import { router } from './routes.js';
import { logger } from './logger.js';
import { koaMongoConnect } from './mongo-connect.js';
import  {config} from './config.js';

const app = new Koa();

// 全局注入 logger 以便在中间件或路由中使用
app.use(async (ctx, next) => {
  ctx.logger = logger;
  await next();
});

app.use(koaMongoConnect({ mongoURI: 'mongodb://localhost:27017', dbName:'fileDB' }));

app.use(cors({ origin: '*', credentials: true, allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization', 'X-Token'] }));
app.use(helmet());
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join('./', '/temp'),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024
  }
}));

app.use(async (ctx, next) => {
  const start = Date.now();
  try {
    await next();
  } catch (err) {
    logger.error(`[Error]: ${err.message}`);
    ctx.status = err.status || 500;
    ctx.body = { code: ctx.status, message: err.message };
  }
  logger.info(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(8090, () => logger.info('Server running on http://localhost:8090'));
