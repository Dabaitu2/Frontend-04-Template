import { flatten } from './utils';
import { diff, patch } from './vDom';
import { setProps } from './dom';

// 增加虚拟Props
function setVProps(target, props) {
  if (!!props) {
    for (let p in props) {
      if (p !== '__type') {
        target.setAttribute(p, props[p]);
      }
    }
  }
}

/**
 * root 实际的dom元素, 不应该随便被替换
 * vDom 虚拟dom树，想换就换
 */
export class Component {
  constructor(props) {
    this.type = props.__type;
    this.props = Object.create(null);
    this.state = Object.create(null);
    this.children = [];
    setVProps(this, props);
  }

  genRenderDom() {
    this.root = this.render();
    this.dom = this.root.dom;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  getVDom() {
    return {
      type: this.type,
      props: this.props,
      children: flatten([this.root.getVDom()]),
    };
  }

  setState(newState) {
    let prevVdom = this.getVDom();
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update(prevVdom);
      return;
    }
    this.merge(this.state, newState);
    this.update(prevVdom);
  }

  update(prev) {
    this.genRenderDom();
    let patches = diff(this.getVDom(), prev);
    console.log(this.dom);
    // patch(this.dom, patches);
  }

  appendChild(child) {
    this.children.push(child);
    child.mountTo(this.dom);
  }

  // mountTo 被调用时应该是首次渲染，其他时候都跟他没关系
  // 不然关于dom的操作就应该被patch调用
  mountTo(parent) {
    parent.appendChild(this.dom);
  }

  merge(oldState, newState) {
    for (let p in newState) {
      if (oldState[p] === null || typeof oldState[p] !== 'object') {
        oldState[p] = newState[p];
      } else {
        this.merge(oldState[p], newState[p]);
      }
    }
  }

  render() {}
}

class ElementWrapper extends Component {
  getVDom() {
    return {
      type: this.type,
      props: this.props,
      children: flatten(this.children.map(child => child.getVDom())),
    };
  }

  genRenderDom() {
    super.genRenderDom();
    setProps(this.dom, this.props);
  }

  render() {
    return {
      dom: document.createElement(this.type),
    }
  }
}

class TextWrapper extends Component {
  constructor(content) {
    super({ __type: '#text' });
    this.content = content;
  }

  getVDom() {
    return {
      type: this.type,
      content: this.content,
    };
  }

  render() {
    return {
      dom: document.createTextNode(this.content),
    };
  }
}

export function createElement(type, props, ...children) {
  let element;
  if (typeof type === 'string') {
    element = new ElementWrapper({ __type: type, ...props });
  } else {
    element = new type({ __type: type, ...props });
  }
  element.genRenderDom();
  insertChildren(element, children);
  return element;
}

function insertChildren(el, children) {
  for (let child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      child = new TextWrapper(child);
      child.genRenderDom();
    }
    if (child === null) {
      continue;
    }
    if (typeof child === 'object' && child instanceof Array) {
      insertChildren(el, child);
    } else {
      el.appendChild(child);
    }
  }
}
