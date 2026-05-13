const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ⚠️ 必须完全一致
app.post('/api/contact', (req, res) => {

  console.log(req.body);

  res.json({
    success: true
  });

});

app.listen(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log("Server running");
});
