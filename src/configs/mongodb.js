require("dotenv").config();

class MongoDB {
  constructor() {
    this.mongoose = require("mongoose");
    this.connectString = process.env.MONGO_CONNECT_STRING;
  }

  async connect() {
    try {
      await this.mongoose.connect(this.connectString);
      return console.log(`Connect MongoDB successfully`);
    } catch (err) {
      return console.log(`Error connecting to MongoDB`);
    }
  }
}

module.exports = new MongoDB();
