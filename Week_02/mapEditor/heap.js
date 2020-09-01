class Heap {
    /**
     * 堆是完全二叉树，不是二叉搜索树，因为它不要求左右子树之间有明确的大小关系
     * 但其实也可以用数组模拟完全二叉树
     * 建堆的时间复杂度o(n)
     * 重建堆的时间复杂度 o(nlogn)
     * 思路（ 以大顶堆为例) :
     * 1. 假设我们有一颗完全二叉树
     * 根是最大元素，左右子树根结点均大于次一级， 称为堆序性
     * 2. 将树转化为数组，其存储顺序为自上而下，从左向右
     * 由于是完全二叉树，可以得出数组中一个元素current父节点的位置 应该为 Math.floor((current - 1) / 2)
     * 而其子元素的位置则应该是 2 * current + 1和 2 * current + 2 = 2(current + 1)
     * 例如: [ 30, 30, 24, 22, 12, 4, 9] 这样一个堆。4（位置5）的根节点为 24(位置2)
     * 对应的二叉树为
     *          30
     *         /  \
     *       30   24
     *      / \   / \
     *    22  12 4   9
     * 关于这个公式是怎么推出来的可以看 https://cloud.tencent.com/developer/article/1607458
     * 简单说来，以第n层第k个元素为例子，其数组坐标可以看作
     * 2^0 + 2^1 + ... + 2^(n-1) + k - 1 = 2^n + k - 1 - 1
     * 那么其左子树根位置为
     * 2^(n+1)-1 + 2k - 1 = 2 * (2^n + k - 1)
     * 其右子树根位置为
     * 2^(n+1)-1 + 2k + 1 = 2^(n+1) + 2k - 1 = (2^n + k - 1) * 2 + 1
     *
     * 设 2^n + k - 1 - 1 = current
     * 则左子树根位置为 2 * current + 1, 右子树位置为 2 * current + 2
     * @param arr
     */
    constructor(arr) {
        this.size = 0;
        this.data = arr || [];
    }

    static swap(a, b, array) {
        const temp = array[b];
        array[b] = array[a];
        array[a] = temp;
    }

    /**
     * 若要构造小顶堆，把>改成<即可
     * 插入新元素
     * 思路：先将数组放到数组末尾，然后逐步恢复堆序性
     * 跟其父元素比较大小，若大于父元素，则交换位置，并再和进一级父元素比较
     */
    push(value) {
        this.data[this.size] = value;
        let current = this.size;
        let father = Math.max(Math.floor((current - 1) / 2), 0);
        while (this.data[current] < this.data[father]) {
            Heap.swap(current, father, this.data);
            current = father;
            father = Math.max(Math.floor((current - 1) / 2), 0);
        }
        this.size++;
    }

    top() {
        return this.data[0];
    }

    /**
     * 更新堆序性思路:
     * 1. 找到根节点，左子树，右子树根节点，比较出最大的那个
     * 2. 如果根节点不是最大的，将根节点和实际最大的元素交换。并继续下沉检查
     * 3. 如果根节点是最大的，说明当前的堆序性质暂时正确。本次更新结束。
     * @param pos 要更新元素的位置
     * @param length
     * @private
     */
    _update(pos, length) {
        let l_child = 2 * pos + 1;
        let r_child = 2 * pos + 2;
        let max_value_pointer = pos;
        if (l_child < this.size && this.data[l_child] < this.data[max_value_pointer]) {
            max_value_pointer = l_child;
        }
        if (r_child < this.size && this.data[r_child] < this.data[max_value_pointer]) {
            max_value_pointer = r_child;
        }
        // 如果和当前位置的不相等，就交换
        if (max_value_pointer !== pos) {
            Heap.swap(pos, max_value_pointer, this.data);
            // 这里的max_value_pointer 已经不是三者中最大的了，这个应该是被替换过的根元素
            this._update(max_value_pointer, length);
        }
    }

    /**
     * 取顶思路：
     * 1. 将最大的和最小的交换
     * 2. 将最大指针前移
     * 3. 恢复指针前移后的堆序性
     * 3. 弹出最后一个
     * @return {*[]}
     */
    pop() {
        Heap.swap(0, this.size - 1, this.data);
        this.size--;
        this._update(0, this.size);
        return this.data.pop();
    }

    /**
     * 堆排序思路
     * 从处在最小位置的元素开始和处在根位置的交换，
     * 目的是通过将其放在最大的位置，进行一系列堆序性调整，将其落位到正确位置
     * 直到检查完所有元素为止。
     */
    sort() {
        for (let i = this.size - 1; i >= 1; i--) {
            Heap.swap(i, 0, this.data);
            this._update(0, i);
        }
    }
}

// let arr = [ 12, 9, 30, 24, 30, 4, 55, 64, 22, 37 ];
// let heap = new Heap();
// for (let i = 0; i < 10; i++) {
//     heap.push(arr[i]);
// }
// console.log(heap);
// console.log(heap.pop());
// console.log(heap.pop());
// console.log(heap.pop());
// console.log(heap);
// heap.sort();
// console.log(heap);
