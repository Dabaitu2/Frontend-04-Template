class Sorted {
    constructor(data, compare) {
        this.data = data.slice(0);
        this.compare = compare || ((a, b) => a - b);
    }
    take() {
        if(!this.data.length) {
            // return null 也会错误参与比较，所以这里return undefined
            return;
        }

        // 遍历数组取得最小值
        let min = this.data[0];
        let minIndex = 0;
        for (let i = 1; i < this.data.length; i++) {
            if (this.compare(this.data[i], min) < 0) {
                min = this.data[i];
                minIndex = i;
            }
        }

        // 交换末尾元素与最小元素而不是使用slice，减少数组移动带来的开销
        this.data[minIndex] = this.data[this.data.length - 1];
        this.data.pop();
        return min;
    }

    give(value) {
        this.data.push(value);
    }
    get length() {
        return this.data.length;
    }
}
