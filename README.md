# picross_answer
行吧, 实际上这是个很无聊的东西, Picross answer, 输入数独图的长宽与每一行每一列的数字作为JS的数组, 系统就会自动跑出结果
Alright. A boring thing. Picross answer. Input the height & width & every numbers in the rows & columns. It will show you the result.

依托Nodejs, 不过实际上没有使用任何NODE的东西, 移植到单page也没啥问题
It depends on Node but it do not use anything of node. I think it's no problem to move the code to a simple page.

逻辑?穷举, 穷举 & 穷举, 然后逐行运算, 最后得出结果
Logic? Exhaustion, Exhaustion & Exhaustion. Calculating rows by rows, columns by columns.
