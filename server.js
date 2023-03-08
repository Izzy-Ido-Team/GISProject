const express = require('express');

var app = new express();

app.use(express.static('site'));

app.listen(3020, () => {
    console.log('Server is running on port 3020');
});