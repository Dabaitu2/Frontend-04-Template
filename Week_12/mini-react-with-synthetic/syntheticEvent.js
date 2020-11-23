/*
* 定义addEvent方法为DOM对象添加事件
* 参数1： 需要绑定事件的DOM节点
* 参数2： 事件类型
* 参数3： 事件的监听函数
*/
function addEvent(dom, eventType, listener) {
  eventType = eventType.toLowerCase();  //React中的事件是驼峰命名的写法，需要转化成小写完成事件的绑定: onClick  => onclick
  // 在DOM节点上挂载一个对象，用于存放监听函数,在之后的触发中会用到
  let eventStore = dom.eventStore || (dom.eventStore = {});
  eventStore[eventType] = listener;
  // 进行事件的绑定, slice(2)的目的是去掉事件名称前的 "on"
  document.addEventListener(eventType.slice(2), dispatchEvent, false);
}

// 合成事件对象, 将该对象放到全局，减少重复创建，提升性能
// 但是在将该合成对象传递给当前的事件监听函数后会被清除，这也就是为什么React中的事件对象不能持久化保存的原因
let syntheticEvent = null;

/*
* dispatchEvent方法进行事件对象的劫持，所有的事件触发都会进入到dispatchEvent()方法
* dispatchEvent()中调用合成事件对象传递给用户监听函数，所以用户最终获取到的是一个合成事件对象
* event  原生的事件对象
*/
function dispatchEvent(event) {
  let { type, target } = event;  // 取出事件的类型和事件触发的节点
  let eventType = 'on' + type;  // 还原回原来的事件名: click => onclick， 用于之后从eventStore中取出监听函数执行

  // 在这里给syntheticEvent对象赋值，调用getSyntheticEvent方法获取当前的合成事件对象(后面定义)
  syntheticEvent = getSyntheticEvent(event);  // 获取合成事件对象
  // 模拟事件冒泡
  while (target) {
    let { eventStore } = target;
    // 在这里取出之前放到eventStore中的事件监听函数一次执行
    let listener = eventStore && eventStore[eventType];
    if (listener) {
      // 执行监听函数，传递的是合成的事件对象
      listener.call(target, syntheticEvent);
    }
    target = target.parentNode;
  }

  // 等冒泡完毕，所有的监听函数执行完毕，则清除掉syntheticEvent中的属性，供下次syntheticEvent对象重用
  for (let key in syntheticEvent) {
    if (Object.hasOwnProperty(key)) {
      delete syntheticEvent[key]; // 不会清除persist的值，用于持久化事件对象
    }
  }
}

/**
 * 获取合成事件的方法，传递的参数为原生的DOM事件对象
 */
function getSyntheticEvent(nativeEvent) {
  if (!syntheticEvent) {
    // 如果没有这个合成事件对象，则创建一个新的，同时在其隐式原型上挂载一个方法用于之后的合成事件持久化操作
    syntheticEvent = {};
    syntheticEvent.__proto__.persist = persist;
  }
  // 将原生的事件对象和DOM实例都挂载上去
  syntheticEvent.nativeEvent = nativeEvent;
  syntheticEvent.currentTarget = nativeEvent.target;

  // 将原生事件对象上的属性和方法全部拷贝到了合成事件对象上
  for (let key in nativeEvent) {
    if (typeof nativeEvent[key] === 'function') {  // 如果是方法，这里做一层高this的绑定 处理
      syntheticEvent[key] = nativeEvent[key].bind(nativeEvent);
    } else {
      syntheticEvent[key] = nativeEvent[key];
    }
  }
  return syntheticEvent;
}


/**
 * persist()函数完成合成事件对象的持久化操作(这个api在React中也是存在的)
 * 持久化原理:
 * 在用户调用持久化函数后，将全局的syntheticEvent合成事件对象重新赋值，让其指向一个新的对象
 * 这是在后面清除属性的时候就清除的是新创建赋值的对象，之前传递给监听函数的事件对象就不会被清除，达到持久化的效果
 * 但是频繁的使用事件对象的持久化操作，过多的对象无法被销毁，可能会造成内存泄露的问题
 */
function persist() {
  // 创建新的syntheticEvent对象
  syntheticEvent = {};
  syntheticEvent.__proto__.persist = persist;
}
