import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';

export function isAllowedFile(filename) {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.txt', '.pdf'];
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}
export function removeTempFile(filepath) {
  fs.unlinkSync(filepath);
}
export function validateObjectId(key) {
  if (!ObjectId.isValid(key)) throw new Error('not found data');
  return new ObjectId(key);
}


export function getContentType(filename) {
    // 定义常见扩展名与 MIME 类型的映射表
    const mimeTypes = {
      // 文本文件
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      xml: "application/xml",
  
      // 图片文件
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
  
      // 视频文件
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mkv: "video/x-matroska",
  
      // 音频文件
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
  
      // 文档文件
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  
      // 压缩文件
      zip: "application/zip",
      tar: "application/x-tar",
      rar: "application/vnd.rar",
      gz: "application/gzip",
  
      // 默认二进制流
      bin: "application/octet-stream",
    };
    const extIndex = filename.lastIndexOf('.'); // 查找最后一个点的位置
  
    if (extIndex === -1) {
      throw new Error('No extension found in the filename');
    }
  
    // 提取扩展名并返回
    // 转换扩展名为小写
    const ext = filename.slice(extIndex + 1).toLowerCase();
  
    // 返回 MIME 类型或默认值
    return mimeTypes[ext] || "application/octet-stream";
  }
  