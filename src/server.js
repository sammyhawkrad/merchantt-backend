import express from 'express';
import { MongoClient } from "mongodb";
import history from "connect-history-api-fallback";

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json())

app.use('/images', express.static('assets'));
app.use(express.static('dist', {maxAge: '1y', etag: false}));
app.use(history());

app.get('/api/products', async (req, res) => {
    const client = await MongoClient.connect(
      process.env.MONGO_USER && process.env.MONGO_PASS
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.x4slp.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
      : 'mongodb://127.0.0.1:27017',
      { useNewUrlParser: true, useUnifiedTopology: true}
    );
    const db = client.db(process.env.MONGO_DBNAME ||'merchanttdb');
    const products = await db.collection('products').find({}).toArray();
    res.status(200).json(products);
    client.close();
});

app.get('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params
  const client = await MongoClient.connect(
      process.env.MONGO_USER && process.env.MONGO_PASS
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.x4slp.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
      : 'mongodb://127.0.0.1:27017',
      { useNewUrlParser: true, useUnifiedTopology: true}
    );
  const db = client.db(process.env.MONGO_DBNAME ||'merchanttdb');
  const user = await db.collection('users').findOne({ id: userId });
  if (!user) return res.status(404).json('User not found!');
  const products = await db.collection('products').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(id => 
    products.find(product => product.id === id));
  res.status(200).json(cartItems);
  client.close();    

});

app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const client = await MongoClient.connect(
      process.env.MONGO_USER && process.env.MONGO_PASS
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.x4slp.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
      : 'mongodb://127.0.0.1:27017',
      { useNewUrlParser: true, useUnifiedTopology: true}
    );
    const db = client.db(process.env.MONGO_DBNAME ||'merchanttdb');
    const product = await db.collection('products').findOne({ id: productId });
    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404).json('Could not find the product!');
    };
    client.close();
    
  });
app.post('/api/users/:userId/cart', async (req, res) => {
  const { userId } = req.params;
  const { productId } = req.body;
  const client = await MongoClient.connect(
      process.env.MONGO_USER && process.env.MONGO_PASS
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.x4slp.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
      : 'mongodb://127.0.0.1:27017',
      { useNewUrlParser: true, useUnifiedTopology: true}
    );
  const db = client.db(process.env.MONGO_DBNAME ||'merchanttdb');
  await db.collection('users').updateOne({ id: userId }, {
    $addToSet: { cartItems: productId }
  });
  const products = await db.collection('products').find({}).toArray();
  const user = await db.collection('users').findOne({ id: userId });
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(id => 
    products.find(product => product.id === id));
  res.status(200).json(cartItems);
  client.close();

});

app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const client = await MongoClient.connect(
      process.env.MONGO_USER && process.env.MONGO_PASS
      ? `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.x4slp.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
      : 'mongodb://127.0.0.1:27017',
      { useNewUrlParser: true, useUnifiedTopology: true}
    );
  const db = client.db(process.env.MONGO_DBNAME || 'merchanttdb');
  await db.collection('users').updateOne({ id: userId }, {
    $addToSet: { cartItems: productId }
  });
  await db.collection('users').updateOne({ id: userId }, {
    $pull: { cartItems: productId }
  });
  const user = await db.collection('users').findOne({ id: userId });
  const products = await db.collection('products').find({}).toArray();
  const cartItemIds = user.cartItems;
  const cartItems = cartItemIds.map(id => 
    products.find(product => product.id === id));
  res.status(200).json(cartItems);
  client.close();
});

app.get('*', (req, res) => {
  res.sendFile('dist/index.html');
});

app.listen(process.env.PORT || 8000, () => {
    console.log('Server is listening on port: 8000');
});