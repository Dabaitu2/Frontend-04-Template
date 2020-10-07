const http = require('http');

http.createServer((req, res) => {
    let body = [];
    req.on('error', err => {
        console.error(err);
    }).on('data', chunk => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.log('body:', body);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(
`<html maaa="a">
<head>
    <style>
        body div #myid {
            width: 100px;
            background-color:#ff5000;
        }
        body div img {
            width: 30px;
            background-color:#ff1111;
        }
    </style>
    <body>
        <div>
            <img id="myid"/>
            <img />
        </div>
    </body>
</head>
</html>
`);
    })
}).listen(8888);


