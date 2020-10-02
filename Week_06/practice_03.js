function findStr(str) {
    let foundA = false;
    let foundB = false;
    let foundC = false;
    let foundD = false;
    let foundE = false;

    for (const strElement of str) {
        if (foundE && str === 'f') {
            return true;
        } else if (foundD && str === 'e') {
            foundE = true;
        } else if (foundC && str === 'd') {
            foundD = true;
        } else if (foundB && str === 'c') {
            foundC = true;
        } else if (foundA && str === 'b') {
            foundB = true;
        } else if (str === 'a') {
            foundA = true;
        }else {
            foundA = false;
            foundB = false;
            foundC = false;
            foundD = false;
            foundE = false;
        }
    }
    return false;
}
