
import fs from 'fs'
import { GridFSBucket } from 'mongodb';

export function koaMongoUpload({ db, bucketName = 'uploads', tempDir = './temp' }) {
  // Ensure temporary directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const bucket = new GridFSBucket(db, { bucketName });

  return async (ctx, next) => {
    const file = ctx.request.files?.file;
    if (!file) {
      ctx.throw(400, 'No file uploaded');
    }

    // Read file stream from temporary file
    const readStream = fs.createReadStream(file.filepath);

    // Upload file to GridFS
    const uploadStream = bucket.openUploadStream(file.originalFilename || 'uploaded_file');
    readStream.pipe(uploadStream);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    // Remove temporary file
    fs.unlinkSync(file.filepath);

    ctx.body = { message: 'File uploaded to MongoDB successfully!', data: uploadStream.id };
  }
  // return async (ctx, next) => {
  //   if (ctx.method === 'POST' && ctx.path === '/upload') {
  //     const file = ctx.request.files?.file;

  //     if (!file) {
  //       ctx.throw(400, 'No file uploaded');
  //     }

  //     // Read file stream from temporary file
  //     const readStream = fs.createReadStream(file.filepath);

  //     // Upload file to GridFS
  //     const uploadStream = bucket.openUploadStream(file.originalFilename || 'uploaded_file');
  //     readStream.pipe(uploadStream);

  //     await new Promise((resolve, reject) => {
  //       uploadStream.on('finish', resolve);
  //       uploadStream.on('error', reject);
  //     });

  //     // Remove temporary file
  //     fs.unlinkSync(file.filepath);

  //     ctx.body = { message: 'File uploaded to MongoDB successfully!', fileId: uploadStream.id };

  //   } else if (ctx.method === 'GET' && ctx.path.startsWith('/download/')) {
  //     const filename = ctx.path.replace('/download/', '');

  //     try {
  //       const downloadStream = bucket.openDownloadStreamByName(filename);
  //       ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
  //       ctx.body = downloadStream;
  //     } catch (err) {
  //       ctx.status = 404;
  //       ctx.body = { message: 'File not found' };
  //     }
  //   } else {
  //     await next();
  //   }
  // };
}


