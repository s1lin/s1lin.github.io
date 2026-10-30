export type Lang = "en" | "zh" | "ja";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
];

/** Inline markup in the copy: **bold**, *italic*, [text](url). */
export interface Copy {
  run: string;
  grid: string;
  gridOn: string;
  gridOff: string;
  back: string;
  kicker: string;
  title: string;
  lede: string;
  why: { h: string; body: string[] };
  rules: { h: string; intro: string; items: { name: string; text: string }[]; note: string };
  play: {
    h: string;
    tabs: [string, string];
    puzzleIntro: string;
    levels: string;
    gens: (n: number) => string;
    inLabel: string;
    outLabel: string;
    submit: string;
    next: string;
    undo: string;
    reset: string;
    wrong: string;
    status: (a: number, w: number) => string;
    solved: (a: number, w: number) => string;
    padIntro: string;
  };
  pad: {
    stages: { name: string; goal: string }[];
    stageLabel: string;
    toolbox: string;
    draw: string;
    drawHint: string;
    creatures: string;
    seeds: string;
    soup: string;
    clear: string;
    gun: string;
    twoGuns: string;
    transport: string;
    runBtn: string;
    pauseBtn: string;
    stepBtn: string;
    speed: string;
    wrap: string;
    readout: string;
    gen: string;
    alive: string;
    ages: [string, string, string, string];
    locked: string;
  };
  study: {
    h: string;
    prose: string[];
    pull: string;
    timelineH: string;
    timeline: { year: string; text: string }[];
    zooCaption: string;
    cols: [string, string, string, string, string, string];
    kinds: Record<string, string>;
    moves: { left: string; right: string; diag: string };
    readingH: string;
    reading: string[];
  };
  creatures: Record<string, { name: string; note: string }>;
  footer: string;
}

const EN: Copy = {
  run: "ライフ · Life — a grid, a rule, no instructions",
  grid: "Grid",
  gridOn: "on",
  gridOff: "off",
  back: "← Back to the issue",
  kicker: "ライフ · A game with no players · 1970",
  title: "Life",
  lede: "A grid of cells, each alive or dead. Four rules, no dice, no players. Set it going and it does what it does: it blinks, it walks, it builds machines.",
  why: {
    h: "Why it is here",
    body: [
      "I first met the Game of Life at St. John's University in Minnesota, in a class taught by Prof. [Lynn Ziegler](https://www.linkedin.com/in/ziegler-lynn-6670201b). He is an incredible professor, and I studied a great deal from him, from computer organization to this game.",
      "Four rules and a grid, and a machine grows out of it. It was the first time I saw computation as something that grows rather than something that is written.",
      "I believe it is somehow related to AGI. I just don't have a clue how yet, lol. So I put it here, as a puzzle, in case you do.",
    ],
  },
  rules: {
    h: "The rules",
    intro:
      "Every cell has eight neighbours: up, down, left, right and the four corners. All cells change at the same moment, by counting how many of those eight are alive. That is the whole game. In the pictures, the cell in the middle is the one being judged.",
    items: [
      { name: "Loneliness", text: "A living cell with fewer than two living neighbours dies." },
      { name: "Company", text: "A living cell with two or three living neighbours lives on." },
      { name: "Crowding", text: "A living cell with more than three living neighbours dies." },
      { name: "Birth", text: "A dead cell with exactly three living neighbours comes alive." },
    ],
    note: "The same four sentences can be said as two: a cell is alive next time if it has three living neighbours, or if it is alive now and has two. The field writes it B3/S23: born on 3, survives on 2 or 3.",
  },
  play: {
    h: "Play",
    tabs: ["Puzzles: predict it", "Launch pad: make it"],
    puzzleIntro:
      "A grid goes in. Paint the grid it becomes after the number of generations shown. As in the ARC-AGI puzzles, nothing more is explained: the rules above are all the help there is, and a clean solve takes few actions.",
    levels: "Levels",
    gens: (n) => (n === 1 ? "generation →" : "generations →"),
    inLabel: "in",
    outLabel: "out",
    submit: "Submit ⏎",
    next: "Solved · next ⏎",
    undo: "Undo Z",
    reset: "Reset R",
    wrong: "Not that. Look again.",
    status: (a, w) => `Actions ${a} · Wrong ${w}`,
    solved: (a, w) => `Solved in ${a} actions, ${w} wrong.`,
    padIntro:
      "Start small and grow. Each stage is a bigger board with more in the toolbox: draw cells, set creatures down, then press Run. Cells are coloured by age.",
  },
  pad: {
    stages: [
      { name: "Garden", goal: "Draw three cells in a row and run it. What does it do?" },
      { name: "Field", goal: "Put a glider where it will meet a block. Who wins?" },
      { name: "Plain", goal: "Drop the R-pentomino and watch it for a thousand generations." },
      { name: "Gun range", goal: "Load the gun, then stand something in the way of its gliders." },
    ],
    stageLabel: "Stage",
    toolbox: "Toolbox",
    draw: "✎ Draw",
    drawHint: "Click or drag to add; shift-drag to rub out.",
    creatures: "Creatures",
    seeds: "Seeds",
    soup: "Soup",
    clear: "Clear",
    gun: "Gun",
    twoGuns: "Two guns",
    transport: "Run",
    runBtn: "Run",
    pauseBtn: "Pause",
    stepBtn: "Step",
    speed: "speed",
    wrap: "wrap edges",
    readout: "Readout",
    gen: "generation",
    alive: "alive",
    ages: ["new", "young", "settled", "ancient"],
    locked: "Run the stage before to open this one.",
  },
  study: {
    h: "The study of Life",
    prose: [
      "Conway was after a game that nobody could predict by looking: simple enough to play with pencil and graph paper, rich enough that no one could say whether a pattern would grow for ever. What he got is the best-known cellular automaton, and a quiet argument that complexity needs very little.",
      "Patterns fall into families. **Still lifes** do not change. **Oscillators** repeat in place. **Spaceships** repeat while moving; the glider is the smallest, and none can outrun one cell a generation, nor go straight faster than half of that. **Methuselahs** are small and take a very long time to settle. Of all of them the R-pentomino, five cells, is the most watched.",
      "The last part is a theorem, not a figure of speech. Because Life can build a computer out of gliders and guns, asking whether an arbitrary pattern will ever reach a given state is the halting problem in disguise, and has no general answer. You can only run it and see. The same freedom produces patterns with no past: *Gardens of Eden*, which no earlier generation can lead to, and which can only appear if someone puts them there.",
      "That is also why it suits a puzzle in the ARC manner. Each puzzle here has a single, exact answer that you can reach by reasoning from four sentences; a solver that has only seen the examples would have to work the sentences out for itself.",
    ],
    pull: "Rules that fit on a card, and a question no program can answer.",
    timelineH: "Timeline",
    timeline: [
      { year: "1940s", text: "John von Neumann, with Stanislaw Ulam's idea of a grid of cells, designs a self-reproducing automaton: a machine on a grid that builds a copy of itself. It needs twenty-nine states per cell." },
      { year: "1970", text: "John Conway sets out to find a rule as simple as it can be that still does something. In October Martin Gardner puts it in Scientific American, and readers begin to explore it." },
      { year: "1970", text: "Bill Gosper finds the glider gun, a pattern that fires a glider every 30 generations for ever. Life's population can grow without bound." },
      { year: "1982", text: "Winning Ways, by Berlekamp, Conway and Guy, sketches why Life can compute anything a computer can: gliders carry signals, guns make clocks, collisions make logic." },
      { year: "1984", text: "Gosper's Hashlife remembers every pattern it has seen, so that it can skip a million generations at once." },
      { year: "2000", text: "Paul Rendell builds a working Turing machine out of Life's cells." },
      { year: "2006", text: "Brice Due's OTCA metapixel is a Life pattern, 2,058 cells to a side, that behaves as one cell of Life. Life runs inside Life." },
      { year: "2020", text: "Conway dies on 11 April. The game he called a toy has outlived the toys around it." },
    ],
    zooCaption: "A few of them. Period and movement are checked against this page's engine.",
    cols: ["Name", "Kind", "Cells", "Period", "Moves", "What it does"],
    kinds: { "still life": "still life", oscillator: "oscillator", spaceship: "spaceship", methuselah: "methuselah" },
    moves: { left: "left", right: "right", diag: "diag." },
    readingH: "Reading",
    reading: [
      "Martin Gardner, “Mathematical Games: The fantastic combinations of John Conway's new solitaire game ‘life’”, *Scientific American* 223 (4), October 1970, pp. 120–123.",
      "E. R. Berlekamp, J. H. Conway and R. K. Guy, *Winning Ways for your Mathematical Plays*, vol. 2, 1982, chapter 25, “What is Life?”.",
      "R. W. Gosper, “Exploiting regularities in large cellular spaces”, *Physica D* 10, 1984, pp. 75–80.",
      "Paul Rendell, “Turing universality of the Game of Life”, in A. Adamatzky (ed.), *Collision-Based Computing*, Springer, 2002.",
      "The [LifeWiki](https://conwaylife.com/wiki/), the catalogue of everything found so far, and [Golly](https://golly.sourceforge.io/), the program that runs it fast.",
    ],
  },
  creatures: {
    block: { name: "Block", note: "The smallest square of four that nothing can break." },
    beehive: { name: "Beehive", note: "Six cells, each held by exactly two or three friends." },
    blinker: { name: "Blinker", note: "Three in a row; it stands up, lies down, forever." },
    toad: { name: "Toad", note: "Two rows of three, offset by one, swapping places." },
    pulsar: { name: "Pulsar", note: "Forty-eight cells in four mirrored arms, period 3." },
    glider: { name: "Glider", note: "Five cells that walk one square diagonally every four generations." },
    lwss: { name: "Lightweight spaceship", note: "Two squares to the left in four generations: half the speed of light, the fastest a straight mover can go." },
    "r-pentomino": { name: "R-pentomino", note: "Five cells that take 1,103 generations to settle, shedding gliders on the way." },
    diehard: { name: "Diehard", note: "Seven cells that vanish, but not before generation 130." },
  },
  footer:
    "Lifted from a Java Game of Life built on the ACM graphics library, with its two glider-gun seeds, into TypeScript. The engine, the puzzles and the creatures are MIT-licensed and have no dependencies; the tests check the period of every creature in the table.",
};

const ZH: Copy = {
  run: "ライフ · 生命游戏 — 一张网格，一条规则，没有说明",
  grid: "网格",
  gridOn: "开",
  gridOff: "关",
  back: "← 回到本期",
  kicker: "ライフ · 没有玩家的游戏 · 1970",
  title: "生命游戏",
  lede: "一张格子，每格或生或死。四条规则，没有骰子，没有玩家。让它跑起来，它自己会闪烁、会行走、会造出机器。",
  why: {
    h: "为什么放在这里",
    body: [
      "我第一次接触生命游戏，是在明尼苏达州的圣约翰大学（St. John's University）,授课的是 [Lynn Ziegler](https://www.linkedin.com/in/ziegler-lynn-6670201b) 教授。他是一位了不起的老师，从计算机组成原理到这个游戏，我跟他学到了太多。",
      "四条规则、一张网格，就长出了一台机器。那是我第一次看到：计算可以是“长”出来的，而不只是“写”出来的。",
      "我相信它和 AGI 多少有些关系，只是现在还毫无头绪，哈哈。所以我把它放在这里，做成一道题，万一你有头绪呢。",
    ],
  },
  rules: {
    h: "规则",
    intro: "每个格子有八个邻居：上下左右和四个角。所有格子在同一时刻变化，依据是这八个邻居里有几个活着。整个游戏就是这样。图中，位于中间的格子是被判定的那个。",
    items: [
      { name: "孤独", text: "活着的格子，活邻居少于两个，死去。" },
      { name: "作伴", text: "活着的格子，有两个或三个活邻居，继续活着。" },
      { name: "拥挤", text: "活着的格子，活邻居多于三个，死去。" },
      { name: "诞生", text: "死去的格子，恰好有三个活邻居，变为活着。" },
    ],
    note: "这四句话也可以说成两句：下一代活着，当且仅当它有三个活邻居，或者它现在活着且有两个活邻居。业内记作 B3/S23:三个出生，两个或三个存活。",
  },
  play: {
    h: "玩",
    tabs: ["谜题：预测它", "发射台：做出它"],
    puzzleIntro: "给你一张网格。画出经过所示代数之后它的样子。和 ARC-AGI 的题一样，不再多作解释：上面的规则就是全部提示，干净利落的解法只需要很少的操作。",
    levels: "关卡",
    gens: () => "代 →",
    inLabel: "输入",
    outLabel: "输出",
    submit: "提交 ⏎",
    next: "答对了 · 下一关 ⏎",
    undo: "撤销 Z",
    reset: "重置 R",
    wrong: "不对，再看看。",
    status: (a, w) => `操作 ${a} · 错误 ${w}`,
    solved: (a, w) => `用了 ${a} 步操作答对，错 ${w} 次。`,
    padIntro: "从小开始，慢慢变大。每一关棋盘更大，工具箱里的东西更多：画格子，放生物，然后按运行。格子按年龄着色。",
  },
  pad: {
    stages: [
      { name: "花园", goal: "画三个连成一行的格子，运行。它会怎样?" },
      { name: "田野", goal: "把滑翔机放到会撞上方块的位置。谁赢?" },
      { name: "平原", goal: "放下 R 五联块，看它跑一千代。" },
      { name: "靶场", goal: "载入滑翔机枪，再在它的滑翔机前面放点东西。" },
    ],
    stageLabel: "关",
    toolbox: "工具箱",
    draw: "✎ 画",
    drawHint: "点击或拖动添加;按住 Shift 拖动擦除。",
    creatures: "生物",
    seeds: "种子",
    soup: "随机汤",
    clear: "清空",
    gun: "枪",
    twoGuns: "双枪",
    transport: "运行",
    runBtn: "运行",
    pauseBtn: "暂停",
    stepBtn: "单步",
    speed: "速度",
    wrap: "边缘环绕",
    readout: "读数",
    gen: "代数",
    alive: "存活",
    ages: ["新生", "年轻", "稳定", "古老"],
    locked: "先运行上一关，再打开这一关。",
  },
  study: {
    h: "生命游戏的研究",
    prose: [
      "康威想要一个看一眼预测不了的游戏：简单到用铅笔和方格纸就能玩，又丰富到没人能说清一个图案会不会永远长下去。他得到的，是最有名的元胞自动机，以及一个安静的论点：复杂性只需要很少的东西。",
      "图案分成几个家族。**静物**不变。**振荡器**原地重复。**飞船**一边重复一边移动;滑翔机是最小的一种，没有任何图案能跑得过每代一格，直线移动也不可能超过它的一半。**长寿者**很小，却要很久才安定下来，其中五个细胞的 R 五联块最受关注。",
      "最后这一点是定理，不是修辞。因为生命游戏能用滑翔机和枪搭出一台计算机，所以问“任意图案会不会到达某个状态”就是伪装起来的停机问题，没有通用的答案，只能运行了看。同样的自由也产生了没有过去的图案：*伊甸园*,没有任何上一代能演化成它，只有人亲手放上去才会出现。",
      "这也是它适合做 ARC 式谜题的原因。这里每道题都有唯一确切的答案，从四句话推理就能得到;只看过例子的解题者，得自己把这四句话琢磨出来。",
    ],
    pull: "写得进一张卡片的规则，和一个没有程序能回答的问题。",
    timelineH: "时间线",
    timeline: [
      { year: "1940年代", text: "冯·诺依曼借用乌拉姆的格子想法，设计出自我复制的自动机：格子上的一台机器，造出自己的副本。每个格子需要二十九种状态。" },
      { year: "1970", text: "约翰·康威着手寻找一条尽可能简单、却仍然能“做点什么”的规则。十月，马丁·加德纳把它登在《科学美国人》上，读者纷纷开始探索。" },
      { year: "1970", text: "比尔·戈斯珀发现了滑翔机枪：每30代永远发射一个滑翔机的图案。生命游戏里的数量可以无限增长。" },
      { year: "1982", text: "伯利坎普、康威和盖伊合著的《制胜之道》勾勒出为什么生命游戏能计算计算机能算的一切：滑翔机传递信号，枪做时钟，碰撞做逻辑。" },
      { year: "1984", text: "戈斯珀的 Hashlife 记住见过的每个图案，因此可以一次跳过一百万代。" },
      { year: "2000", text: "保罗·伦德尔用生命游戏的格子造出了一台能工作的图灵机。" },
      { year: "2006", text: "布莱斯·杜的 OTCA 元像素是一个边长2,058格的生命图案，它表现得像生命游戏里的一个格子。生命在生命里运行。" },
      { year: "2020", text: "康威于4月11日去世。他称之为玩具的这个游戏，比周围的玩具都活得久。" },
    ],
    zooCaption: "其中几个。周期和移动已对照本页的引擎核验。",
    cols: ["名称", "类别", "细胞", "周期", "移动", "它做什么"],
    kinds: { "still life": "静物", oscillator: "振荡器", spaceship: "飞船", methuselah: "长寿者" },
    moves: { left: "向左", right: "向右", diag: "斜向" },
    readingH: "延伸阅读",
    reading: [
      "Martin Gardner, “Mathematical Games: The fantastic combinations of John Conway's new solitaire game ‘life’”， *Scientific American* 223 (4), 1970年10月， pp. 120–123.",
      "E. R. Berlekamp, J. H. Conway and R. K. Guy, *Winning Ways for your Mathematical Plays*, vol. 2, 1982, 第25章 “What is Life?”.",
      "R. W. Gosper, “Exploiting regularities in large cellular spaces”， *Physica D* 10, 1984, pp. 75–80.",
      "Paul Rendell, “Turing universality of the Game of Life”， in A. Adamatzky (ed.), *Collision-Based Computing*, Springer, 2002.",
      "[LifeWiki](https://conwaylife.com/wiki/):迄今发现的一切的目录;[Golly](https://golly.sourceforge.io/):跑得飞快的程序。",
    ],
  },
  creatures: {
    block: { name: "方块", note: "四个格子组成的最小的方，什么也打不破它。" },
    beehive: { name: "蜂巢", note: "六个格子，每个都恰好被两三个朋友撑住。" },
    blinker: { name: "闪烁器", note: "三个排成一行;站起来，躺下去，永远如此。" },
    toad: { name: "蟾蜍", note: "两行各三个，错开一格，轮流换位。" },
    pulsar: { name: "脉冲星", note: "四条镜像的臂共四十八个格子，周期3。" },
    glider: { name: "滑翔机", note: "五个格子，每四代斜着走一格。" },
    lwss: { name: "轻型飞船", note: "四代向左两格：光速的一半，是直线移动的最快速度。" },
    "r-pentomino": { name: "R 五联块", note: "五个格子要1,103代才安定，一路抛出滑翔机。" },
    diehard: { name: "死硬派", note: "七个格子，终会消失，但要等到第130代。" },
  },
  footer: "从一个基于 ACM 图形库的 Java 生命游戏，连同它的两个滑翔机枪种子，搬到了 TypeScript。引擎、谜题和生物均以 MIT 许可发布，没有依赖;测试核验表中每个生物的周期。",
};

const JA: Copy = {
  run: "ライフ · ライフゲーム — 格子、ルール、説明なし",
  grid: "グリッド",
  gridOn: "オン",
  gridOff: "オフ",
  back: "← 本誌へ戻る",
  kicker: "ライフ · プレイヤーのいないゲーム · 1970",
  title: "ライフゲーム",
  lede: "マス目の一つ一つが、生きているか死んでいるか。ルールは四つ、サイコロもプレイヤーもなし。動かせば、点滅し、歩き、機械まで作ります。",
  why: {
    h: "なぜここにあるのか",
    body: [
      "ライフゲームに初めて出会ったのは、ミネソタ州のセント・ジョンズ大学（St. John's University）、[Lynn Ziegler](https://www.linkedin.com/in/ziegler-lynn-6670201b) 教授の授業でした。本当にすばらしい教授で、コンピュータ組織論からこのゲームまで、たくさんのことを学びました。",
      "四つのルールと一枚の格子から、機械が育つ。計算は「書く」ものだけでなく「育つ」ものでもある、と初めて見たのがこのときです。",
      "AGI とどこかでつながっていると信じていますが、どうつながるかはまだ全然わかりません(笑)。だからここに謎として置きました。もしあなたに手がかりがあれば。",
    ],
  },
  rules: {
    h: "ルール",
    intro: "どのマスにも八つの隣があります。上下左右と四つの角。すべてのマスが同時に、その八つのうち何個が生きているかを数えて変わります。ゲームはそれだけです。図では、真ん中のマスが判定される側です。",
    items: [
      { name: "孤独", text: "生きているマスは、生きている隣が二つ未満なら死ぬ。" },
      { name: "仲間", text: "生きているマスは、生きている隣が二つか三つなら生き続ける。" },
      { name: "過密", text: "生きているマスは、生きている隣が三つより多いと死ぬ。" },
      { name: "誕生", text: "死んでいるマスは、生きている隣がちょうど三つなら生まれる。" },
    ],
    note: "この四文は二文にもできます。次の世代で生きているのは、隣が三つ生きているマス、または今生きていて隣が二つのマス。専門では B3/S23 と書きます。3で誕生、2か3で生存。",
  },
  play: {
    h: "遊ぶ",
    tabs: ["パズル：予測する", "発射台：作る"],
    puzzleIntro: "格子が一つ渡されます。示された世代数のあとの姿を塗ってください。ARC-AGI のパズルと同じく、説明はこれ以上ありません。上のルールだけがヒントで、きれいな解答は操作が少なくて済みます。",
    levels: "レベル",
    gens: () => "世代 →",
    inLabel: "入力",
    outLabel: "出力",
    submit: "提出 ⏎",
    next: "正解 · 次へ ⏎",
    undo: "元に戻す Z",
    reset: "リセット R",
    wrong: "違います。もう一度。",
    status: (a, w) => `操作 ${a} · 誤り ${w}`,
    solved: (a, w) => `${a} 回の操作で正解、誤り ${w} 回。`,
    padIntro: "小さく始めて、大きく育てます。ステージが進むほど盤面が広がり、道具箱の中身が増えます。セルを描き、生き物を置いて、実行。セルは年齢で色が変わります。",
  },
  pad: {
    stages: [
      { name: "庭", goal: "三つのセルを横一列に描いて実行。何が起きる?" },
      { name: "野原", goal: "グライダーをブロックにぶつかる位置に置こう。どちらが勝つ?" },
      { name: "平原", goal: "R-ペントミノを置いて、千世代見守ろう。" },
      { name: "射撃場", goal: "ガンを読み込み、そのグライダーの進路に何かを置こう。" },
    ],
    stageLabel: "ステージ",
    toolbox: "道具箱",
    draw: "✎ 描く",
    drawHint: "クリックかドラッグで追加、Shift+ドラッグで消す。",
    creatures: "生き物",
    seeds: "種",
    soup: "ランダム",
    clear: "クリア",
    gun: "ガン",
    twoGuns: "ガン二つ",
    transport: "実行",
    runBtn: "実行",
    pauseBtn: "一時停止",
    stepBtn: "ステップ",
    speed: "速度",
    wrap: "端をつなぐ",
    readout: "表示",
    gen: "世代",
    alive: "生存",
    ages: ["新生", "若い", "安定", "古参"],
    locked: "前のステージを実行すると開きます。",
  },
  study: {
    h: "ライフゲームの研究",
    prose: [
      "コンウェイが求めたのは、見ただけでは誰も予測できないゲームでした。鉛筆と方眼紙で遊べるほど単純で、あるパターンが永遠に増え続けるかどうか誰にも言えないほど豊か。そうして生まれたのが最も有名なセル・オートマトンであり、複雑さはごくわずかなもので足りる、という静かな主張です。",
      "パターンはいくつかの家族に分かれます。**静物**は変わりません。**振動子**はその場で繰り返します。**宇宙船**は動きながら繰り返し、グライダーが最小です。どんなパターンも一世代に一マスより速くは進めず、まっすぐ進む場合はその半分より速くなれません。**メトセラ**は小さいのに、落ち着くまで非常に長くかかります。中でも五つのセルの R-ペントミノは最も注目されてきました。",
      "最後の点は比喩ではなく定理です。ライフはグライダーとガンでコンピュータを組めるので、任意のパターンがある状態に到達するかを問うのは停止問題の言い換えになり、一般的な答えはありません。動かして見るしかないのです。同じ自由さが、過去を持たないパターンも生みます。*エデンの園*は、どんな前の世代からも到達できず、誰かが置いたときにしか現れません。",
      "これが ARC 風のパズルに向いている理由でもあります。ここの問題にはどれも一つの正確な答えがあり、四つの文から推論して届きます。例だけを見た解き手なら、その四つの文を自分で見つけなければなりません。",
    ],
    pull: "カード一枚に収まるルールと、どんなプログラムにも答えられない問い。",
    timelineH: "年表",
    timeline: [
      { year: "1940年代", text: "ジョン・フォン・ノイマンが、スタニスワフ・ウラムのセルの格子の発想を使い、自己複製オートマトンを設計。格子の上の機械が自分の複製を作ります。セルあたり二十九の状態が必要でした。" },
      { year: "1970", text: "ジョン・コンウェイが、できるだけ単純で、それでも何かをするルールを探し始めます。十月にマーティン・ガードナーが「サイエンティフィック・アメリカン」に載せ、読者が探索を始めます。" },
      { year: "1970", text: "ビル・ゴスパーがグライダー・ガンを発見。30世代ごとにグライダーを永遠に撃ち出すパターンで、ライフの個体数は限りなく増えられます。" },
      { year: "1982", text: "バーレカンプ、コンウェイ、ガイの『Winning Ways』が、ライフがコンピュータにできることを何でも計算できる理由を概説。グライダーが信号を運び、ガンが時計になり、衝突が論理になります。" },
      { year: "1984", text: "ゴスパーの Hashlife は見たパターンをすべて記憶し、百万世代を一度に飛ばせます。" },
      { year: "2000", text: "ポール・レンデルが、ライフのセルで動くチューリング機械を作ります。" },
      { year: "2006", text: "ブライス・デューの OTCA メタピクセルは、一辺2,058セルで、ライフの一つのセルのように振る舞うパターン。ライフの中でライフが動きます。" },
      { year: "2020", text: "コンウェイが4月11日に死去。彼がおもちゃと呼んだこのゲームは、周りのおもちゃより長く生き残りました。" },
    ],
    zooCaption: "そのうちのいくつか。周期と移動は、このページのエンジンで確かめています。",
    cols: ["名前", "種類", "セル数", "周期", "移動", "どんな動き"],
    kinds: { "still life": "静物", oscillator: "振動子", spaceship: "宇宙船", methuselah: "メトセラ" },
    moves: { left: "左", right: "右", diag: "斜め" },
    readingH: "参考文献",
    reading: [
      "Martin Gardner, “Mathematical Games: The fantastic combinations of John Conway's new solitaire game ‘life’”、 *Scientific American* 223 (4), 1970年10月、 pp. 120–123.",
      "E. R. Berlekamp, J. H. Conway and R. K. Guy, *Winning Ways for your Mathematical Plays*, vol. 2, 1982, 第25章 “What is Life?”.",
      "R. W. Gosper, “Exploiting regularities in large cellular spaces”、 *Physica D* 10, 1984, pp. 75–80.",
      "Paul Rendell, “Turing universality of the Game of Life”、 in A. Adamatzky (ed.), *Collision-Based Computing*, Springer, 2002.",
      "[LifeWiki](https://conwaylife.com/wiki/):これまでに見つかったものの目録。[Golly](https://golly.sourceforge.io/):高速に動かすプログラム。",
    ],
  },
  creatures: {
    block: { name: "ブロック", note: "四つのセルでできた最小の正方形。何をしても崩れません。" },
    beehive: { name: "ビーハイブ", note: "六つのセル。どれも二つか三つの仲間に支えられています。" },
    blinker: { name: "ブリンカー", note: "三つが一列。立ち上がり、横になり、永遠に繰り返す。" },
    toad: { name: "トード", note: "三つの二列を一つずらして、交互に入れ替わります。" },
    pulsar: { name: "パルサー", note: "四本の対称な腕に四十八セル、周期3。" },
    glider: { name: "グライダー", note: "五つのセルが、四世代で斜めに一マス歩きます。" },
    lwss: { name: "軽量級宇宙船", note: "四世代で左に二マス。光速の半分で、まっすぐ進む最速です。" },
    "r-pentomino": { name: "R-ペントミノ", note: "五つのセルが、落ち着くまで1,103世代かかり、途中でグライダーを撒きます。" },
    diehard: { name: "ダイハード", note: "七つのセルがやがて消えますが、130世代目までは消えません。" },
  },
  footer: "ACM グラフィックスライブラリで作られた Java 版ライフゲームと、その二つのグライダー・ガンの種を、TypeScript に移したものです。エンジン、パズル、生き物は MIT ライセンスで依存関係なし。テストが表の全生き物の周期を確認します。",
};

export const COPY: Record<Lang, Copy> = { en: EN, zh: ZH, ja: JA };
