const net = require("net");
const parser = require('./parser');

/**
 * 只处理了json/urlEncoded两种简单格式
 * 分别对应post 和 get
 */
class Request {
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        if (this.headers["Content-Type"] === 'application/json') {
            this.bodyText = JSON.stringify(this.body);
        } else if (this.headers["Content-Type"] === 'application/x-www-form-urlencoded') {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }
        this.headers['Content-Length'] = this.bodyText.length;
    }

    /**
     * @param connection tcp 链接
     * @return {Promise<unknown>}
     */
    send(connection) {
        return new Promise((resolve, reject) => {
            const parser = new ResponseParser;
            // 如果已经有tcp链接则直接复用
            if (connection) {
                connection.write(this.toString());
            } else {
                // 否则新建一个
                connection = net.createConnection({
                    host: this.host,
                    port: this.port
                }, () => {
                    console.log(this.toString());
                    connection.write(this.toString());
                })
            }
            connection.on('data', data => {
                parser.receive(data.toString());
                if (parser.isFinished) {
                    resolve(parser.response);
                    connection.end();
                }
            });
            connection.on('error', err => {
                reject(err);
                connection.end();
            })
        })
    }

    /**
     * 构造HTTP请求文本
     * header每一行都是用\r\n来分隔的
     * body和header之间有一个空行, 故为\r\r
     * 多行字符串一定要注意格式，不能有任何多余的空白，不然就会请求失败
     * @return {string}
     */
    toString() {
        return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }
}

/**
 * 按照固定格式解析HTTP响应
 */
class ResponseParser {
    constructor() {
        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = "";
        this.headers = {};
        this.headerName = "";
        this.headerValue = "";
        this.bodyParser = null;
        this.isError = false;
    }

    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response() {
        this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            headers: this.headers,
            body: this.bodyParser.content.join('') // 连接字符
        }
    }

    receive(string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }

    WAITING_STATUS_LINE(c) {
        if (c === '\r') {
            return this.WAITING_STATUS_LINE_END;
        } else {
            this.statusLine += c;
            return this.WAITING_STATUS_LINE;
        }
    }

    WAITING_STATUS_LINE_END(c) {
        if (c === '\n') {
            return this.WAITING_HEADER_NAME;
        } else {
            return this.ERROR(c);
        }
    }

    WAITING_HEADER_NAME(c) {
        if (c === ':') {
            return this.WAITING_HEADER_SPACE;
        } else if (c === '\r') {
            // 没有解析到':'或任何header字符, 说明解析到了空行，意味着header解析完毕
            // 这里只针对chunked格式设置body
            if (this.headers['Transfer-Encoding'] === 'chunked') {
                this.bodyParser = new TrunkedBodyParser();
            }
            return this.WAITING_HEADER_BLOCK_END;
        } else {
            this.headerName += c;
            return this.WAITING_HEADER_NAME;
        }
    }

    WAITING_HEADER_SPACE(c) {
        if (c === ' ') {
            return this.WAITING_HEADER_VALUE;
        } else {
            return this.ERROR(c);
        }
    }

    WAITING_HEADER_VALUE(c) {
        if (c === '\r') {
            this.headers[this.headerName] = this.headerValue;
            this.headerName = "";
            this.headerValue = "";
            return this.WAITING_HEADER_LINE_END;
        } else {
            this.headerValue += c;
            return this.WAITING_HEADER_VALUE;
        }
    }

    WAITING_HEADER_LINE_END(c) {
        if (c === '\n') {
            return this.WAITING_HEADER_NAME;
        } else {
            return this.ERROR(c);
        }
    }

    WAITING_HEADER_BLOCK_END(c) {
        if (c === '\n') {
            return this.WAITING_BODY;
        } else {
            return this.ERROR(c);
        }
    }

    WAITING_BODY(c) {
        this.bodyParser.receiveChar(c);
        return this.WAITING_BODY;
    }

    ERROR(_) {
        if (!this.isError) {
            this.isError = true;
        }
        return this.ERROR;
    }

    receiveChar(c) {
        this.current = this.current(c);
    }
}

/** 解析流中的每一个chunk
 *  结构为长度后面跟着一个\r再接着一个trunk的内容
 * */
class TrunkedBodyParser {
    constructor() {
        this.length = 0;
        this.content = [];
        this.isFinished = false;
        this.isError = false;
        this.current = this.WAITING_LENGTH;
    }

    receiveChar(c) {
        this.current = this.current(c);
    }

    ERROR(_) {
        if (!this.isError) {
            this.isError = true;
        }
        return this.ERROR;
    }

    FINISHED(_) {
        return this.FINISHED;
    }

    WAITING_LENGTH(c) {
        // 在读length过程中遇到\r说明是空chunk，长度为0,
        // 也就意味着读取结束了。当前是最后一块
        if (c === '\r') {
            if (this.length === 0) {
                this.isFinished = true;
                return this.FINISHED;
            }
            return this.WAITING_LENGTH_LINE_END;
        } else {
            // length 是十六进制的，需要转换一下再加上，比如读一个0xAB
            // 先读A，再读B时得给A*16 + B
            this.length *= 16;
            this.length += parseInt(c, 16);
            return this.WAITING_LENGTH;
        }
    }

    WAITING_LENGTH_LINE_END(c) {
        if (c === '\n') {
            return this.READING_TRUNK;
        } else {
            return this.ERROR(c);
        }
    }

    READING_TRUNK(c) {
        this.content.push(c);
        this.length--;
        // 在length已经减到0时，也就意味着内容已经读取完毕，可以开始准备读取下一行了
        if (this.length === 0) {
            return this.WAITING_NEW_LINE;
        } else {
            return this.READING_TRUNK;
        }
    }

    WAITING_NEW_LINE(c) {
        if (c === '\r') {
            return this.WAITING_NEW_LINE_END;
        } else {
            return this.ERROR(c);
        }
    }

    WAITING_NEW_LINE_END(c) {
        if (c === '\n') {
            return this.WAITING_LENGTH;
        } else {
            return this.ERROR(c);
        }
    }
}

/**
 * 这个运算符能向期望一个表达式的值是undefined的地方插入会产生副作用的表达式。
 总是返回 undefined(即使全局变量中是undefined被重定义为其他内容)
 在函数前加void等于强制让函数返回值为undefined

 在使用立即执行的函数表达式时，可以利用 void 运算符
 让 JavaScript 引擎把一个function关键字识别成函数表达式而不是函数声明（语句）。

 关于构造一个iife，通常做法是
 (function foo(){})();
 但有一个弊端是如果不写分号并且同时存在多个iife，则会遇到:
 (function foo(){})()(function bar(){})()
 js 会认为第三个括号是一个函数调用的一部分，函数是前两个的返回值
 为了避免这个情况，人们通常加上
 !(function foo(){})
 从而使得返回值一定是布尔值，从而使得错误解析时立刻报错，避免巧合性运行
 在这里使用void，也是将后面的表达式结果强制指定为 undefined，从而也可以避免这个问题

 function() {} 本身作为函数声明属于 statement 语句,
 但由于前面加了个void 从而告诉引擎后面的是个表达式，从而使得可以不加括号直接运行（规范规定
 void 后面可以接任何unaryExpression， 但不能接类似于赋值这种语句
 */
void async function () {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: '8888',
        path: '/',
        headers: {
            ['x-hello']: 'world'
        },
        body: {
            name: 'tomoko'
        }
    });
    let response = await request.send();
    let dom = parser.parseHTML(response.body);
}();
