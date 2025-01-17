import { MongoClient, GridFSBucket } from 'mongodb';

export function koaMongoConnect({ mongoURI, dbName }) {
  let db, bucket, client;
  return async (ctx, next) => {
    if (!client || !client?.isConnected?.()) {
      client = new MongoClient(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      await client.connect();
      db = client.db(dbName);
      bucket = new GridFSBucket(db, { bucketName: "uploads" });
      ctx.logger.info("Connected to MongoDB");
      ctx.db = db;
      ctx.bucket = bucket;
    }

    await next();
  };
}
