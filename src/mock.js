

import mockUpload from './mock-upload'
const sleep = (time) => {
  return new Promise(resolve => setTimeout(resolve, 1000 * time));
}

export const mock = async (ctx, next) => {
  const { url, method } = ctx.req;

  if (url && method) {
    const collection = await ctx.app.collection('mock_interfaces');
    const result = await collection.findOne({
      url,
      method
    });

    if (result?.delay) {
      await sleep(result.delay);
    }

    if (result?.type === 'file') {
       await mockUpload({ db: ctx.app.db })(ctx, next);
    }

    if (result) {
      ctx.status = result.status
      ctx.body = result.response;
    }
  }

  await next();
}