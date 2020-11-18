export function RENDER_TO_DOM(el, node) {
  el.mountTo(node);
}

// 挂载实体属性
export function setProps(node, props) {
  for (let name in props) {
    if (name === '__type') {
      continue;
    }
    let value = props[name];
    if (name.match(/^on([\s\S]+)$/)) {
      node.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()),
        value
      );
    }
    if (name === 'className') {
      node.setAttribute('class', value);
    } else {
      node.setAttribute(name, value);
    }
  }
}
