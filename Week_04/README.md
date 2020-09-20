##  一般命令式编程语言的设计方式
1. Atom 原子式

```
Identifier， Literal
e.g:
var, let, 'hello', 123 ...
```
1. Expression 表达式

```
Atom， Operator, punctuator
e.g:
+, -, *, / ... 包含原子式
```
1. Statement 语句

```
Expression, KeyWord, punctuator
e.g:
while, for ... 包含了表达式
```
1. Structure 结构

```
Function, class, Process, namespace,...
```
1. Program 程序

```
moudle, package, library, program
```


## 现代语言分类
### 按编程用途分类
1. DSL 数据描述语言
```
JSON, xml, YAML, sql, CSS
```
1. 编程语言

### 按表达方式分类
1. 声明式语言
声明式语言隐藏了执行细节，是比较高层次的描述方式，我们通常只告诉程序我们需要什么结果。比如如下的语言和例子：

```
JSON,HTML,SQL,CSS,LISP,Clojure，Haskell
```
例子

```sql
SELECT * from user
WHERE user_name = Ben
```
1. 命令式语言
命令式编程（Imperative）：详细的命令机器怎么（How）去处理一件事情以达到你想要的结果（What）

```
C, c++, PYTHON,C#,JS,JAVA
```

## BNF 产生式， 乔姆斯基语系
BNF 即巴斯克范式
用来描述形式语言

### BNF范式表达四则运算
从下面的四则运算可以看出一个特点，就是优先级越高越再最内层，也最靠近终结符定位。
终结符可以理解为哪些原子部分。而由原子部分组成的则是非终结符。同时更高一级优先级的非终结符往往会作为低一级优先级的第一个原子识别范式。BNF应该是有序的。

在这下面的additive ≈ 加减法运算
        multiplicative ≈ 乘除法运算
        Primary ≈ 括号包起来的运算
        
之所以additive （看起来）没有表现出 2 * 3 + 4 情况的原因是。
实际上 2*3 已经被识别为 multiplivative 了，而multiplicative 也是一个原子的additive。

```HTML
<AdditiveExpression>::=
    <MultiplicativeExpression>
    |<AdditiveExpression><+><MultiplicativeExpression>
    |<AdditiveExpression><-><MultiplicativeExpression>
      
<MultiplicativeExpression>::=
    <PrimaryExpression>
    |<MultiplicativeExpression><*><PrimaryExpression>
    |<MultiplicativeExpression></><PrimaryExpression>
      
<PrimaryExpression>::=
    <(><AdditiveExpression><)>
    |<Number>
```

### 产生式解释乔姆斯基语系
乔姆斯基语系分为
0- 型文法（无限制文法或短语结构文法）包括所有的文法。
1- 型文法（上下文相关文法）生成上下文相关语言。
2- 型文法（上下文无关文法）生成上下文无关语言。
3- 型文法（正规文法）生成正则语言。

用产生式即描述为
#### 无限制文法
随便写
```
?::=?
```
#### 上下文相关文法
只能有一个非终结符的地方可以发生改变，其他的地方虽然可以随便写，但是形式要保持一致。
```
?<A>?::=?<B>?
```
#### 上下文无关文法
左边只能有一个非终结符
```
<A>::=?
```
#### 正则文法
对于递归定义，左边只能有一个非终结符，右边相同非终结符必须出现在最开头，意味着表达式判断是左结合的。
```
<A>::=<A>?
```


### JavaScript 属于什么文法?
大部分语法属于上下文无关文法，表达式大部分属于正则文法
但有少量特例，如
```JS
2**1**2 = 2 // 连乘是右结合的，先算1**2（非终结符到了非第一个。），这意味着违背了正则文法的左结合判断条件
// 对于下面的两个get的解释是不同的
{
    get a { return 1 },
    get: 1
}
```
所以严格说来·属于上下文相关文法。
