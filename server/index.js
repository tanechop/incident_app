import express from "express";

const app = express()
app.use(express.json());
app.post("/login", (req, res) => {
    console.log("Data receive");
    console.log(req.body);
    res.json({
        message: "login request receive",
        data:req.body
    });
});
// start the server
app.listen(3000,() => {
    console.log("server is running on port 3000")
})