const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const spotify = require('./spotify');
const bot = require('./bot');

app.get('/authorize', (req, res) => {
  const code = req.query.code;
  spotify.registerUser(code);
  console.log('new user registered via link');
  res.send('Success');
})

app.listen(port, () => {
  console.log(`App listening at https://tspotybot.herokuapp.com`);
})
