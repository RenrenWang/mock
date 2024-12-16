import Koa from 'koa'
import Router from '@koa/router'
import { koaBody } from 'koa-body'
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb'
import fs from 'fs'
import path from 'path'
import { getContentType } from './src/utils.js'

const app = new Koa();
const router = new Router();

// MongoDB 连接配置
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'fileDB';
let db, bucket;

// 初始化 MongoDB 连接
(async () => {
  const client = new MongoClient(mongoURI);
  await client.connect();
  db = client.db(dbName);
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  console.log('Connected to MongoDB');
})();

// 文件上传中间件
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join('./', '/temp'), // 临时存储目录
      keepExtensions: true, // 保留扩展名
    },
  })
);
const sleep = (time) => {
  return new Promise(resolve => setTimeout(resolve, 1000 * time));
}
// 上传文件并存储到 MongoDB
router.post('/api/upload', async (ctx) => {

  const { file } = ctx.request.files;
  const readStream = fs.createReadStream(file.filepath);

  // 将文件存储到 GridFS
  const uploadStream = bucket.openUploadStream(file.originalFilename || 'uploaded_file');
  readStream.pipe(uploadStream);

  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });

  // 删除临时文件
  fs.unlinkSync(file.filepath);

  ctx.body = { code: 0, message: 'File uploaded to MongoDB successfully!', data: uploadStream.id };
});

// 下载文件
router.get('/api/download/:key', async (ctx) => {
  const { key } = ctx.params;
  const id = new ObjectId(String(key))

  const file = await db.collection('uploads.files').findOne({ _id: id });

  if (!file) {
    ctx.throw(404, 'File not found');
  }

  try {


    const downloadStream = bucket.openDownloadStream(new ObjectId(String(key)));
    const mimeType = file.contentType || 'application/octet-stream'; // 默认类型为二进制文件
    ctx.set('Content-Type', mimeType);
    // 修正 Content-Disposition，避免因特殊字符导致错误
    const encodedFilename = encodeURIComponent(file?.filename);
    ctx.set(
      'Content-Disposition',
      `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    ctx.body = downloadStream;
  } catch (err) {
    console.error(err);
    ctx.status = 404;
    ctx.body = { message: 'File not found' };
  }
});
// 图片预览接口
router.get('/api/preview/:key', async (ctx) => {
  const key = ctx.params.key;

  try {
    const file = await db.collection('uploads.files').findOne({ _id: new ObjectId(String(key)) });

    if (!file) {
      ctx.throw(404, 'File not found');
    }

    const mimeType = getContentType(file?.filename);

    if (!mimeType) {
      ctx.throw(400, 'File is not an image');
    }

    ctx.set('Content-Type', mimeType);

    const downloadStream = bucket.openDownloadStreamByName(file?.filename);
    ctx.body = downloadStream;

  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { message: err.message || 'Internal Server Error' };
  }
});
// 设置路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
