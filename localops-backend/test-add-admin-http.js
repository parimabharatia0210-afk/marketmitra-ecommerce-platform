const http = require('http');

const data = JSON.stringify({
  name: "Test",
  email: "test@test.com",
  password: "password123"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/add',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjljMDM4YzhiMzkyYTgzNjVlYjk2OGE3IiwibmFtZSI6IlNuZWhhIEJhZGFsIiwiZW1haWwiOiJiYWRhbHNuZWhhMjIxMEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzQzMjc4NTksImV4cCI6MTc3NDM1NjY1OX0.7csQo81i142euqrA5MxEkx_cGNT27FwpyLnDqxM3y0E'
  }
};

const req = http.request(options, (res) => {
  let output = '';
  res.on('data', d => output += d);
  res.on('end', () => console.log('Status:', res.statusCode, '\nBody:', output));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
