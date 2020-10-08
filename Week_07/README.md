### void 运算符构造iife
这个运算符能向期望一个表达式的值是undefined的地方插入会产生副作用的表达式。
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
