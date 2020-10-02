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
    if (c === 'a') {
        return foundA3;
    } else {
        // 否则将当前状态fallback到第一个B的读取
        return foundB(c);
    }
}

function foundA3(c) {
    if (c === 'b') {
        return foundB3;
    } else {
        // 否则将当前状态fallback到第一个B的读取
        return start(c);
    }
}

function foundB3(c) {
    if (c === 'x') {
        return end;
    } else {
        // 否则将当前状态fallback到第一个B的读取
        return foundB2(c);
    }
}


console.log(match('abababxac'));
