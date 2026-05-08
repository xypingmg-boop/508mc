const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.post("/inquiry", (req, res) => {
  console.log(req.body);

  res.json({
    success: true,
    message: "Inquiry received"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running");
});
