require('dotenv').config();

const fs = require('fs');
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');

const app = express();

const client = new MongoClient(`mongodb+srv:/sharvarip:${process.env.MONGO_PASS}@cluster0.hvwfi.mongodb.net/assignment-4`, {
  useUnifiedTopology: true,
});

let inventory; let
  counter;
client.connect((err, cl) => {
  const db = cl.db();
  inventory = db.collection('inventory');
  counter = db.collection('counter');
});

async function getNextSequence() {
  const result = await counter.findOneAndUpdate(
    { },
    { $inc: { count: 1 } },
    { returnOriginal: false },
  );
  return result.value.count;
}

const resolvers = {
  Query: {
    productList: async () => {
      try {
        const result = await inventory.find({}).toArray();
        return result;
      } catch (error) {
        return [];
      }
    },
  },
  Mutation: {
    addProduct: async (_, {
      Category, Price, Name, Image,
    }) => {
      const PRODUCT = {
        id: await getNextSequence(),
        Category,
        Price,
        Name,
        Image,
      };

      const result = await inventory.insertOne(PRODUCT);
      const savedIssue = await inventory.findOne({ _id: result.insertedId });
      return savedIssue;
    },
  },
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync('./schema.graphql', 'utf-8'),
  resolvers,
});

server.applyMiddleware({ app });

app.listen(process.env.API_SERVER_PORT, () => console.log('Listening on PORT', process.env.API_SERVER_PORT));
