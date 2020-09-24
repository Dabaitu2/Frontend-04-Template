# 一般命令式编程语言的设计方式
1. Atom 原子式

```
Identifier， Literal
e.g:
var, let, 'hello', 123 ...
```
2. Expression 表达式

```
Atom， Operator, punctuator
e.g:
+, -, *, / ... 包含原子式
```
3. Statement 语句

```
Expression, KeyWord, punctuator
e.g:
while, for ... 包含了表达式
```
4. Structure 结构

```
Function, class, Process, namespace,...
```
5. Program 程序

```
moudle, package, library, program
```
## JavaScript Atom
### Grammar：
- Literal    字面量
- Variable   变量
- Keywords    关键字
- WhiteSpace   空白符
- LineTerminator   行终结符

### Runtime
- Types 类型
    - Number
    - String
    - Boolean
    - Object
    - Null
    - Undefined
    - Symbol
        - 如果不提供相关变量导出，用户无法在运行时获得这个属性。这个属性不会被注册到表中。
        - 如果使用Symbol.for倒是可以，因为会被注册到一个表中
    - BigInt
- Execution Context 执行上下文


### Number
#### Grammar
- DecimalLiteral
    - `0`
    - `0.`
    - `.2`
    - 1e3
- BinaryIntegerLiteral
    - 0b111
- OctalIntegerLiteral
    - 0o10 
- HexIntegerLiteral
    - 0xFF

### String
编码规定了如何用码点来映射字符
#### Character  字符
字符是文本的基本单位，他可以有通过多个码点构成，通常用unicode规定的码点来表示字符。
#### Code Point 码点
代码点是信息的原子单位。文本是代码点的序列。每个代码点都是一个数字，该数字由Unicode标准赋予含义
#### Encoding 编码
unicode 是计算机科学领域的业界标准，它包括字符集（有哪些字符），编码方案（怎么把码点转化为字符)等。unicode为每种语言中的每个字符设定了统一且唯一的二进制编码。通常用两个字节16位表示一个字符。所以unicode可以组合出65535种不同的字符。
因此，对于unicode来说，他就是规定了一个字符由两个字节16位的独一无二组合构成。
由于英文符号只需要用到低8位，所以其高8位永远是0，因此保存英文文本时会多浪费一倍的空间。
为了节省空间，在计算机中会使用不同的编码方案来对unicode进行编码，比如utf-8,utf-16等。

| unicode | utf-8  |
| --- | --- |
| 000000-00007F | 0xxxxxxx  |  |
| 000080-0007FF | 110xxxxx 10xxxxxx |  |
| 000800-00FFFF | 1110xxxx 10xxxxxx 10xxxxxx |
| 010000-10FFFF | 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx |

从表格可以发现，utf-8用1-4个字节来表示unicode字符
第一个字节的前几位作为控制位，开头有几个1说明当前字节由几个字符组成。且后面几位都会以10开头，如果开头没有则说明仅一个字节。


### Object
通过广度优先算法，通过计算对象集合中的getter，setting和属性中的对象，统计出js中的固有对象
```JS

var set = new Set();
var objects = [
    eval,
    isFinite,
    isNaN,
    parseFloat,
    parseInt,
    decodeURI,
    decodeURIComponent,
    encodeURI,
    encodeURIComponent,
    Array,
    Date,
    RegExp,
    Promise,
    Proxy,
    Map,
    WeakMap,
    Set,
    WeakSet,
    Function,
    Boolean,
    String,
    Number,
    Symbol,
    Object,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    ArrayBuffer,
    SharedArrayBuffer,
    DataView,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray,
    Atomics,
    JSON,
    Math,
    Reflect];
objects.forEach(o => set.add(o));

for(var i = 0; i < objects.length; i++) {
    var o = objects[i]
    for(var p of Object.getOwnPropertyNames(o)) {
        var d = Object.getOwnPropertyDescriptor(o, p)
        if( (d.value !== null && typeof d.value === "object") || (typeof d.value === "function"))
            if(!set.has(d.value))
                set.add(d.value), objects.push(d.value);
        if( d.get )
            if(!set.has(d.get))
                set.add(d.get), objects.push(d.get);
        if( d.set )
            if(!set.has(d.set))
                set.add(d.set), objects.push(d.set);
    }
}
```

## Js expression 表达式以及优先级顺序
### 1.Member 运算
```js
a.b
a[b]
foo`string`
super.b
super['b']
new.target
new Foo()
```

ps:
#### Reference 类型
当我们使用类似`a.b`这样的方式取得对象属性的时候，取得的并不是一个‘值’，而是一个引用**Reference**。也就是说，`a.b`这个member运算表达式的结果是一个引用，并且代表了`a,b`的结果.
##### 定义
一个Reference 分为两个部分，为`Object`(js中的对象) 和 `Key`（string/symbol)

##### 相关语法
当我们使用**delete** 或者 **assign** 这样的语法特性时，就会使用到**Reference类型**，因为它需要知道我们要用到哪一个对象的哪一个key，而不仅仅只是**‘把一个值赋值给一个变量’**或者是**‘删除一个值’**。这里推荐看下周爱民老师的文章。实际上，delete做的事情是“删除一个表达式的结果”。

##### 两个例子
假设，我们要执行
```JS
// a.b = 3
delete a.b;
```
这实际的运作过程是，首先获得表达式的结果，即引用'a.b',然后通过内部方法`getValues`求得它的值为3.最后删除引用'a.b'的值。从而使得引用‘a.b’指向undefined。

---
再假设，我们要执行
```js
a.b = 3;
```
如果a.b 是一个值，那么这段的语法就不成立，因为js是不允许对一个值去赋值的。因此`a.b`肯定是别的东西。在这里，他就是引用，并且，js在这里并不会使用内部方法`getValues`去将他转化为值类型，理由已经说明了。

--- 
##### 结论:
当你确定了一个Result用作lrs，那么它就是引用；如果确定它用作rhs，那么它就是值（将由引擎隐式地调用`GetValue()`）。

### 2. New 运算
```JS
new Foo
```
如下例子
```
new a()() -> (new a())()
new new a() -> new (new a())
```

### 3. Call 运算
```JS
foo()
super()
foo()['b'] // 本身作为member运算优先级，由于在调用语法之后，降级为call运算的优先级
foo().b
foo()`abc`
``` 

如下例子
```
new a()['b'] -> (new a())['b']
```

### 4.Right Handside Expression 右手运算 
不能放到等式左边的表达式，
**从这一级开始，所有的运算表达式都是RHS, 他们的优先级依旧依次降低。**
### 5. Update 运算
```js
a++
a--
++a
--a
```
举个RHS的例子
```js
let a = 1
++ a ++
// 结果是？
// => Uncaught SyntaxError: 
// Invalid left-hand side 
// expression in prefix operation

// REASON: 不管是 a++ 还是 ++a 都是一个RHS
// 而RHS的Result 会被使用getValue内部方法转换为value值类型。
// 而 ++ a 的结果是1. 我们无法对一个值做出 1 ++ 这样的操作。
// 因为不管是RHS还是LHS，操作的目标都需要是引用。因此这里报错
```

### 6. Unary 单目运算
```js
delete a.b
void foo()
typeof a
+ a
- a
~ a
! a
await a 
```

### 7. Exponental 指数运算
唯一的右结合双目运算符
```
**
```
例子
```js
3 ** 2 ** 3
==> 3 ** (2 ** 3)
```

### 8. Multiplicative 乘运算
```JS
* / % 
```

### 9. Additive 加运算
```JS
+ - 
```

### 10. shift 移位运算
```js
<< >> >>>
```

### 11. Relationship 关系运算
```js
< > <= >= instanceof in
```

### 12. Equality 相等运算
```
==
===
!==
!=
```

### 13. Bitwise 位运算
```js
^ & |
```

### 14. Logical 逻辑运算
```JS
&& ||
```

### 15. Conditional 条件运算
```js
?:
```
## Statement 语句
Grammar：
- 简单语句
    - ExpressionStatement 表达式语句
    - EmptyStatement 空语句
    - DebuggerStatement 调试语句
    - 以下四个都是控制及语句
    - ThrowStatement 抛出异常语句
    - ContinueStatement 
    - BreakStatement
    - ReturnStatement
- 组合语句
    - BlockStatement 
    
      ```js
      {
       // 用花括号包起来的语句就可以多放几条
       // 比如
        if (xxx) {
            // 多条语句
        }
        if (xxx)
            // 单条语句
      }
      ```
    - IfStatement 条件
    - SwitchStatement 分支
    - IterationStatement 循环
    - WithStatement
    - LabelledStatement
    - TryStatement
- 声明

Runtime
- Completion Record
    - 特殊类型，在运行时需要记录语句的结果
    
    ```js
    if (x == 1) // 如果这里没有一个运行时记录，我们并不知道该不该执行下面的操作。对于汇编倒是有jne，je，但高级语言需要用运行时记录。
        return 10;
    ```
    - 基本结构
    
    ```js
    [[type]]: normal, break, continue, return. throw
    [[value]]: 基本类型
    [[target]]: label(for 语句的那种)
    ```
- Lexical Environment  语法环境

## Declaration 声明
声明也是语句 Statement
- FunctionDeclaration
- GeneratorDeclaration
- AsyncFunctionDeclaration
- AsyncGeneratorDeclaration
- VariableStatement
- ClassDeclaration
- LexcialDeclaration

## Realm 领域

Before it is evaluated, all ECMAScript code must be associated with a realm. Conceptually, a realm consists of **a set of intrinsic objects, an ECMAScript global environment**, all of the ECMAScript code that is loaded within the scope of that global environment, and other associated state and resources.

Realm 就是所有代码元素最后都需要得到关联的地方，不管我们是写什么，只要是ECMA代码。它就会关联到一个Realm去，比如任何对象都会关联到Realm中的内置对象，而基础类型的字面量会被装箱从而也被关联到内置对象。而对于表达式和语句，就会被关联到Realm的内置全局环境中去，iframe创建时就会产生一个全新的Realm.所以iframe中类型的原型和宿主中的原型是不同的。
