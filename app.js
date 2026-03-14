const express= require('express');
const userRouter = require('./routes/user.routes')
const dotenv = require('dotenv')
// env variables (MONGO_URI, JWT_SECRET) start me load ho jaye isliye yahan config call hai
dotenv.config();
const connectToDb = require('./config/db')
// server start hote hi DB connect kara rahe hain, taaki routes pe query fail na ho
connectToDb();
const cookieParser = require('cookie-parser')
const indexRouter = require('./routes/index.routes')

const app = express();
app.set('view engine','ejs')
// login token cookie me aata hai, isliye cookie parser mandatory hai
app.use(cookieParser())
// JSON + form data dono accept karne ke liye ye dono middleware rakhe hain
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// home/upload wale routes
app.use('/', indexRouter);
// user auth wale routes
app.use('/user',userRouter)

app.use((req, res) => {
    const acceptHeader = req.headers.accept || "";

    if (acceptHeader.includes("text/html")) {
        return res.status(404).send("Page not found");
    }

    return res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    console.error("Unhandled error:", err.message);

    const acceptHeader = req.headers.accept || "";
    if (acceptHeader.includes("text/html")) {
        return res.status(500).send("Something went wrong");
    }

    return res.status(500).json({ message: "Internal server error" });
});

app.listen(5000,()=>{
    console.log("Server is running at 5000");
})
