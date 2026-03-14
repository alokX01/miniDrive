const Firebase = require('firebase-admin') 
const serviceAccount = require('../drive-e30d5-firebase-adminsdk-fbsvc-d2238073c5.json')

// Firebase Admin SDK init: yahan RTDB use ho raha hai (Cloud Storage bucket nahi)
const firebase = Firebase.initializeApp({
    // service account se backend trusted access milta hai
    credential: Firebase.credential.cert(serviceAccount),
    // file metadata/data abhi RTDB me save ho raha hai, isliye databaseURL diya hai
    databaseURL : 'https://drive-e30d5-default-rtdb.firebaseio.com'
})


module.exports = Firebase;
