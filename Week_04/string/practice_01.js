function UTF8_Encoding_char(string) {
    let charBytes = [];
    // 获得unicode码
    let charCode = string.charCodeAt(0);
    // 0 - 128
    if (charCode >= 0x00 && charCode <= 0x7f) {
        charBytes = [
            1,
            charCode
        ];
    } else if (charCode >= 0x80 && charCode <= 0x7ff) {
        charBytes = [
            2,
            // 右移动6位，剩下的五位跟最前面的控制位比较
            (0b11000000 | (charCode >> 6) & 0b00011111),
            (0b10000000 | (charCode & 0b00111111))
        ];
    } else {
        charBytes = [
            3,
            (0b11100000 | ((charCode >> 12) & 0b00001111)),
            (0b10000000 | ((charCode >> 6) & 0b00111111)),
            (0b10000000 | (charCode & 0b00111111)),
        ];
    }
    return charBytes;
}

function pre_UTF8_Encoding(string) {
    let bufferFrom = [];
    for (let stringElement of string) {
        bufferFrom.push(UTF8_Encoding_char(stringElement));
    }
    return bufferFrom;
}

function UTF8_Encoding(string) {
    let bufferFrom = pre_UTF8_Encoding(string);
    let actualBuffer = bufferFrom
        .map(b => b.slice(1))
        .reduce((previousValue, currentValue) => {
            previousValue = [...previousValue, ...currentValue];
            return previousValue;
        }, []);
    return Buffer.from(actualBuffer, 'hex');
}

let buffer = UTF8_Encoding("你好, world!");
console.log(buffer);
console.log(buffer.toString('utf-8'));
