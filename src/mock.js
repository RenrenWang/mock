export const mock = async (ctx, next) => {
  const { url, method } = ctx.req;

  if (url && method) {
    const collection = await ctx.app.db('mock_interfaces');
    const result = await collection.findOne({
      url,
      method
    });

    if (result) {
      ctx.status = result.status
      ctx.body = result.response;
    }
  }

  await next();
}