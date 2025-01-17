import fs from 'fs';
import sanitize from 'sanitize-filename';
import crypto from 'crypto';
import md5 from 'md5';
import { isAllowedFile, getContentType, removeTempFile, validateObjectId } from './utils.js';


const secret = crypto.createHash('sha256').update('wrr-2024-upload-secret').digest().slice(0, 16); // 16 bytes key for AES-128
const ivLength = 16; // 16 bytes IV for AES-128

function encrypt(text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv('aes-128-cbc', secret, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}-${encrypted}`.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decrypt(encrypted) {
  const [ivBase64, encryptedText] = encrypted.replace(/-/g, '+').replace(/_/g, '/').split('-');
  const iv = Buffer.from(ivBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', secret, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateEncryptedKey(fileId) {
  const expiration = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour
  const data = `${fileId}-${expiration}`;
  return encrypt(data);
}
export function upload() {
  return async (ctx) => {
    try {
      const { file } = ctx.request.files;
      const sanitizedFilename = sanitize(file.originalFilename || 'uploaded_file');
      if (!isAllowedFile(sanitizedFilename)) {
        ctx.status = 400;
        ctx.body = { code: 400, message: 'Unsupported file type' };
        return;
      }
      const readStream = fs.createReadStream(file.filepath);
      const uploadStream = ctx.bucket.openUploadStream(sanitizedFilename);
      readStream.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      removeTempFile(file.filepath);

      const key=generateEncryptedKey(uploadStream.id);

      ctx.body = { code: 0, message: 'Upload success', data:key };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { code: 500, message: 'Upload failed', error: error.message };
    }
  }
}

export function download() {
  return async (ctx) => {
    try {
      const encryptedData = validateObjectId(ctx.params.key);

      const decryptedData = decrypt(encryptedData);
      const [fileId, expires] = decryptedData.split('-');

      if (Date.now() / 1000 > expires) {
        ctx.status = 403;
        ctx.body = { code: 403, message: 'Expired URL' };
        return;
      }

      const fileInfo = await ctx.db.collection('uploads.files').findOne({ _id: fileId });
      if (!fileInfo) throw new Error('File not found');
      ctx.set('Content-Type', fileInfo.contentType || 'application/octet-stream');
      const encodedName = encodeURIComponent(fileInfo.filename);
      ctx.set('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);
      ctx.body = ctx.bucket.openDownloadStream(fileId);
    } catch (error) {
      ctx.status = 404;
      ctx.body = { code: 404, message: error.message };
    }
  };
}



export function preview() {
  return async (ctx) => {
    try {
     const encryptedKey = ctx.params.key;
      
      const decryptedData = decrypt(encryptedKey);
      const [fileId, expires] = decryptedData.split('-');
        
      if (!fileId||!expires||Date.now() / 1000 > expires) {
        ctx.status = 403;
        ctx.body = { code: 403, message: 'Expired URL' };
        return;
      }
     
     console.log("fileId",fileId);
     const id=validateObjectId(fileId)
      const fileInfo = await ctx.db.collection('uploads.files').findOne({ _id: id});
      if (!fileInfo) throw new Error('File not found');
      const mimeType = getContentType(fileInfo.filename);
      if (!mimeType) throw new Error('File is not an image');
      ctx.set('Content-Type', mimeType);
      ctx.body = ctx.bucket.openDownloadStream(id);
    } catch (error) {
      ctx.status = 400;
      ctx.body = { code: 400, message: error.message };
    }
  };
}

export function getAllFiles() {
  return async (ctx) => {
    try {
      const files = await ctx.db.collection('uploads.files').find({}).toArray();
      ctx.body = { code: 0, message: 'Success', data: files };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { code: 500, message: 'Failed to retrieve images', error: error.message };
    }
  };
}