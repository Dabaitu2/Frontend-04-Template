/**
 * layout 实际上就是获得带css的dom元素实际在位图中的位置
 * 也就是一个最终展示的坐标，这个坐标自然就会有left, right，top， bottom 这种相对于边界的属性
 * 也会有width, height 这种描述元素本身大小的属性，
 * 和x,y 这种描述精确坐标的属性
 */
function layout(element) {
    // 跳过没有computedStyle 的元素
    if (!element.computedStyle) {
        return;
    }

    let elementStyle = getPreProcessElementStyle(element);
    // 暂时只处理flex布局
    if (elementStyle.display !== 'flex') {
        return;
    }

    // 只处理非文本节点
    let items = element.children.filter(e => e.type === 'element');
    // 针对order属性排序
    items.sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
    })

    let style = elementStyle;
    ['width', 'height'].forEach(size => {
        // 将auto或者空字符串转化为null
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });

    if (!style.flexDirection || style.flexDirection === 'auto') {
        style.flexDirection = 'row';
    }
    if (!style.alignItems || style.alignItems === 'auto') {
        style.alignItems = 'stretch';
    }
    if (!style.justifyContent || style.justifyContent === 'auto') {
        style.justifyContent = 'flex-start';
    }
    if (!style.flexWrap || style.flexWrap === 'auto') {
        style.flexWrap = 'auto';
    }
    // alignItems 针对flex 中的每一个交叉轴 的排布
    // alignContents 针对的是 多行容器（发生了 wrap) 的整体排布
    if (!style.alignContent || style.alignContent === 'auto') {
        style.alignContent = 'stretch';
    }

    // 通过在不同布局状态下完成对布局相关的主轴大小，起止，交叉轴大小，起止的属性和常规的left， right，width等属性的映射
    // 在后续使用这些属性时，我们就不需要再关心这是什么布局了，也不需要去写if else的判断，再去拿对应的值
    let mainSize, mainStart, mainEnd, mainSign, mainBase, crossSize, crossStart, crossEnd, crossSign, crossBase;
    if (style.flexDirection === 'row') {
        mainSize = 'width';  // 主轴尺寸， 在row的情况下，主轴尺寸由元素的width决定
        mainStart = 'left';  // row 的情况下，主轴是从左向右的，则开始位置为left属性决定
        mainEnd = 'right';   // 同上理
        mainSign = +1;       // 当布局内部元素要开始排布的时候，其实际的坐标位置，需要根据上一个元素的位置去进行 +/- 对于row 来说。处在笛卡尔坐标系下，向右是相加，故sign为1
        mainBase = 0;        // 布局内部元素位置的初始值自然是从0开始

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style.flexDirection === 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';  // row-reverse 的情况下，主轴是从右向左的，则开始位置为left属性决定
        mainEnd = 'end';      // 同上理
        mainSign = +1;        // 当内部元素要开始排布的时候，其实际的坐标位置，需要根据上一个元素的位置去进行 +/- 对于row-reverse 来说。处在笛卡尔坐标系下，向左是减，故sign为-1
        mainBase = style.width;         // 对reverse 来说，初始值自然是从style.width 开始

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style.flexDirection === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    // 只有. flexWrap 决定了交叉轴的方向
    // 如果是反向的，则交叉轴起止方向应该要调换
    if (style.flexWrap === 'wrap-reverse') {
        let temp = crossStart;
        crossStart = crossEnd;
        crossEnd = temp;
        crossSign = -1;
        crossBase = style[crossSize];
    } else {
        // 否则默认情况下，crossBase都是0， 且都是从左到右或者从上到下的，sign也为+1
        crossBase = 0;
        crossSign = +1;
    }
}


/**
 * 预处理element的computedStyle，补全一些没有写的属性, 将小数取整并转化为数字类型
 * 此方法有副作用，因为这里的style没有被属性占掉，所以直接用这个名字了
 * @param element
 */
function getPreProcessElementStyle(element) {
    if (!element.style) {
        element.style = {};
    }
    for (let prop of element.computedStyle) {
        element.style[prop] = element.computedStyle[prop].value;

        if (element.style[prop].toString().match(/px$/)) {
            // parseInt 会无视 不影响解析的非数字字符
            element.style[prop] = parseInt(element.style[prop]);
        }
        if (element.style[prop].toString().match(/^[0-9.]+$/)) {
            // 不支持小数px
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}
