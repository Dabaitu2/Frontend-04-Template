/**
 * layout 实际上就是获得带css的dom元素实际在位图中的位置
 * 也就是一个最终展示的坐标，这个坐标自然就会有left, right，top， bottom 这种相对于边界的属性
 * 也会有width, height 这种描述元素本身大小的属性，
 * 和x,y 这种描述精确坐标的属性
 */
function layout(element) {
    /**
     * 0. 预处理当前元素
     * 求出style, items
     */
    // 跳过没有computedStyle 的元素
    if (!element.computedStyle) {
        return;
    }

    let elementStyle = getPreProcessElementStyle(element);
    // 暂时只处理flex布局
    if (elementStyle.display !== 'flex') {
        return;
    }

    // 只处理非文本子节点
    let items = element.children.filter(e => e.type === 'element');
    // 针对order属性排序, 这一段跟前面一点关系都没有，看起来应该也是css属性才对，不知道遇到什么奇葩剪辑给整没了
    // 或者是这些代码来自于一个其他的例子的裁剪，这一段并没有裁剪干净，总之这一段是废的
    // items.sort((a, b) => {
    //     return (a.order || 0) - (b.order || 0);
    // })

    /**
     * 就是设置了display: flex， 即将开始布局的元素
     * style = getPreProcessElementStyle(element.computeStyle)
     */
    let style = elementStyle;
    ['width', 'height'].forEach(size => {
        // 将auto或者空字符串转化为null
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });

    // 主轴方向
    if (!style.flexDirection || style.flexDirection === 'auto') {
        style.flexDirection = 'row';
    }
    // 交叉轴内容如何排布
    if (!style.alignItems || style.alignItems === 'auto') {
        style.alignItems = 'stretch';
    }
    // 主轴内容如何排布
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

    /**
     * 1. 将元素的实际属性映射到我们的统一属性名
     * 上通过在不同布局状态下完成对布局相关的主轴大小，起止，交叉轴大小，起止的属性和常规的left， right，width等属性的映射
     * 在后续使用这些属性时，我们就不需要再关心这是什么布局了，也不需要去写if else的判断，再去拿对应的值
     */
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

    /**
     * 2. 收集元素进'行'
     *     1. 计算主轴方向大小
     *     2. 初始化行容器和行容器数组
     *     3. 循环所有子元素，根据子元素是否是flex. 父元素是否是自动计算大小。是否换行来更新每一个flexLine的crossSpace， mainSpace和内部元素
     */
        // 是否需要自动计算mainSize
    let isAutoMainSize = false;
    // 如果没有设置mainSize, 就按照所有子元素的mainSize总和作为布局的mainSize
    // 同时标记flag为true
    if (!style[mainSize]) {
        elementStyle[mainSize] = 0;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let itemStyle = getPreProcessElementStyle(item);
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
            }
        }
        isAutoMainSize = true;
    }

    let flexLine = [];                      // 当前flex行
    let flexLines = [flexLine];             // 整个flex布局的所有行

    let mainSpace = elementStyle[mainSize];  // 主轴的剩余空间, 指的是，减掉固定子元素主轴尺寸后剩下的部分，这剩下的部分就会被存在flex属性的元素按比例进行瓜分，
                                             // 如果剩余的部分已经是负数了（对于no-wrap且不是autoMainSize的情况），则会去等比压缩所有的【非flex元素】
    let crossSpace = 0;                      // 交叉轴的剩余空间

    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getPreProcessElementStyle(item);

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        // 如果元素有 flex: xxx 这个属性且不为0说明元素一定是可伸缩的，放进flexLine中
        // 这个时候就只按照flex指定的比例在稍后根据mainSpace计算大小，mainSpace 不需要减掉子元素的主轴空间
        // 交叉轴方向的大小也可以通过flex计算
        // 如果itemStyle.flex = 0， 不会走到这，相当于该元素也无法伸缩了
        if (itemStyle.flex) {
            flexLine.push(item);
            // 如果元素没有flex属性，且当前flex布局的主轴大小是自动计算(没有设置主轴大小)，且只有一行
            // 则可以直接用当前父元素尺寸减去当前子元素的主轴尺寸，计算出新的剩余空间, 同时比较计算出当前的交叉轴方向的最大剩余空间
        } else if (style.flexWrap === 'nowrap' && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            // 求得当前flexLine交叉轴方向的最大尺寸
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        } else {
            // 如果元素没有flex属性，且父元素指定了主轴大小 或 flex允许换行，则进入换行逻辑
            // 对于超出父元素尺寸的子元素，强制调整为和父元素尺寸一样
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }
            // 如果剩余主轴空间已经塞不下当前元素了
            // 意味着应该换行了，将之前计算的mainSpace和crossSpace 保存到当前的flexLine上
            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                // 使用数组字面量使得flexLine 变量已经引用到了 新的数组（可以理解为指针指向了新的数据)
                // 但原来的内容还在flexLines里面
                flexLine = [item];
                flexLines.push(flexLine);
                // 初始化mainSpace 和 crossSpace
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                // 否则继续正常的塞入当前flexLine
                flexLine.push(item);
            }
            // 当然如果主轴没有指定主轴大小，依旧是AutoMainSize的，
            // 即使设置了允许换行似乎也没用. 实际逻辑只会走到下面这部分，就和前面else if 中的内容一致了
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            // 这一步使得mainSpace可能是负数
            // 在负数的情况下，说明当前flex布局肯定只有一行，不然肯定自动换行了
            mainSpace -= itemStyle[mainSize];
        }
    }
    flexLine.mainSpace = mainSpace;

    // 如果当前不换行或者是autoSize (即就是一行). 如果用户设置了crossSize，则以crossSize为准
    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }

    /**
     * 3. 开始计算主轴
     */
    {
        // 如果mainSpace < 0, 意味着非flex元素的大小在当前行都已经不能完全放下了，flex元素（在这里应该是指flex = 1）会被挤压到0
        // mainSpace < 0 只会在flexLine 只有一行的情况下发生
        if (mainSpace < 0) {
            // 主轴大小 - 剩余元素大小(负数) = 实际能够放下非flex元素的大小，主轴大小 / 实际能够放下非flex元素的大小 = 非flex元素需要缩放的比例
            // 在这种情况下，flex元素的mainSize肯定被压缩到0了
            let scale = style[mainSize] / (style[mainSize] - mainSpace);
            // 记录一下当前主轴的位置
            let currentMain = mainBase;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemStyle = getPreProcessElementStyle(item);

                // flex元素必然被压缩到0
                if (itemStyle.flex) {
                    itemStyle[mainSize] = 0;
                }

                itemStyle[mainSize] = itemStyle[mainSize] * scale;
                itemStyle[mainStart] = currentMain;
                itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                currentMain = itemStyle[mainEnd];
            }
        } else {
            // 在存在多行的情况下，对每一行都根据剩余空间和总的flex值来对各个flex元素瓜分剩余空间
            flexLines.forEach(flexLine => {
                let mainSpace = flexLine.mainSpace;
                let flexTotal = 0;
                for (let i = 0; i < flexLine.length; i++) {
                    let item = flexLine[i];
                    let itemStyle = getPreProcessElementStyle(item);
                    if (itemStyle.flex !== null && (itemStyle.flex !== (void 0))) {
                        flexTotal += itemStyle.flex;
                    }
                }
                if (flexTotal > 0) {
                    let currentMain = mainBase;
                    for (let i = 0; i < flexLine.length; i++) {
                        let item = flexLine[i];
                        let itemStyle = getPreProcessElementStyle(item);
                        // 存在flex !== 0 的元素按照flex 来瓜分 mainSpace
                        // 并更新相关的left/right/top/bottom 值
                        if (itemStyle.flex) {
                            itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                        }
                        itemStyle[mainStart] = currentMain;
                        itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                        currentMain = itemStyle[mainEnd];
                    }
                } else {
                    let currentMain, step;
                    // 如果 flexTotal = 0, 意味着没有flex元素，如果依然存在mainSpace，意味着用户设置的mainSize大于所有子元素mainSize的和，但并不能变动子元素，
                    // 因此就这里要根据justify-content 来控制一下空白间隙
                    if (style.justifyContent === 'flex-start') {
                        currentMain = mainBase;         // 每读取一个元素，都会把currentMain 更新到下一个元素将要开始的位置
                        step = 0;                       // step 是每读取一个元素都应该多分多少的空格，对于flex-start.flex-end, center 都是0
                    }
                    if (style.justifyContent === 'flex-end') {
                        currentMain = mainSpace * mainSize + mainBase;
                        step = 0;
                    }
                    if (style.justifyContent === 'center') {
                        currentMain = mainSpace / 2 * mainSign + mainBase;
                        step = 0;
                    }
                    if (style.justifyContent === 'space-between') {
                        // space-between 的左右无空隙
                        currentMain = mainBase;
                        step = mainSpace / (flexLine.length - 1) * mainSign;
                    }
                    if (style.justifyContent === 'space-around') {
                        // space-around 的左右有空隙, 但左右是占空隙的一半
                        step = mainSpace / flexLine.length * mainSign;
                        currentMain = step / 2 + mainBase;
                    }
                    for (let i = 0; i < flexLine.length; i++) {
                        let item = flexLine[i];
                        let itemStyle = getPreProcessElementStyle(item);
                        itemStyle[mainStart] = currentMain;
                        itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                        currentMain = itemStyle[mainEnd] + step;
                    }
                }
            });
        }
    }


    /**
     * 4. 开始计算交叉轴
     */
    {
        let crossSpace;
        // 如果没有指定交叉轴大小，则将交叉轴大小按照各line crossSpace 求和
        // 先前计算的各个行的crossSpace 并没有像主轴一样减去mainSize，所以可以直接用
        // 这里的crossSpace 名字并不是很对..
        if (!style[crossSize]) {
            crossSpace = 0;
            // style 和 elementStyle 是一个东西
            elementStyle[crossSize] = 0;
            for (let i = 0; i < flexLines.length; i++) {
                elementStyle[crossSize] += flexLines[i].crossSpace;
            }
        } else {
            // 否则就根据设置的crossSize - 各个行的crossSpace 求出剩余的cross空间
            // 接下来就可以按照交叉轴的一些属性去计算如何利用这些剩余的cross空间排布了
            crossSpace = style[crossSize];
            for (let i = 0; i < flexLines.length; i++) {
                crossSpace -= flexLines[i].crossSpace;
            }
        }


        let step;
        if (style.alignContent === 'flex-start') {
            crossBase = 0;
            step = 0;
        }
        // 只是元素堆积在flexEnd，但顺序是不变的
        if (style.alignContent === 'flex-end') {
            crossBase += crossSign * crossSpace;
            step = 0;
        }
        if (style.alignContent === 'flex-center') {
            crossBase += crossSign * crossSpace / 2;
            step = 0;
        }
        if (style.alignContent === 'space-between') {
            crossBase += 0;
            step = crossSpace / (flexLines.length - 1);
        }
        // space around 的感觉就是 身边被围了一圈，左右相等，但因为元素之间会有左 + 右，故最边上只有1/2
        if (style.alignContent === 'space-around') {
            step = crossSpace / (flexLines.length);
            crossBase += crossSign * step / 2;
        }
        if (style.alignContent === 'stretch') {
            crossBase += 0;
            step = 0;
        }

        // alignContent 针对所有的flexLine 共同在交叉轴方向上的排布
        // alignItems 针对每一个flexLine 中 items 交叉轴方向的排布
        // alignSelf 针对某一个flexLine 中某一个 item 交叉轴方向的排布
        flexLines.forEach(flexLine => {
            // stretch 情况下，实际的交叉轴中每line的尺寸将增大 总space/flexLines 的均分大小，否则就保持原样
            let lineCrossSize = style.alignContent === 'stretch' ? flexLine.crossSpace + crossSpace / flexLines.length : flexLine.crossSpace;
            for (let i = 0; i < flexLine.length; i++) {
                let item = flexLine[i];
                let itemStyle = getPreProcessElementStyle(item);

                let align = itemStyle.alignSelf || style.alignItems;
                // 如果没有设置交叉轴尺寸
                if (itemStyle[crossSize] === null || itemStyle[crossSize] === (void 0)) {
                    // 设置了stretch 就给他计算上，否则就是 0
                    itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0
                }
                if (align === 'flex-start') {
                    itemStyle[crossStart] = crossBase;
                    itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
                }
                if (align === 'flex-end') {
                    itemStyle[crossStart] = crossBase + crossSign * lineCrossSize;
                    itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
                }
                if (align === 'center') {
                    // 这里的crossSpace 就是 flexLine.crossSpace = 当前行内交叉轴尺寸最大的那个 / 按照stretch 扩充之后的交叉轴尺寸
                    itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                    itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
                }
                if (align === 'stretch') {
                    itemStyle[crossStart] = crossBase;
                    itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                }
            }
            crossBase += crossSign * (lineCrossSize + step);
        });
    }
    // console.log(items);
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
    for (let prop of Object.keys(element.computedStyle)) {
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

module.exports = layout;
