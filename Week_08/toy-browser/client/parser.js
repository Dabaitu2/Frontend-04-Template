const css = require('css');
const layout = require("./layout");
const EOF = Symbol('EOF');
const TokenType = {
    END_TAG: 'endTag',
    EOF: 'EOF',
    TEXT: 'text',
    START_TAG: 'startTag',
}
const ElementType = {
    ELEMENT: 'element',
    DOCUMENT: 'document',
    TEXT: 'text'
}

const MatchSelectorStatus = {
    normal: 'normal',
    class: 'class',
    noMatch: false
}

const complexSelectorRegex = /^([a-zA-Z]+)?(([.#]([^.#~*+]+))+)/;
let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
let stack = [{type: ElementType.DOCUMENT, children: []}];
let cssRules = [];

function computeSpecificity(selector) {
    let p = [0, 0, 0, 0];
    let selectorParts = selector.split(" ");
    for (let part of selectorParts) {
        if (part.match(complexSelectorRegex)) {
            const tagName = RegExp.$1;
            const actualSelector = RegExp.$2;
            if (tagName) {
                p[3] += 1;
            }
            actualSelector.split('.').slice(0).forEach(( cur) => {
                let className = (cur.split('#') || [])[0];
                if (className) {
                    p[2] += 1;
                }
            });
            actualSelector.split('#').slice(0).forEach(cur => {
                let id = (cur.split('.') || [])[0];
                if (id) {
                    p[1] += 1;
                }
            });
        } else if (part.charAt(0) === '#') {
            p[1] += 1;
        } else if (part.charAt(0) === '.') {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compareSpecificity(sp1, sp2) {
    // 相减 !== 0 ===> 两者不相等，简略写法
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1];
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2];
    }
    return sp1[3] - sp2[3];
}

function addCSSRules(text) {
    let ast = css.parse(text);
    cssRules.push(...ast.stylesheet.rules);
}

function matchSelector(element, selector) {
    if (!selector || !element.attributes) {
        return MatchSelectorStatus.noMatch;
    }

    /**
     * 匹配简单的 tagName.class#id 这种复合型选择器
     */
    if (selector.match(complexSelectorRegex)) {
        const tagName = RegExp.$1;
        const actualSelector = RegExp.$2;
        let ids = (element.attributes.filter(attr => attr.name === 'id')[0] || {value: ''}).value.split(/[\s]+/);
        let classNames = (element.attributes.filter(attr => attr.name === 'class')[0] || {value: ''}).value.split(/[\s]+/);
        let selectorClass = actualSelector.split('.').slice(0).reduce((acc, cur) => {
            let className = (cur.split('#') || [])[0];
            if (className) {
                acc.push(className);
            }
            return acc;
        }, []);
        let selectorIds = actualSelector.split('#').slice(0).reduce((acc, cur) => {
            let id = (cur.split('.') || [])[0];
            if (id) {
                acc.push(id);
            }
            return acc;
        }, []);
        if (tagName && tagName !== element.tagName) {
            return MatchSelectorStatus.noMatch;
        }
        for (const className of selectorClass) {
            if (!classNames.includes(className)) {
                return MatchSelectorStatus.noMatch;
            }
        }
        for (const selectorId of selectorIds) {
            if (!ids.includes(selectorId)) {
                return MatchSelectorStatus.noMatch;
            }
        }
        return MatchSelectorStatus.normal;
    } else if (selector.charAt(0) === '#') {
        let attr = element.attributes.filter(attr => attr.name === 'id')[0];
        if (attr && attr.value === selector.replace('#', '')) {
            return MatchSelectorStatus.normal;
        }
    } else if (selector.charAt(0) === ".") {
        let attr = element.attributes.filter(attr => attr.name === 'class')[0];
        let classnames = attr.value.split(/[\s]+/);
        if (classnames && classnames.includes(selector.replace('.', ''))) {
            return MatchSelectorStatus.class;
        }
    } else {
        if (element.tagName === selector) {
            return MatchSelectorStatus.normal;
        }
    }
    return MatchSelectorStatus.noMatch;
}

function computeCSS(element) {
    // 标签匹配是从从子元素开始寻找父元素进行匹配的
    // elements 包括了当前待 计算元素的 直接父元素以及一系列匹配的父元素
    let elements = stack.slice().reverse();
    if (!element.computedStyle) {
        element.computedStyle = {};
    }

    for (let cssRule of cssRules) {
        // 从内向外匹配
        let selectorParts = cssRule.selectors[0].split(" ").reverse();
        if (!matchSelector(element, selectorParts[0])) {
            continue;
        }
        // 是否成功匹配当前规则
        let matched = false;
        // 因为最终的子元素已经成功匹配，所以j直接从1开始，也就是当前selector的直接父selector
        let j = 1;
        // 检查当前的rule和解析栈能不能做到每一条规则都能在栈中元素得到匹配
        for (let i = 0; i < elements.length; i++) {
            let matchResult = matchSelector(elements[i], selectorParts[j]);
            if (matchResult) {
                j++;
            }
        }
        if (j >= selectorParts.length) {
            matched = true;
        }

        // 计算ComputedStyle
        if (matched) {
            let computedStyle = element.computedStyle;
            let specificity = computeSpecificity(cssRule.selectors[0]);
            for (let declaration of cssRule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {};
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].specificity = specificity;
                    computedStyle[declaration.property].value = declaration.value;
                } else if (compareSpecificity(computedStyle[declaration.property].specificity, specificity) < 0){
                    computedStyle[declaration.property].specificity = specificity;
                    computedStyle[declaration.property].value = declaration.value;
                }
            }
            console.log("Element", element, "matched rule", cssRule);
            console.log(element.computedStyle);
        }
    }
    // console.log(cssRules);
    // console.log('compute css for Element:', element);
}

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

        // 为当前元素应用css，cssRule 是个全局的东西，因此只需要获取当前的元素之后，就可以通过css的全局匹配去应用样式了
        // 这里应用的只是内联样式。see line 69
        computeCSS(element);
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
            if (top.tagName === 'style') {
                // content 中的文本就是 style 中的 css样式
                addCSSRules(top.children[0].content);
            }
            stack.pop();
        }
        // 遇到结束标签时可以对当前元素的内部进行flex布局
        layout(top);
        // 遇到结束标签时需要将当前文本节点置空
        currentTextNode = null;
    } else if (token.type === TokenType.TEXT) {
        if (currentTextNode === null) {
            currentTextNode = {
                type: ElementType.TEXT,
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
    return stack[0];
}

