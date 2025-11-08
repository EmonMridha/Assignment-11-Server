require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId, ServerDescription } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v9x5iie.mongodb.net/?appName=Cluster0`;

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

        const volunteerPostCollection = client.db('Volunteer').collection('posts')
        const volunteerPostRequests = client.db('Volunteer').collection('requests')

        // Posting API
        app.post('/posts', async (req, res) => {
            const post = req.body; // Getting the post data from the request
            post.number = parseInt(post.number);
            const result = await volunteerPostCollection.insertOne(post)// Sending the post data to the db and saving the confirmation message here
            res.send(result); // Sending the confirmation message to the client
        })

        // Requesting post
        app.post('/requests', async (req, res) => {
            const request = req.body; // Getting the post data from the request
            const result = await volunteerPostRequests.insertOne(request)// Sending the requested data to the db and saving the confirmation message here
            res.send(result); // Sending the confirmation message to the client
        })

        // This only decreases the number of volunteer and updated posts. It is never called. It is only for updating data.
        app.patch('/posts/:id/decrease', async (req, res) => {
            const id = req.params.id; // Getting the id from the request
            const query = { _id: new ObjectId(id) }; // Converting into mongodbId
            const updateDoc = { $inc: { number: -1 } } // Inc is a mongo operator that increments and decrements a number
            const result = await volunteerPostCollection.updateOne(query, updateDoc); // commanding mongo to update doc with updateDoc matching with query and save the confirmation message here
            res.send(result); // Sending the confirmation message to the client
        })

        // Update post data
        app.patch('/posts/:id', async (req, res) => {
            try {
                const id = req.params.id // Getting the Id from the URL
                const updatedPost = req.body; // Getting the updated data from the frontend from request
                const query = { _id: new ObjectId(id) }; // converting into mongodb id
                const updatedDoc = {
                    $set: {
                        photo: updatedPost.photo,
                        title: updatedPost.title,
                        description: updatedPost.description,
                        category: updatedPost.category,
                        location: updatedPost.location,
                        number: updatedPost.number,
                        deadline: updatedPost.deadline,
                    }
                }

                const result = await volunteerPostCollection.updateOne(query, updatedDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating post' })
            }
        })

        // Getting one post by id
        app.get('/posts/:id', async (req, res) => {
            const id = req.params.id //Getting the id form req
            const query = { _id: new ObjectId(id) }; // converting the id into mongodb id
            const result = await volunteerPostCollection.findOne(query)
            res.send(result)
        })

        // Get data by title
        app.get('/posts/search', async (req, res) => {
            try {
                const { title } = req.query; // Get query ?title=something
                const query = title ? { title: { $regex: title, $options: 'i' } } : {};

                const result = await volunteerPostCollection.find(query).toArray();
                res.send(result)
            }
            catch (error) {
                console.log(error);
                res.status(500).send({ message: 'Server Error' });
            }
        })

        // Get post data by an email
        app.get('/posts/byEmail/:email', async (req, res) => {
            const email = req.params.email; // Get email from the url
            const query = { organizerEmail: email };
            const result = await volunteerPostCollection.find(query).toArray(); // fnd data 
            res.send(result)
        })

        // Get request data by an email
        app.get('/posts/byEmail/request/:email', async (req, res) => {
            const email = req.params.email;
            const query = { volunteerEmail: email };
            const result = await volunteerPostRequests.find(query).toArray();
            res.send(result)
        })

        // Get all the requests
        app.get('/requests', async (req, res) => {
            const result = await volunteerPostRequests.find().toArray();
            res.send(result)
        })


        // Getting all the posts
        app.get('/posts', async (req, res) => {
            const result = await volunteerPostCollection.find().toArray();
            res.send(result)
        })

        //Delete posts
        app.delete('/posts/:id', async (req, res) => {
            const id = req.params.id; // Getting the id from the requested url
            const query = { _id: new ObjectId(id) }; // Converting into mongodbId
            const result = await volunteerPostCollection.deleteOne(query); // Commanding to delete the data matching with the query and saving the confirmation message here
            res.send(result) // sending the confirmation message to the client
        })

        // Delete Reqs
        app.delete('/requests/:id', async(req,res)=>{
            const id = req.params.id; // Getting the id from the url
            const query ={_id: new ObjectId(id)}; // Converting into mongodbId
            const result = await volunteerPostRequests.deleteOne(query); // Commanding mongodb to delete the data matching with the query and saving the confirmation message here
            res.send(result); // Sending the confirmation message to the client
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
    res.send('Volunteer server is cooking')
})

app.listen(port, () => {
    console.log(`Volunteer server is running on port ${port}`);
})