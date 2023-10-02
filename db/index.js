// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");
const saveDataToDatabase = require("../data/saveDataToMongo");

// ℹ️ Sets the MongoDB URI for our app to have access to it.
// If no env has been set, we dynamically set it to whatever the folder name was upon the creation of the app

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb+srv://projectfood321:Ironhack321@cluster0.fmnd3pc.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp";

  mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((x) => {
    const databaseName = x.connections[0].name;
    console.log(`Connected to Mongo! Database name: "${databaseName}"`);
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
