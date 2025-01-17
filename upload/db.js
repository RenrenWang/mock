import { MongoClient, GridFSBucket } from 'mongodb';

export async function connectDB(mongoURI, dbName, logger) {
  let db, bucket, client;
  if (!client || !client.isConnected()) {
    client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    logger.info('Connected to MongoDB');
  }
  return {
    db, bucket, client
  }
}
