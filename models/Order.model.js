const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
  name: String,
  email: String,
  address: String,
  restaurantName: String,
  total: {
    type: Number,
    required: [true, "total is required."],
    default: 0,
  },
  dish: [
    {
      name: String,
      price: Number,
    },
  ],
});

const Order = model("Order", orderSchema);

module.exports = Order;
