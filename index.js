const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 8000;

app.use(
    cors({
        origin: [
            "http://localhost:3000",
        ],
        credentials: true
    })
);

app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const bannerCollection = client.db('WayGO').collection('BannerCollection');
        const usersCollection = client.db('WayGO').collection('users');
        const blogCollection = client.db('WayGO').collection('blogCollection');




        // Users Endpoints
        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });

        app.patch('/users/:email', async (req, res) => {
            const { email } = req.params;
            const { role, ids, userEmail, userName, } = req.body;

            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role,
                    userEmail,
                    userName,
                },
            };

            try {
                const result = await usersCollection.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: 'User not found' });
                }

                if (result.modifiedCount === 0) {
                    return res.status(400).send({ message: 'No changes made to the user' });
                }

                res.send({ message: 'User updated successfully', result });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Failed to update user' });
            }
        });

        app.put('/user', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email, name: user.displayName };
            const isExist = await usersCollection.findOne(query);
            if (isExist) {
                if (user.status === 'Requested') {
                    const result = await usersCollection.updateOne(query, {
                        $set: { status: user?.status },
                    });
                    return res.send(result);
                } else {
                    return res.send(isExist);
                }
            }

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    ...user,
                    timestamp: Date.now(),
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });

        // Banners Endpoints
        app.get('/banners', async (req, res) => {
            const banners = await bannerCollection.find().toArray();
            res.send(banners);
        });



        app.get('/blogs', async (req, res) => {
            const blog = await blogCollection.find().toArray();
            res.send(blog);
        });

        app.get('/blogs/:id', async (req, res) => {
            try {
                const id = req.params.id;  // Get the `id` from the route parameter
                const ObjectId = require('mongodb').ObjectId;  // MongoDB ObjectId helper

                // Find the blog by ID
                const blog = await blogCollection.findOne({ _id: new ObjectId(id) });

                if (!blog) {
                    return res.status(404).send({ message: 'Blog not found' });
                }

                res.send(blog);  // Send the blog data as the response
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error retrieving blog' });
            }
        });



        // Logout Endpoint
        app.get('/logout', async (req, res) => {
            try {
                res.clearCookie('token', {
                    maxAge: 0,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                }).send({ success: true });
            } catch (err) {
                res.status(500).send(err);
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });

    } finally {
        // Ensure the client connection closes properly on exit
        process.on('SIGINT', async () => {
            // await client.close();
            // console.log("Disconnected from MongoDB!");
            // process.exit(0);
        });
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('WayGo is sitting');
});
