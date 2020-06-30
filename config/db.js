const mongoose = require('mongoose');
const { mongoURI } = require('./default');

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        // console.log("MongoDb Connected...");
    } catch (e) {
        console.error(e.message);
        //exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB();