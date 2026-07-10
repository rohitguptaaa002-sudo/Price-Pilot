const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    store: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    lastprice: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
    },
    inStock: {
      type: Boolean,
      default: false,
    },
    notify: {
      type: Boolean,
      default: true,
    },
    availablePincodes: {
      type: [String],
      default: []
    },
    unavailablePincodes: {
      type: [String],
      default: []
    },
    status: {
      type: String, default: 'Ready to Hunt'
    },

    user: {
  type: require("mongoose").Schema.Types.ObjectId,
  ref: "User",
  required: true,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);