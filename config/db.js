const mongoose = require('mongoose');

function connectToDb(){
    // .env ka MONGO_URI use karke MongoDB se connection ban raha hai
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        // ye log confirm karta hai ki DB ready hai
        console.log("connected to db")
    })
    .catch((error)=>{
        console.error("failed to connect db", error.message)
    })
}

module.exports = connectToDb;
