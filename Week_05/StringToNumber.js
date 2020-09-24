const RegexMap = {
    binary: /^[-+]?(0b)?([0-1]+)(\.[0-1]+)?$/,
    octal: /^[-+]?(0o)?([0-7]+)(\.[0-7]+)?$/,
    decimal: /^[-+]?(\d*(\.\d*)?(e\d*)?$)/,
    hex: /^[-+]?(0x)?([0-9a-f]+)(\.[0-9a-f]+)?$/
}

const position = {
    all: 0,
    prefix: 1,
    integer: 2,
    decimal: 3
}

const hexMap = {
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15
}

/**
 * 将各个进制的字符串转化为十进制的Number
 * @param str
 * @param radix
 * @return {number|*}
 * @constructor
 */
function StringToNumber(str, radix) {
    if (RegexMap.binary.test(str)) {
        return _toDecimal(str, RegexMap.binary, radix);
    }
    if (RegexMap.octal.test(str)) {
        return _toDecimal(str, RegexMap.octal, radix);
    }
    if (RegexMap.decimal.test(str)) {
        return Number(str);
    }
    if (RegexMap.hex.test(str)) {
        return _toDecimal(str, RegexMap.hex, radix);
    }
    console.log('无法转换!');
}

function _toDecimal(str, regex, radix) {
    let [integer = '', decimal = ''] = regex.exec(str).slice(position.integer, position.decimal + 1);
    let integer_decimal = 0;
    let decimal_decimal = 0;
    let highest = integer.length - 1;
    decimal = decimal.replace('.', '');
    for (let _char of integer) {
        integer_decimal += (hexMap[_char] || _char) * radix ** highest;
        highest--;
    }
    for (let _char of decimal) {
        decimal_decimal += (hexMap[_char] || _char) * radix ** highest;
        highest--;
    }
    return integer_decimal + decimal_decimal;
}

console.log(StringToNumber('0o4546373.16627754256', 8))
