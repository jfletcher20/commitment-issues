import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.API_KEY;
const app = express();
const port = 3066;
const fulladdress = `http://localhost:${port}`;

app.use('/images', express.static('images'));

app.get('/', (req, res) => {
  res.send(`
  <body style="background-color:#333; color:white; font-family: sans-serif;">
    <div style="display: flex; justify-content: center; align-items: center; height: 90vh; flex-direction: column;">
      <img src="${fulladdress}/images/icon.png" alt="Logo" style="width: 300px; height: auto; margin-bottom: 20px;">
      <p style="text-align: center;">
        <span style="color: yellow;">Your API key is:</span>
        <code style="font-family: Consolas, monospace; color: #ddd;">${apiKey}</code>
      </p>
    </div>
  </body>
  `);
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});