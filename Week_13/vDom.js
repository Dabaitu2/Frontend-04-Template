import { removeEvent, addEvent } from './syntheticEvent';

const CREATE = 'CREATE'; //新增一个节点
const REMOVE = 'REMOVE'; //删除原节点
const REPLACE = 'REPLACE'; //替换原节点
const UPDATE = 'UPDATE'; //检查属性或子节点是否有变化
const SET_PROP = 'SET_PROP'; //新增或替换属性
const REMOVE_PROP = 'REMOVE PROP'; //删除属性

export function diff(newNode, oldNode) {
  // 不存在旧节点的情况-> 创建
  if (!oldNode) {
    return { type: CREATE, newNode };
  }

  // 不存在新节点的情况 -> 删除
  if (!newNode) {
    return { type: REMOVE };
  }

  // 节点元素发生了彻底变化 -> 替换
  if (changed(newNode, oldNode)) {
    return { type: REPLACE, newNode };
  }

  // 节点类型没有发生本质变化，来检查他的属性和children是否发生变化
  // 判断新节点是否是VDOM（根据type是否存在来判断的，因为type不存在的话，newNode要么是空节点，要么是字符串）
  if (newNode.type !== '#text') {
    return {
      type: UPDATE,
      props: diffProps(newNode, oldNode),
      children: diffChildren(newNode, oldNode),
    };
  }
}

// 判断节点是否相等
// 数据类型不等那肯定是变了，比如节点->字符串 节点->空节点
// 假如两者的类型都是纯文本，则直接比较两者是否相等
// 最后比较两者的类型（type， 比如li, ul等）是否相等
function changed(node1, node2) {
  return (
    typeof node1 !== typeof node2 ||
    node1.type !== node2.type ||
    (node1.type === '#text' && node1.content !== node2.content)
  );
}

// 判断属性是否相等
function diffProps(newNode, oldNode) {
  // 补丁数组
  let patches = [];

  // 获得属性交集
  let props = Object.assign({}, newNode.props, oldNode.props);

  // 检查交集中的每个属性
  Object.keys(props).forEach(key => {
    // 获得在新props 和 老props中对应的属性
    const newVal = newNode.props[key];
    const oldVal = oldNode.props[key];

    // 新props里没有，说明属性被删
    if (!newVal) {
      patches.push({ type: REMOVE_PROP, key, value: oldVal });
    }

    // 旧props里没有，或者新props和旧props不同，说明（重）设置了该props
    if (!oldVal || newVal !== oldVal) {
      patches.push({ type: SET_PROP, key, value: newVal });
    }
  });

  // 返回补丁集合
  return patches;
}

/**
 * 检查children, 这里图省事，没有用key判断，而完全是按index逐次挨个判断的
 * @param newNode
 * @param oldNode
 * @return {[]}
 */
function diffChildren(newNode, oldNode) {
  let patches = [];

  const maximumLength = Math.max(
    newNode.children.length,
    oldNode.children.length
  );
  for (let i = 0; i < maximumLength; i++) {
    patches[i] = diff(newNode.children[i], oldNode.children[i]);
  }

  return patches;
}

/**
 * 根据补丁集合进行更新
 * 首先当patches不存在时，直接return，不进行任何操作
 利用childNodes和Index取出当前正在处理的这个节点，赋值为el
 开始判断补丁的类型
 当类型是CREATE时，生成一个新节点，并append到根节点
 当类型是REMOVE时，直接删除当前节点el
 当类型是REPLACE时，生成新节点，同时替换掉原节点
 当类型是UPDATE时，需要我们特殊处理
 调用patchProps将我们之前diffProps得到的补丁渲染到节点上
 遍历之前diffChildren得到的补丁列表，再依次递归调用patch
 * @param parent
 * @param patches 其实也是一棵树
 * @param index
 * @return {*|ActiveX.IXMLDOMNode}
 */
export function patch(parent, patches, index = 0) {
  if (!patches) {
    return;
  }
  const el = parent.childNodes[index];
  switch (patches.type) {
    case CREATE: {
      const { newNode } = patches;
      const newEl = createElement(newNode);
      parent.appendChild(newEl);
      break;
    }
    case REMOVE: {
      parent.removeChild(el);
      break;
    }
    case REPLACE: {
      const { newNode } = patches;
      const newEl = createElement(newNode);
      return parent.replaceChild(newEl, el);
    }
    case UPDATE: {
      const { props, children } = patches;
      patchProps(el, props);
      for (let i = 0; i < children.length; i++) {
        patch(el, children[i], i);
      }
    }
  }
}

/**
 * 更新props, 将父节点中所有的props相关patches转化为节点更新
 * @param parent
 * @param patches
 */
function patchProps(parent, patches) {
  patches.forEach(patch => {
    const { type, key, value } = patch;
    if (type === 'SET_PROP') {
      setProp(parent, key, value);
    }
    if (type === 'REMOVE_PROP') {
      removeProp(parent, key, value);
    }
  });
}

/**
 * 移除props，和set_props刚好相反
 * @param target
 * @param name
 * @param value
 */
function removeProp(target, name, value) {
  //@
  if (name === 'className') {
    return target.removeAttribute('class');
  }
  if (name.match(/^on([\s\S]+)$/)) {
    let event = RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase());
    // return target.removeEventListener(event, value);
    return removeEvent(target, event);
  }
  target.removeAttribute(name);
}

/**
 * 递归的创建html元素
 * @param node
 * @return {Text|any}
 */
function createElement(node) {
  // 文本节点直接创建文本返回
  if (node.type === '#text') {
    return document.createTextNode(node.content);
  }

  // 否则就解析该节点的类型, 属性和children
  let { type, props, children } = node;
  // 创建该类型的元素
  const el = document.createElement(type);
  // 挂载属性
  setProps(el, props);
  // 对children递归进行创建，并挂载到当前节点上
  // 这里bind一下，是因为el.appendChild 其本质上不是el在调用appendChild
  // 而是获取了这个方法，而这个方法执行时的this，不指定的话是全局
  children.map(createElement).forEach(el.appendChild.bind(el));

  // 返回当前节点
  return el;
}

// 挂载属性
function setProp(target, name, value) {
  // 将防止冲突的className重新设置为class属性
  if (name === 'className') {
    return target.setAttribute('class', value);
  }
  if (name.match(/^on([\s\S]+)$/)) {
    let event = RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase());
    // return target.addEventListener(
    //   event,
    //   value
    // );
    // 这里一定要return，有个非常坑爹的地方
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/setAttribute
    // https://javascript.info/introduction-browser-events
    // 我们要注意，给dom元素直接设置事件处理器"并不是"把时间挂在了attribute属性上
    // dom.xxx !== dom.getAttribute(xxx)
    // 此外， setAttribute 还会把一切非 string 的 value string化
    // 如果你传个函数过去，attribute的值就会变成字符串
    // 【但是】，dom内部会检查 attribute 的key是不是和事件同名，
    // 如果是，就会尝试给dom元素绑定事件，我们setAttribute 时
    // 如果传一个 js原生函数，就会被塞到一个和事件同名的函数里，比如
    // temp1.setAttribute('onmousedown', ()=>{console.log(123)}) ==>
    // temp1.onmousedown = function onmousedown() {
    //    () => {console.log(123)}
    // }
    // 另一个例子:
    // <div onclick="alert('yes!')">Click Me!</div>
    //
    // 对于其他value类型，或者如果这个函数被浏览器包装过，不是js原生函数（如bind),
    // 则不会触发这个流程。temp1.onmousedown 会始终 为 null
    // 如果想要函数能够被正常的执行，且使用setAttribute
    // 需要这样：
    // temp1.setAttribute('onmousedown', 'console.log(123)') ==>
    // temp1.onmousedown = function onmousedown() {
    //    console.log(123)
    // }
    // 所以最好事件处理还是直接绑到dom元素上而不是setAttribute来处理
    // 这还有个问题，真正的合成事件应该是会记录下所有真实的dom事件名，命中了再设置为event的
    // 否则类似于onSearch这种自定义函数也会被错误的去尝试添加错误处理
    return addEvent(target, event, value);
  }
  // 其他属性正常设置即可
  target.setAttribute(name, value);
}

// 挂载属性列表
function setProps(target, props) {
  // 对各个属性依次挂载
  Object.keys(props).forEach(key => {
    setProp(target, key, props[key]);
  });
}
