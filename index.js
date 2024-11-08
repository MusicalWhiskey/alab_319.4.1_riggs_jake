import express from "express";
import "dotenv/config";
import grades from './routes/grades.js'

const PORT = process.env.PORT || 3000
const app = express();

// Body parser middleware
app.use(express.json())

// test db connection
// import "./db/conn.js"

app.get("/", (req, res) => {
  res.send(`Jake Riggs's ALAB_319.4.1`)
})

app.use("/grades", grades)

//Global Error handling middlware
app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).send("Seems went wrong.")
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`)
})