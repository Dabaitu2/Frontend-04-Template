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
        #container {
            width: 500px;
            height: 300px;
            display: flex;
            background-color: rgb(255,255,255);
        }
        body div div#myid.hello {
            width: 200px;
            height: 100px;
            background-color: rgb(255,123,111);
        }
        body div div.hi.yes {
            flex: 1;
            background-color: rgb(212,255,111);
        }
    </style>
</head>
    <body>
        <div id="container">
            <div id="myid" class="hello"/>
            <div class="hi yes"/>
        </div>
    </body>
</html>
`);
    })
}).listen(8888);


