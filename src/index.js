import Koa from 'Koa'
import { db } from './db.js'
import { mock } from './mock.js'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import { ObjectId } from 'mongodb'
import KoaBody from 'koa-body'
// /Users/wrr/Desktop/mongodb-macos-aarch64-8.0.3/bin
// sudo  ./mongod --dbpath ./db
const app = new Koa()
const router = new Router()
// app.use(bodyParser({
//   multipart: true
// }))
app.use(KoaBody({
  multipart: true,
  formidable: {
    uploadDir: './temp', // 上传路径
    keepExtensions: true, // 保留扩展名
    maxFieldsSize: 2 * 1024 * 1024 // 2M
  }
}))

app.use(db)
app.use(mock)

router.get('/api/mock/history', async ctx => {
  const collection = await ctx.app.collection('mock_interface_history')
  const result = collection.find({})
  const list = await result.toArray()
  ctx.body = list
})

router.get('/api/mock', async (ctx, next) => {
  const collection = await ctx.app.collection('mock_interfaces')
  const result = collection.find({})
  const list = await result.toArray()
  ctx.body = list
})

router.get('/api/mock/:id', async ctx => {
  const id = ctx.params.id
  const collection = await ctx.app.collection('mock_interfaces')
  const result = collection.findOne({ _id: id })
  ctx.body = result
})
router.delete('/api/mock/:id', async ctx => {
  const id = ctx.params.id
  const collection = await ctx.app.collection('mock_interfaces')
  const result = collection.deleteOne({ _id: id })
  ctx.body = result
})

router.put('/api/mock', async ctx => {
  const {
    id,
    url,
    method,
    description,
    params,
    response,
    headers,
    status,
    delay
  } = ctx.request.body

  if (!id) {
    ctx.body = {
      code: 1,
      success: false,
      message: 'Missing required fields'
    }
    return
  }

  if (!url && !method && !description && !params && !response && !headers && !status && !delay) {
    ctx.body = {
      code: 1,
      success: false,
      message: 'Missing required fields'
    }
    return
  }
  const updateId = new ObjectId(String(id))
  const collection = await ctx.app.collection('mock_interfaces');
  const resultOne = await collection.findOne({
    _id: updateId
  });

  if (!resultOne) {
    ctx.body = {
      code: 1,
      success: false,
      message: `Mock interface not found: ${id}`
    }
    return
  }

  const updateData = {
    url: url || resultOne?.url,
    method: method || resultOne?.method,
    description: description || resultOne?.description,
    params: params || resultOne?.params,
    response: response || resultOne?.response,
    headers: headers || resultOne?.headers,
    status: status || resultOne?.status,
    delay: delay || resultOne?.delay,
    updatedAt: new Date().getTime()
  }

  const result = await collection.updateOne(
    { _id: updateId },
    {
      $set: updateData
    }
  )
  if (result?.modifiedCount) {
    const collectionHistory = await ctx.app.collection('mock_interface_history');
    await collectionHistory.insertOne({
      interface_id: id,
      timestamp: new Date().getTime(),
      configuration: updateData
    })
    ctx.body = {
      code: 0,
      success: true,
      message: 'Update mock interface success'
    }
    return;
  }

  ctx.body = {
    code: 1,
    success: false,
    message: 'Update mock interface failed'
  }
})


router.post('/api/mock', async ctx => {
  const {
    url,
    method,
    description,
    params,
    response,
    headers,
    status,
    delay
  } = ctx.request.body

  if (
    !url ||
    !method ||
    !description ||
    !params ||
    !response ||
    !headers ||
    !status
  ) {
    ctx.body = {
      code: 1,
      success: false,
      message: 'Missing required fields'
    }
    return
  }

  const collection = await ctx.app.collection('mock_interfaces')
  const findOneResult = await collection.findOne({
    url,
    method
  })

  if (findOneResult) {
    ctx.body = {
      code: 1,
      success: false,
      message: 'Url already exists'
    }
    return
  }

  const result = await collection.insertOne({
    url,
    method,
    description,
    params,
    headers,
    response,
    status,
    delay,
    createdAt: new Date().getTime()
  })

  ctx.body = {
    code: 0,
    success: true,
    data: result.insertedIds,
    message: 'Create mock interface success'
  }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, () => {
  console.log('server start at http://localhost:3000')
})
