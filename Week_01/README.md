# 如何用js实现一个婴幼儿五子棋(ruozhi)的AI?
### 厘清一些基本概念
1. 我们玩GalGame的时候，通常有n多个结局，我们想要打出最好的结局，
   就要在中途做好一系列的选择。
2. 棋类游戏的计算其实也是如此。实际上，这两种情况都可以看作是**博弈树**的应用。
博弈树，简单来说就是当我们进行一步操作之后，推想对方下一步所有的操作，
构成了当前这步操作的子节点。而对于这些子节点也可以执行同样的推演操作。
就可以形成一颗树结构，可以理解为一个选择分支造成的平行世界。
而厉害的棋手，通常能够多思考好几步，评估最优的解。
3. 在明白棋局是一颗博弈树以后，我们可以想到，选择下一步实际上是选择推演若干步后，产生的子节点平行世界中对我方最有利的情况。那么需要处理的问题有两个:
    1. 推演多少步?
    2. 怎么判断棋局对我方的情况是有利还是不利呢?
4. 针对2中提出的两个问题，对于五子棋而言，我们要清楚
    1. 五子棋在现有一般算力情况下，递归到棋局的终结是不可能的，假设每一步都对应50步后续应对，除非有尾递归优化，推算10步就需要 50^10 层堆栈深度，js的栈内存是撑不住的，就算用了尾递归，其运算时间也是难以估计的。
    2. 五子棋的胜负计算，不能像tic-tac-toe那种游戏一样，直接用简单的胜、负、和来表示。实际上，需要定义一个局势的判断函数，通过检查棋盘，判断不同的棋型。对不同的棋型定不同的分数。
5. 因此，想要实现一个比较好的五子棋AI, 我们要做两件事
    1. 选择推演合适的步数，但同时也要尽可能的优化算法，使得推演尽可能层数更深。ai就可以考虑的更多。也"更聪明"。
    2. 找出一个合适的函数，来评估局势
6. 我们先来解决问题2，如果我们的棋局只推演1步，那么我们应该怎么计算局势呢？
   1. 将图形化的棋局转化为量化的数据，这意味着我们编写ai的人，实际上也需要了解五子棋的基本规则.
   2. 五子棋的规则除了五颗字连上就赢了以外，还需要记忆一些棋型，比如当我们看到四子连珠，就知道棋局快要赢了或者输了。
   但四子连珠又分成被堵住一边的和两边都没被堵住的。同理，我们也可以对于三子连珠等情况进行一个评分。对于五子棋，这些棋型是有统一的名字的。
   关于这些棋型名字和对应的棋型以及他们所占的权重，网上有很多例子可查。这里不赘述。
   3. 棋型的计算不仅是我们的，还要算对面的，如果我们棋型的权重为正向的，那么对方棋型的权重就应该是负向的，并且相同棋型下，对方的权重应该更高，因为我们需要再推演一步才能到达那个情况
   4. 因此，我们的评估函数可以简单理解为
   ```ts
       function evaluate(pattern) {
           return getScoreOfUs(pattern) + getScoreOfEnemy(pattern);
       }
   ```
   再将这一系列棋盘的值一一对比，选出最高的，就是我们的结果了
7. 但是还有个问题，我们如何让计算机多算几步？难道每一步都得去完全遍历棋盘评估局势吗? 
当然不是了，这里涉及一个算法，叫做极大极小值算法。通俗的说来，就是除了最后一步是靠评估函数得出值以外。
每向上回溯一层，我们判断这一步是谁走的，
    1. 如果是对面走的，对面一定也会做这样的计算，并且下出使我们局势得分中最低的一手。这一手得到局势的分数作为此节点的分数。
    2. 如果是我们走的，我们会根据每种情况下对面走的局势中最差的点组成的子节点集合中，选出分数最高的。作为当前节点的分数。
    3. 交替回溯直到根节点，跟节点根据第二层的最高得分选择下哪一步。这样就完成了"多思考"的能力。
    
8. 最后一个问题，由于每一层演化需要的步骤都是指数级上升的，如何使得遍历的层数尽可能深的情况下，还能保证不要出现爆栈和过多的长考？
这个地方可以采取合适的剪枝策略，类似tic-tac-toe的预先判断胜利。五子棋也有很多剪枝方法，最流行的是alpha-beta剪枝（但是这次我没用😂）。
具体操作也可以参见网上的说明。
   
   
### 婴幼儿AI 做出的取舍
1. 由于说了是婴幼儿AI，其智力是比较低的，也就是思考的层数不深（其实是因为我代码并没有做任何优化, 导致层数一上去就卡了)
2. 评估局势的函数不一定考虑了所有的边界情况，也没有考虑禁手，交叉棋型造成的加成效果。


### 具体实现
见Week_01/homework/five_chess.html, 可以直接运行。也可以通过调整棋盘大小和最大深度来调整ai能力
现在应该还是有些小bug，比如有时候ai会不认识我方的活三。但如果我一味去堵ai的棋，ai还是能经常赢我的（可能是我太菜了..)
