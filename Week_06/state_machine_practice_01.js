/**
 * 所有已经命名为状态的函数在调用时，已经是确定的状态了，其中的逻辑都是在针对下一个字符进行检查
 * 这里的各个处理函数（start, end, foundX)并不是状态机, 只有match是状态机
 * 而对于其他函数，将其理解为状态的一个回调可能好一点（当一个状态达成时，使用这个状态绑定的回调去作为新的状态机，接受下一个输入，再去计算下一个状态）
 * 将整个程序理解为，同一时刻只有【一个状态】，输入是新的字符，输出是下一个状态
 * 这个match非常符合Mealy状态机的定义，即状态输出和【输入 + 当前状态】均有关，
 * 而我们使用一系列的内部函数来处理状态流转，只是一种解法而已，和状态机的定义无关
 * f(state + input) = new State =>  f(new State + input) ...
 * @param str
 * @return {boolean}
 */

function match(str) {
    let state = start;
    for (const c of str) {
        state = state(c);
    }
    return state === end;
}

function start(c) {
    if (c === 'a') {
        return foundA;
    } else {
        return start;
    }
}

function end(c) {
    return end;
}

function foundA(c) {
    if (c === 'b') {
        // 对于当前的字符处理成功的情况，我们可以将状态迁移到下一个并等待读取下一个字符。
        return foundB;
    } else {
        // 因为当前的字符处理失败了，所以我们需要用fallback的start状态来重新处理当前字符，因此这里要调用函数。
        // 这个手段叫做reconsume，也就是重消费
        return start(c);
    }
}

function foundB(c) {
    if (c === 'c') {
        return foundC;
    } else {
        return start(c)
    }
}

function foundC(c) {
    if (c === 'a') {
        return foundA2;
    } else {
        return start(c)
    }
}

function foundA2(c) {
    if (c === 'b') {
        // 对于当前的字符处理成功的情况，我们可以将状态迁移到下一个并等待读取下一个字符。
        return foundB2;
    } else {
        // 因为当前的字符处理失败了，所以我们需要用fallback的start状态来重新处理当前字符，因此这里要调用函数。
        // 这个手段叫做reconsume，也就是重消费
        return start(c);
    }
}

function foundB2(c) {
    if (c === 'x') {
        return end;
    } else {
        // 否则将当前状态fallback到第一个B的读取
        return foundB(c);
    }
}


console.log(match('abcabxab'));
