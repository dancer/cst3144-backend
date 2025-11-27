// express server for academy lessons api
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import path from 'path'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

// esm dirname workaround
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// create express app
const app = express()
const port = process.env.PORT || 3000

// database connection
let db
let client

// environment variables
const mongodburi = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/academy'
const jwtsecret = process.env.JWT_SECRET || 'fallback_secret'

// connect to mongodb atlas database
async function connecttodb() {
  client = new MongoClient(mongodburi, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000
  })

  await client.connect()
  // verify connection with ping
  await client.db('admin').command({ ping: 1 })
  db = client.db('academy')
  console.log('connected to mongodb atlas successfully')
}

// logger middleware - logs all requests to console
function loggermiddleware(req, res, next) {
  const timestamp = new Date().toISOString()
  const method = req.method
  const url = req.url
  const ip = req.ip || req.connection.remoteAddress
  
  // log incoming request
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`)
  
  // intercept response to log status code
  const originalSend = res.send
  res.send = function(body) {
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode}`)
    return originalSend.call(this, body)
  }
  
  next()
}

// static file middleware - serves images from public folder
function staticfilemiddleware(req, res, next) {
  if (req.url.startsWith('/images/')) {
    const filename = req.url.substring(8)
    const filepath = path.join(__dirname, 'public', 'images', filename)
    
    // check if file exists and serve it
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath)
    } else {
      res.status(404).json({ error: 'image not found' })
    }
  } else {
    next()
  }
}

// enable cors for frontend - allow all origins for github pages compatibility
app.use(cors())

// parse json request bodies
app.use(express.json())
// use custom middleware
app.use(loggermiddleware)
app.use(staticfilemiddleware)

// get all lessons
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray()
    res.status(200).json(lessons)
  } catch (error) {
    console.error('error fetching lessons:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// get single lesson by id
app.get('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'lesson id is required' })
    }

    // convert string id to objectid
    let objectid
    try {
      objectid = ObjectId.isValid(id) ? new ObjectId(id) : id
    } catch {
      return res.status(400).json({ error: 'invalid lesson id format' })
    }

    const lesson = await db.collection('lessons').findOne({ _id: objectid })

    if (!lesson) {
      return res.status(404).json({ error: 'lesson not found' })
    }

    res.status(200).json(lesson)
  } catch (error) {
    console.error('error fetching lesson:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// create new order
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, lessonids, spaces } = req.body
    const authheader = req.headers.authorization

    if (!name || !phone || !lessonids || !spaces) {
      return res.status(400).json({ error: 'missing required fields' })
    }

    let userid

    if (authheader && authheader.startsWith('Bearer ')) {
      const token = authheader.substring(7)
      try {
        const decoded = jwt.verify(token, jwtsecret)
        userid = decoded.userid
      } catch (err) {
        console.log('invalid token, creating order without user association')
      }
    }

    const neworder = {
      name: name.trim(),
      phone: phone.trim(),
      lessonids: lessonids,
      spaces: spaces,
      userid: userid,
      createdat: new Date(),
      status: 'confirmed'
    }

    // insert order into database
    const result = await db.collection('orders').insertOne(neworder)
    res.status(201).json({
      message: 'order created successfully',
      orderid: result.insertedId
    })
  } catch (error) {
    console.error('error creating order:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// update lesson attributes (e.g. spaces after booking)
app.put('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updatedata = req.body
    
    if (!id) {
      return res.status(400).json({ error: 'lesson id is required' })
    }
    
    if (!updatedata || Object.keys(updatedata).length === 0) {
      return res.status(400).json({ error: 'update data is required' })
    }
    
    // validate and extract fields to update
    const updatefields = {}
    
    if (updatedata.topic !== undefined) {
      if (typeof updatedata.topic !== 'string' || updatedata.topic.trim() === '') {
        return res.status(400).json({ error: 'topic must be a non-empty string' })
      }
      updatefields.topic = updatedata.topic
    }
    
    if (updatedata.location !== undefined) {
      if (typeof updatedata.location !== 'string' || updatedata.location.trim() === '') {
        return res.status(400).json({ error: 'location must be a non-empty string' })
      }
      updatefields.location = updatedata.location
    }
    
    if (updatedata.price !== undefined) {
      if (typeof updatedata.price !== 'number' || updatedata.price < 0) {
        return res.status(400).json({ error: 'price must be a non-negative number' })
      }
      updatefields.price = updatedata.price
    }
    
    if (updatedata.spaces !== undefined) {
      if (typeof updatedata.spaces !== 'number' || updatedata.spaces < 0) {
        return res.status(400).json({ error: 'spaces must be a non-negative number' })
      }
      updatefields.spaces = updatedata.spaces
    }
    
    if (updatedata.icon !== undefined) {
      if (typeof updatedata.icon !== 'string') {
        return res.status(400).json({ error: 'icon must be a string' })
      }
      updatefields.icon = updatedata.icon
    }
    
    if (updatedata.description !== undefined) {
      if (typeof updatedata.description !== 'string') {
        return res.status(400).json({ error: 'description must be a string' })
      }
      updatefields.description = updatedata.description
    }
    
    const validfields = ['topic', 'location', 'price', 'spaces', 'icon', 'description']
    const invalidfields = Object.keys(updatedata).filter(key => !validfields.includes(key))
    if (invalidfields.length > 0) {
      return res.status(400).json({ error: `invalid fields: ${invalidfields.join(', ')}` })
    }
    
    let objectid
    try {
      objectid = ObjectId.isValid(id) ? new ObjectId(id) : id
    } catch {
      return res.status(400).json({ error: 'invalid lesson id format' })
    }
    
    const result = await db.collection('lessons').updateOne(
      { _id: objectid },
      { $set: updatefields }
    )
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'lesson not found' })
    }
    
    res.status(200).json({ 
      message: 'lesson spaces updated successfully',
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('error updating lesson:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// search lessons by topic, location, description, price or spaces
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q
    
    // return all lessons if no query
    if (!query || query.trim() === '') {
      const lessons = await db.collection('lessons').find({}).toArray()
      return res.status(200).json(lessons)
    }
    
    const searchterm = query.trim()
    
    // build search filter with regex for text fields
    const searchfilter = {
      $or: [
        { topic: { $regex: searchterm, $options: 'i' } },
        { location: { $regex: searchterm, $options: 'i' } },
        { description: { $regex: searchterm, $options: 'i' } }
      ]
    }
    
    // also search numeric fields if query is a number
    const numericquery = parseFloat(searchterm)
    if (!isNaN(numericquery)) {
      searchfilter.$or.push({ price: numericquery })
      searchfilter.$or.push({ spaces: numericquery })
    }
    
    const results = await db.collection('lessons').find(searchfilter).toArray()
    res.status(200).json(results)
  } catch (error) {
    console.error('error searching lessons:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// register new user
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' })
    }

    // check if email already exists
    const existinguser = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (existinguser) {
      return res.status(400).json({ error: 'email already registered' })
    }

    // hash password before storing
    const hashedpassword = await bcrypt.hash(password, 10)

    const newuser = {
      email: email.toLowerCase(),
      password: hashedpassword,
      name,
      createdat: new Date()
    }

    const result = await db.collection('users').insertOne(newuser)

    const token = jwt.sign(
      { userid: result.insertedId, email: email.toLowerCase() },
      jwtsecret,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: result.insertedId,
        email: email.toLowerCase(),
        name
      }
    })
  } catch (error) {
    console.error('error registering user:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// login existing user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    // find user by email
    const user = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ error: 'invalid email or password' })
    }

    // verify password
    const isvalidpassword = await bcrypt.compare(password, user.password)
    if (!isvalidpassword) {
      return res.status(401).json({ error: 'invalid email or password' })
    }

    // generate jwt token
    const token = jwt.sign(
      { userid: user._id, email: user.email },
      jwtsecret,
      { expiresIn: '7d' }
    )

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('error logging in:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// get orders for logged in user
app.get('/orders', async (req, res) => {
  try {
    const authheader = req.headers.authorization

    if (!authheader || !authheader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'authorization required' })
    }

    const token = authheader.substring(7)
    let decoded

    try {
      decoded = jwt.verify(token, jwtsecret)
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' })
    }

    // get all orders for this user
    const orders = await db.collection('orders').find({ userid: new ObjectId(decoded.userid) }).toArray()

    // get lesson details for each order
    const orderswithllessons = await Promise.all(orders.map(async (order) => {
      const lessons = await Promise.all(order.lessonids.map(async (lessonid) => {
        const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonid) })
        return lesson
      }))

      return {
        ...order,
        lessons: lessons.filter(l => l !== null),
        total: lessons.filter(l => l !== null).reduce((sum, l) => sum + l.price, 0)
      }
    }))

    res.status(200).json(orderswithllessons)
  } catch (error) {
    console.error('error fetching orders:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// update order status (e.g. mark as completed)
app.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const authheader = req.headers.authorization

    if (!authheader || !authheader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'authorization required' })
    }

    const token = authheader.substring(7)
    let decoded

    try {
      decoded = jwt.verify(token, jwtsecret)
    } catch (err) {
      return res.status(401).json({ error: 'invalid token' })
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' })
    }

    const validstatuses = ['confirmed', 'completed', 'cancelled']
    if (!validstatuses.includes(status)) {
      return res.status(400).json({ error: 'invalid status' })
    }

    let objectid
    try {
      objectid = new ObjectId(id)
    } catch {
      return res.status(400).json({ error: 'invalid order id' })
    }

    // verify order belongs to user
    const order = await db.collection('orders').findOne({ _id: objectid })
    if (!order) {
      return res.status(404).json({ error: 'order not found' })
    }

    if (order.userid.toString() !== decoded.userid) {
      return res.status(403).json({ error: 'not authorized to update this order' })
    }

    const result = await db.collection('orders').updateOne(
      { _id: objectid },
      { $set: { status: status } }
    )

    res.status(200).json({ message: 'order status updated', modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error('error updating order:', error)
    res.status(500).json({ error: 'internal server error' })
  }
})

// root endpoint - returns api info
app.get('/', (req, res) => {
  res.json({
    message: 'academy api server',
    endpoints: {
      'GET /lessons': 'get all lessons',
      'GET /lessons/:id': 'get lesson by id',
      'POST /orders': 'create new order',
      'PUT /lessons/:id': 'update lesson spaces',
      'GET /search?q=query': 'search lessons',
      'POST /auth/register': 'register new user',
      'POST /auth/login': 'login user'
    }
  })
})

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'endpoint not found' })
})

// start server and connect to database
async function startserver() {
  await connecttodb()
  
  app.listen(port, () => {
    console.log(`academy api server running on http://localhost:${port}`)
    console.log(`endpoints:`)
    console.log(`  GET /lessons - get all lessons`)
    console.log(`  POST /orders - create new order`)
    console.log(`  PUT /lessons/:id - update lesson spaces`)
    console.log(`  GET /search?q=query - search lessons`)
  })
}

// run server
startserver().catch(console.error)

