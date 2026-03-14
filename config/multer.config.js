const multer = require('multer')

// memoryStorage ka reason: pehle file RAM me aati hai, fir route se RTDB me push kar dete hain
const storage = multer.memoryStorage()

const upload  = multer ({
    storage:storage,
    unique:true
})

module.exports = upload
