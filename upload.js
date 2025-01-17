import Koa from 'koa';
import Router from '@koa/router';
import { koaBody } from 'koa-body';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { getContentType } from './src/utils.js';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import helmet from 'koa-helmet';
import sanitize from 'sanitize-filename';

dotenv.config();

const app = new Koa();
const router = new Router();

// MongoDB connection configuration
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'fileDB';
let db, bucket;

// CORS middleware
app.use(cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Token']
}));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { 
      code: err.status || 500,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
    // 添加日志记录
    console.error('[Error]:', err);
  }
});

// 添加请求日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// Security headers
app.use(helmet());

// Initialize MongoDB connection
(async () => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
})();

// File upload middleware
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: path.join('./', '/temp'),
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10 MB limit
  },
}));

// Upload file and store in MongoDB
router.post('/api/upload', async (ctx) => {
  try {
    const { file } = ctx.request.files;
    const sanitizedFilename = sanitize(file.originalFilename || 'uploaded_file');
    const readStream = fs.createReadStream(file.filepath);

    const uploadStream = bucket.openUploadStream(sanitizedFilename);
    readStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    fs.unlinkSync(file.filepath);

    ctx.body = { code: 0, message: 'File uploaded to MongoDB successfully!', data: uploadStream.id };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { code: 1, message: 'File upload failed', error: error.message };
  }
});

// Download file
router.get('/api/download/:key', async (ctx) => {
  try {
    const { key } = ctx.params;

    if (!ObjectId.isValid(key)) {
      ctx.throw(400, 'Invalid file ID');
    }
    
    const id = ObjectId.createFromHexString(key);

    const file = await db.collection('uploads.files').findOne({ _id: id });

    if (!file) {
      ctx.throw(404, 'File not found');
    }

    const downloadStream = bucket.openDownloadStream(id);
    const mimeType = file.contentType || 'application/octet-stream';
    ctx.set('Content-Type', mimeType);
    const encodedFilename = encodeURIComponent(file.filename);
    ctx.set('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    ctx.body = downloadStream;
  } catch (error) {
    ctx.status = 404;
    ctx.body = { message: 'File not found', error: error.message };
  }
});

// Preview image
router.get('/api/preview/:key', async (ctx) => {
  try {
    const { key } = ctx.params;

    if (!ObjectId.isValid(key)) {
      ctx.throw(400, 'Invalid file ID');
    }

    const id = ObjectId.createFromHexString(key);

    const file = await db.collection('uploads.files').findOne({ _id: id });

    if (!file) {
      ctx.throw(404, 'File not found');
    }

    const mimeType = getContentType(file.filename);

    if (!mimeType) {
      ctx.throw(400, 'File is not an image');
    }

    ctx.set('Content-Type', mimeType);
    const downloadStream = bucket.openDownloadStream(id);
    ctx.body = downloadStream;
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = { message: error.message || 'Internal Server Error' };
  }
});

// Set routes
app.use(router.routes()).use(router.allowedMethods());

// Start server
app.listen(9999, () => {
  console.log('Server running on http://localhost:3000');
});


