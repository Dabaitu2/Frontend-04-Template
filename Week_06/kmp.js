function match(source, pattern) {
    let dfa;
    // 模式串自我匹配的一次过程，还是使用状态机，只不过在中间也会进行状态机的更新，状态机是边构建边使用的，最终得到什么状态并不是目的
    function kmp() {
        // 初始化状态机
        dfa = new Array(256).fill(null).map(_ => new Array(pattern.length).fill(null).map(_ => 0));
        dfa[pattern.charAt(0)][0] = 1;
        // 主串始终保持前进，相当于每轮都要读入一个输入，
        // 模式串位置根据dfa状态发生流转变化，k是状态，从0开始，每一轮读取一个新的输入，状态都会发生变化
        for (let k = 0, j = 1; j < pattern.length; j++) {
            // 对于字符c在j位置失配，可以直接回退到当前k指定的状态，使用对应的状态机继续计算
            for (let c = 0; c < 256; c++) {
                dfa[c][j] = dfa[c][k];
            }
            // 处理唯一的非失配情况
            dfa[pattern.charAt(j)][j] = j + 1;
            // 在思想上请屏蔽pattern.charAt(j)带来的细节
            // 就认为是对于mealy状态机，当前状态k + 当前输入应该获得一个新的状态
            k = dfa[pattern.charAt(j)][k];
        }
    }

    function search() {
        let i, j;
        // 如果主串检查到达了长度，说明匹配失败，会退出
        // 如果模式串检查到达了长度，说明匹配成功，也会退出，不过此时的i就会小于source的长度了
        for (i = 0, j = 0; i < source.length && j < pattern.length; i++) {
            j = dfa[source.charAt(i)][j];
        }
        // 如果最终的状态 === 模式串长度，说明已经成功匹配到了。当前的i - pattern 长度即为匹配到的开始位置
        if (j === pattern.length) {
            return i - pattern.length;
        } else {
            return false;
        }
    }

    kmp();
    return search();
}



match('abababc', 'ababc');
