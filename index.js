const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()
const jwt = require('jsonwebtoken');
// middlewares 

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dpklxw3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const postsCollection = client.db("forumDB").collection('posts')
    const usersCollection = client.db("forumDB").collection('users')
    const announcementCollection = client.db("forumDB").collection('announcement')

    // JWT related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.DB_TOKEN_SECRET, { expiresIn: '2h' })
      res.send({ token })
    })


        // midlleware

        const verifyToken = (req, res, next) => {
          console.log('token toke',req.headers.authorization);
          if(!req.headers.authorization){
              return res.status(401).send({message: 'unAuthorized access'})
          }
          const token = req.headers.authorization.split(' ')[1]
         jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded)=> {
              if(err){
                  return res.status(401).send({message: 'unAuthorized access'})
              }
              req.decoded = decoded;
              next()
         })
         
      }

    // post related apiii

    app.get('/posts', async (req, res) => {
      const result = await postsCollection.find().toArray()
      res.send(result)
    })
    app.get('/posts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await postsCollection.findOne(query)
      res.send(result)
    })

    app.post('/posts', async (req, res) => {
      const post = req.body;
      const result = await postsCollection.insertOne(post)
      res.send(result)
    })

    app.delete('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await postsCollection.deleteOne(query);
      res.send(result)
    })

    // users related api

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email', async(req, res)=> {
      const email = req.params.email
      // if( email !==  req.decoded.email){
      //   return  res.status(403).send({message: 'forbidden access'})
      // }
      const query = {email: email}
      const user =  await usersCollection.findOne(query)
      let admin = false
      if(user){
          admin = user?.role === 'admin'
      }
      res.send(admin)
  })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if it doesn't exist
      // you can do this in many ways ( 1. email, 2. upser, 3. simple cheacking)

      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'users already exixt', insertedId: null })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result)
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    // announcement related api

    app.get('/announcement' , async(req, res)=> {
      const result = await announcementCollection.find().toArray()
      res.send(result)
    })

    app.post('/announcement', async(req, res)=> {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement)
      res.send(result)
    })







    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('forum app is running')
})
app.listen(port, () => {
  console.log('forum app is running on', port);
})