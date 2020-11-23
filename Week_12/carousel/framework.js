import { flatten } from './utils';
import { diff, patch } from './vDom';

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

  getRoot() {
    this.root = this.render();
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  getVDom() {
    return this.root.getVDom();
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

  update(prevVdom) {
    this.getRoot();
    let patches = diff(this.getVDom(), prevVdom);
    patch(this.parent, patches);
  }

  appendChild(child) {
    this.children.push(child);
  }

  mountTo(parent) {
    this.parent = parent;
    let patches = diff(this.getVDom(), null);
    patch(parent, patches);
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
  constructor(props) {
    super(props);
  }

  getVDom() {
    return {
      type: this.type,
      props: this.props,
      children: flatten(this.children.map(child => child.getVDom())),
    };
  }

  render() {
    return this;
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
    return this;
  }
}

export function createElement(type, props, ...children) {
  let element;
  if (typeof type === 'string') {
    element = new ElementWrapper({ __type: type, ...props });
  } else {
    element = new type({ __type: type, ...props });
  }
  insertChildren(element, children);
  element.getRoot();
  return element;
}

function insertChildren(el, children) {
  for (let child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      child = new TextWrapper(child);
      child.getRoot();
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
