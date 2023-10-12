const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
  name: String,
  email: String,
  address: String,
  restaurantName: String,
  dish: [
    {
      name: String,
      price: Number,
    }
  ],
});

const Order = model("Order", orderSchema);

module.exports = Order;