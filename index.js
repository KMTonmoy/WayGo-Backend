const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
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
  },
});

async function run() {
  try {
    // await client.connect();
    console.log('Connected to MongoDB');

    const bannerCollection = client.db('WayGO').collection('BannerCollection');
    const usersCollection = client.db('WayGO').collection('users');
    const blogCollection = client.db('WayGO').collection('blogCollection');
    const busCollection = client.db('WayGO').collection('busCollection');
    const paymentCollection = client.db("WayGO").collection("payments");
    const couponsCollection = client.db('WayGO').collection('coupons');
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
      const { role, ids, userEmail, userName } = req.body;

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
          return res
            .status(400)
            .send({ message: 'No changes made to the user' });
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

    app.get('/allbus', async (req, res) => {
      try {
        const allbus = await busCollection.find().toArray();
        res.send(allbus);
      } catch (error) {
        console.error('Error fetching allbus:', error);
        res.status(500).send({ error: 'Failed to fetch allbus' });
      }
    });

    app.get('/allbus/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const bus = await busCollection.findOne(query);
      res.send(bus);
    });


    app.get('/banners', async (req, res) => {
      try {
        const banners = await bannerCollection.find().toArray();
        res.send(banners);
      } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).send({ error: 'Failed to fetch banners' });
      }
    });

    app.post('/banners', async (req, res) => {
      const banner = req.body;

      if (!banner || !banner.url || !banner.heading || !banner.description) {
        return res.status(400).send({ error: 'Invalid banner data' });
      }

      try {
        const result = await bannerCollection.insertOne({
          url: banner.url,
          heading: banner.heading,
          description: banner.description,
          timestamp: Date.now(),
        });
        res
          .status(201)
          .send({ message: 'Banner uploaded successfully', result });
      } catch (error) {
        console.error('Error uploading banner:', error);
        res.status(500).send({ error: 'Failed to upload banner' });
      }
    });

    app.patch('/banners/:id', async (req, res) => {
      const id = req.params.id;
      const { url, heading, description } = req.body;

      if (!url && !heading && !description) {
        return res.status(400).send({ error: 'No fields provided for update' });
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...(url && { url }),
          ...(heading && { heading }),
          ...(description && { description }),
        },
      };

      try {
        const result = await bannerCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Banner not found' });
        }

        res.send({ message: 'Banner updated successfully', result });
      } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).send({ error: 'Failed to update banner' });
      }
    });

    app.put('/banners/:id', async (req, res) => {
      const id = req.params.id;
      const { url, heading, description } = req.body;

      if (!url && !heading && !description) {
        return res.status(400).send({ error: 'No fields provided for update' });
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...(url && { url }),
          ...(heading && { heading }),
          ...(description && { description }),
        },
      };

      try {
        const result = await bannerCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Banner not found' });
        }

        res.send({ message: 'Banner updated successfully', result });
      } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).send({ error: 'Failed to update banner' });
      }
    });

    app.post('/addbus', async (req, res) => {
      const bus = req.body;

      try {
        const result = await busCollection.insertOne(bus);
        res.status(201).send({
          message: 'Bus added successfully',
          busId: result.insertedId,
        });
      } catch (error) {
        console.error('Error adding bus:', error);
        res.status(500).send({ error: 'Failed to add bus' });
      }
    });

    app.delete('/banners/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await bannerCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: 'Banner not found' });
        }

        res.send({ message: 'Banner deleted successfully' });
      } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).send({ error: 'Failed to delete banner' });
      }
    });
    app.delete('/allbus/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await busCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).send({ error: 'Bus not found' });
        }

        res.send({ message: 'Bus deleted successfully' });
      } catch (error) {
        console.error('Error deleting Bus:', error);
        res.status(500).send({ error: 'Failed to delete Bus' });
      }
    });

    app.get('/blogs', async (req, res) => {
      const blog = await blogCollection.find().toArray();
      res.send(blog);
    });

    app.get('/blogs/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const ObjectId = require('mongodb').ObjectId;

        const blog = await blogCollection.findOne({ _id: new ObjectId(id) });

        if (!blog) {
          return res.status(404).send({ message: 'Blog not found' });
        }

        res.send(blog);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error retrieving blog' });
      }
    });

   


    app.get('/searchbus', async (req, res) => {
      try {
        const { from, to } = req.query;

        // Check if 'from' and 'to' are the same
        if (from && to && from.toLowerCase() === to.toLowerCase()) {
          return res.status(400).send({ message: "From and To locations can't be the same! 🚫🚌" });
        }

        // Create a dynamic filter object based on the query parameters
        const filter = {};
        if (from) filter.from = from;
        if (to) filter.to = to;

        // Fetch buses that match the filter
        const buses = await busCollection.find(filter).toArray();

        // Check if no buses were found
        if (buses.length === 0) {
          return res.status(404).send({ message: 'No buses available for the selected route.' });
        }

        // Check for reverse match in the database
        const reverseMatch = await busCollection.find({
          from: to,
          to: from
        }).toArray();

        if (reverseMatch.length > 0) {
          return res.status(404).send({ message: 'No buses available for the selected route.' });
        }

        res.send(buses);
      } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).send({ error: 'Failed to fetch buses' });
      }
    });





    // Coupons Endpoints
    app.get('/coupons', async (req, res) => {
      const coupons = await couponsCollection.find().toArray();
      res.send(coupons);
    });



    app.patch('/coupons/:id', async (req, res) => {
      const { id } = req.params;
      const coupon = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          code: coupon.code,
          discount: coupon.discount,
          description: coupon.description,
        },
      };
      try {
        const result = await couponsCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: 'Coupon not found' });
        }
        res.send({ acknowledged: true });
      } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).send({ message: 'Failed to update coupon' });
      }
    });

    app.post('/coupons', async (req, res) => {
      const coupon = req.body;
      const result = await couponsCollection.insertOne(coupon);
      res.send(result);
    });

    app.delete('/coupons/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await couponsCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/coupons/:id', async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const coupon = await couponsCollection.findOne(query);
      res.send(coupon);
    });




    // Payment related API
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = Math.round(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.get('/payments', async (req, res) => {
      const payment = await paymentCollection.find().toArray();
      res.send(payment);
    });


    app.get('/payments/:email', async (req, res) => {
      const email = req.params.email;
      const result = await paymentCollection.find({ email }).toArray();
      res.send(result);
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);

      res.send({ result });
    });





    // Logout Endpoint
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } finally {
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
