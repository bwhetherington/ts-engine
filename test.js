const fs = require('fs');
const file = fs.readFileSync('static/assets/images/icon.png', 'base64');
console.log(file.toString('base64'));
const base64 = file.toString('base64');
const buf = Buffer.from(base64, 'base64');

fs.writeFileSync('test.png', buf);
