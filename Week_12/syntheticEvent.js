/*
* 定义addEvent方法为DOM对象添加事件
* 参数1： 需要绑定事件的DOM节点
* 参数2： 事件类型
* 参数3： 事件的监听函数
*/
export function addEvent(dom, eventType, listener) {
  eventType = eventType.toLowerCase();  //React中的事件是驼峰命名的写法，需要转化成小写完成事件的绑定: onClick  => onclick
  // 在DOM节点上挂载一个对象，用于存放监听函数,在之后的触发中会用到
  // 给dom 节点挂载这种对象的开销比较小？，
  let eventStore = dom.eventStore || (dom.eventStore = {});
  eventStore[eventType] = listener;
  // 默认监听冒泡事件，不然直接就在document捕获阶段执行事件了
  // 这里说一个事件委托的概念，我们通过把事件监听挂载在document上，通过默认监听冒泡事件
  // 从 event.target 抓到实际触发的对象
  // 可以减少挂载 dom 事件的数量。减少开销。
  let documentEventMap = document.documentEventMap || (document.documentEventMap = new Map());
  // 去掉"on"前缀
  documentEventMap.set(eventType, (documentEventMap.get(eventType) || 0) + 1);
  document.addEventListener(eventType, dispatchEvent, false);
}


export function removeEvent(dom, eventType) {
  eventType = eventType.toLowerCase();  //React中的事件是驼峰命名的写法，需要转化成小写完成事件的绑定: onClick  => onclick
  // 在DOM节点上挂载一个对象，用于存放监听函数,在之后的触发中会用到
  // 给dom 节点挂载这种对象的开销比较小？，
  let eventStore = dom.eventStore;
  if (eventStore) {
    eventStore[eventType] = null;
  }
  let documentEventMap = document.documentEventMap || (document.documentEventMap = new Map());
  let eventRegisterTime = documentEventMap.get(eventType) || 0;
  if (eventRegisterTime <= 1) {
    documentEventMap.remove(eventType);
    document.removeEventListener(eventType, dispatchEvent);
  } else {
    documentEventMap.set(eventType, eventRegisterTime - 1);
  }
}

// 合成事件对象, 将该对象放到全局，减少重复创建，提升性能
// 但是在将该合成对象传递给当前的事件监听函数后，其属性会被清除，这也就是为什么React中的事件对象不能持久化保存的原因
// 合成事件的优势
// 1. 解决了 IE 等浏览器的不兼容问题, 屏蔽了底层事件处理的细节（当然在这个mini 实现里没有做)
// 2. 事件绑定到Document上，减少事件绑定的开销。（实际上事件绑定本身开销不大，但是如果这个滥用绑定，就会造成影响)
// 3. React可以自己控制事件的优先级，从而介入事件分发
// 4. 通过对象池来管理，一个对象池包含一组已经初始化过且可以使用的对象，而可以在有需求时创建和销毁对象。
//  池的用户可以从池子中取得对象，对其进行操作处理，并在不需要时归还给池子而非直接销毁它。这是一种特殊的工厂对象。
//  若初始化、实例化的代价高，且有需求需要经常实例化，但每次实例化的数量较少的情况下，
//  使用对象池可以获得显著的效能提升。从池子中取得对象的时间是可预测的，
//  但新建一个实例所需的时间是不确定。
let syntheticEvent = null;

/**
* 分发事件
* dispatchEvent方法进行事件对象的劫持，所有的事件触发都会进入到dispatchEvent()方法
* dispatchEvent()中调用合成事件对象传递给用户监听函数，所以用户最终获取到的是一个合成事件对象
* event  原生的事件对象，用于生成合成事件，
* 我们的事件是自己创建的，冒泡也是自己模拟的，这样会导致stopPropagation 这种方法失效
 * stopPropagation 是 向父元素冒泡， 而setImmediatePropagation是一个事件触发后，节点其他的监听器是否被触发
*/
function dispatchEvent(event) {
  let { type, target } = event;  // 取出事件的类型和事件触发的节点

  // 在这里给syntheticEvent对象赋值，调用getSyntheticEvent方法获取当前的合成事件对象(后面定义)
  syntheticEvent = getSyntheticEvent(event);  // 获取合成事件对象

  // 模拟事件冒泡
  // 逐个检查当前target的eventStore有没有绑定这个事件的回调
  // 如果有，就执行，没有就到他的父节点再检查
  while (target) {
    let { eventStore } = target;
    // 在这里取出之前放到eventStore中的事件监听函数一次执行
    let listener = eventStore && eventStore[type];
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
 * 主要做的事情就是添加一个 persist 方法，和把本身的事件的属性也粘过来，使得其能正常获取一些属性
 * 但由于合成事件是同步包装并且被使用的，在同步事件分发调用完之后，这个事件就被删除了
 * 因此用setTimeout等策略想去异步处理事件就行不通了。
 */
export function getSyntheticEvent(nativeEvent) {
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
 * 将全局的syntheticEvent 的引用和当前事件断开,
 * 这样后续在删除syntheticEvent的属性的时候就不会影响到这个event了, 异步情况下也能拿到事件
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
