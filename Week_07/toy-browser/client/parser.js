const EOF = Symbol('EOF');
const TokenType = {
    END_TAG: 'endTag',
    EOF: 'EOF',
    TEXT: 'text',
    START_TAG: 'startTag',
}
const ElementType = {
    ELEMENT: 'element',
    DOCUMENT: 'document'
}
let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
let stack = [{type: ElementType.DOCUMENT, children: []}]

function emit(token) {
    // 这里之所以不用pop, 是因为只是需要得到这个元素，把它作为即将入栈元素的父元素而已
    let top = stack[stack.length - 1];

    // 如果是开始标签，需要创建元素，
    // 并判断是不是要入栈
    if (token.type === TokenType.START_TAG) {
        let element = {
            type: ElementType.ELEMENT,
            children: [],
            attributes: []
        }

        element.tagName = token.tagName;

        // 处理属性
        for (let p in token) {
            if (p !== 'type' && p !== 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }

        // 确定父子链接
        top.children.push(element);
        element.parent = top;

        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentTextNode = null;
        // 反之，则判断是否和当前栈顶是同一个类型的tag，不是就会报错
    } else if (token.type === TokenType.END_TAG) {
        if (top.tagName !== token.tagName) {
            throw new Error('Tag Start and End doesn\'t match!');
        } else {
            stack.pop();
        }
        currentTextNode = null;
    } else if (token.type === TokenType.TEXT) {
        if (currentTextNode === null) {
            currentTextNode = {
                type: TokenType.TEXT,
                content: ''
            };
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }
}

/**
 * 本节配合 浏览器工作原理与实践 22 | DOM树：JavaScript是如何影响DOM树构建的？效果更佳
 * 通过堆栈来分析页面
 * 1. 文本节点不用入栈，所以可以直接生成出一个dom节点
 * 2. Tag 节点需要先入栈，等startTag遇到对应的endTag时才可以出栈组合出一个dom节点
 * 将HTML进行词法分割的步骤交由FSM 有限状态机来处理
 * data 是全局的首个状态, 用于表示接收到数据
 * @see https://whatwg-cn.github.io/html/#tokenization
 * @param c
 */
function data(c) {
    if (c === '<') {
        return tagOpen;
    } else if (c === EOF) {
        // 不作任何返回，也就是状态机会直接报错
        emit({
            type: TokenType.EOF
        })
        return;
    } else {
        // 正是因为这种每一个字符都单独作为token的方式，才使得rangeAPI有操作空间
        emit({
            type: TokenType.TEXT,
            content: c
        })
        // 否则继续试探下一个字符是否有数据
        return data;
    }
}

/**
 * 标签开始状态 <
 * @param c
 */
function tagOpen(c) {
    if (c === '/') {
        return endTagOpen;
        // 匹配单英文字符
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: TokenType.START_TAG,
            tagName: ""
        }
        return tagName(c);
    } else {
        return;
    }
}

/**
 * 关闭标签开始状态 </
 * @param c
 * @return {function(*): (function(*)|undefined)}
 */
function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: TokenType.END_TAG,
            tagName: ""
        }
        return tagName(c);
    } else if (c === '>') {

    } else if (c === EOF) {

    } else {

    }
}

/**
 * 标签名状态 <X || </X
 * @param c
 * @return {beforeAttributeName}
 */
function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c;
        return tagName;
    } else if (c === '>') {
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}

function beforeAttributeName(c) {
    // 各种空白，退格，禁止符都继续尝试读取name
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '=') {
        return;
    } else {
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributeName(c);
    }
}

function attributeName(c) {
    // 遇到这些字符就认为已经读完属性名了
    if (c.match(/^[\t\n\f ]$/) || c === "/" || c === '>' || c === EOF) {
        return afterQuotedAttributeValue(c);
    } else if (c === "=") {
        return beforeAttributeValue;
    } else if (c === '\u0000') {
        // 就是 null 字符

    } else if (c === "\"" || c === "'" || c === '<') {

    } else {
        currentAttribute.name += c;
        return attributeName;
    }
}

function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeValue;
    } else if (c === "\"") {
        return doubleQuotedAttributeValue;
    } else if (c === "\'") {
        return singleQuotedAttributeValue;
    } else if (c === "/" || c === ">" || c === EOF) {
        // 遇到这几种应该 报错
        // return data;
    } else {
        return unQuotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

/**
 * 在遇到结尾的单引号之前持续录入
 * @param c
 */
function singleQuotedAttributeValue(c) {
    if (c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return singleQuotedAttributeValue;
    }
}

function unQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else if (c === '\"' || c === "'" || c === '<' || c === '=' || c === "`") {

    } else {
        currentAttribute.value += c;
        return unQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '\u0000') {

    } else if (c === EOF) {

    } else {

    }
}

function selfClosingStartTag(c) {
    if (c === '>') {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {

    }
}


module.exports.parseHTML = function ParseHTML(html) {
    let state = data;
    for (let c of html) {
        state = state(c);
    }
    state = state(EOF);
    console.log(stack);
}
