const hexMap = {
    '10': 'a',
    '11': 'b',
    '12': 'c',
    '13': 'd',
    '14': 'e',
    '15': 'f'
}

function NumberToString(number, radix) {
    if (radix !== 2 && radix !== 8 && radix !== 10 && radix !== 16) {
        console.log('无法转换!');
        return;
    }
    let integer = number | 0;
    let decimal = number % 1;
    let str_integer = getInteger(integer, radix);
    let str_decimal = getDecimal(decimal, radix);
    return str_integer + str_decimal;
}

// 除n取余，逆序排列, 直到商为0
function getInteger(integer, radix) {
    let rst = '';
    while (integer / radix !== 0) {
        let cur = integer % radix
        rst = (hexMap[cur] || cur) + rst;
        integer = (integer - cur) / radix;
    }
    return rst;
}

// 乘n取整,顺序排列，直到小数部分为0
function getDecimal(decimal, radix) {
    if (decimal === 0) {
        return '';
    }
    let rst = '.';
    while (decimal % 1 !== 0) {
        let cur = (decimal * radix | 0);
        rst += (hexMap[cur] || cur);
        decimal = decimal * radix % 1;
    }
    return rst;
}

console.log(NumberToString(123123.2232, 8));
console.log(NumberToString(123123.2232, 16));
console.log(NumberToString(123123.2232, 2));
