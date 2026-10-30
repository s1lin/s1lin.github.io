import { Fragment } from "react";
import { Ref, SourceLink } from "@/components/bits";
import { Tex } from "@/components/Tex";
import type { Post } from "@/content/posts";

const ORIGINAL = "https://mp.weixin.qq.com/s/13WAnogvuttjdl5ipvq3jA";

/** 贝叶斯定理：你认为的事就是你认为的那样吗？ The first piece on 呓语种地, numbered 00. Its formulas, plain text on WeChat, are set in LaTeX. */
export const bayes: Post = {
  slug: "bayes",
  no: "00",
  title: "贝叶斯定理：你认为的事就是你认为的那样吗？",
  lang: "zh-Hans",
  id: "752dc562-ac76-42bf-b904-c6229f92b91e",
  dek: "A primer on Bayes' theorem, written as COVID-19 spread: the boy-or-girl paradox, a taxi seen at night, and why the chance of the evidence given a belief is not the chance of the belief.",
  spec: [
    ["Language", "Chinese"],
    ["Column", <span key="column" lang="zh-Hans">科普</span>],
    [
      "First ran",
      <Fragment key="ran">
        On the WeChat account <span lang="zh-Hans">呓语种地</span>, its first piece.{" "}
        <a href={ORIGINAL}>The original&nbsp;↗</a>
      </Fragment>,
    ],
    ["Author", "s1lin"],
    ["Editor", <span key="editor" lang="zh-Hans">司马严</span>],
    ["Proofs", <span key="proofs" lang="zh-Hans">Joe是宅</span>],
    ["Pictures", "The virus: CDC, public domain. Bayes: via Wikipedia"],
    ["Formulas", "Set in LaTeX here; plain text in the original"],
  ],
  body: (
    <>
      <p>
        2019年底到2020年初，新冠肺炎疫情席卷全球。在全球越来越紧绷的氛围下，我们会因为得了普通的感冒而焦虑异常，并不停地刷微博、朋友圈，上百度查资料，担心你的感冒症状就意味着自己得了新冠肺炎。你发现你的感冒症状和新冠肺炎的症状有95%的重合度，所以你真的得了新冠肺炎的概率就是95%吗？
      </p>
      <figure>
        <img
          src="/assets/img/blog-sars-cov-2.webp"
          width={984}
          height={554}
          loading="lazy"
          alt="新冠病毒的示意图：灰色的球体，表面布满红色的刺突"
        />
        <figcaption>2019年新冠肺炎病毒图 MAM/CDC/Handout via REUTERS</figcaption>
      </figure>

      <h2>从概率说起</h2>
      <p>让我们先看看从以下的两个问题中，你能从中得出什么结论吧。</p>
      <blockquote>
        <p>班上有50人，如果有一人得了感冒，那么小明得感冒的概率是多少呢？</p>
        <p>
          假设A市有两种颜色的出租车：绿和蓝，其中85%是绿色。有天晚上一辆出租车在夜间肇事后逃逸，但还好当时有一位目击证人。这位目击者认定肇事的出租车是蓝色的。公安人员经过在相同环境下对该目击者进行“蓝绿”辨色测试而得到：
          <strong>其在80%的情况下识别正确，20%的情况不正确</strong>。那么其“目击的可信度”是多少呢？
        </p>
      </blockquote>
      <p>
        那么，对第一问也许你会说，“简单，50人中有一个人感冒，那么小明感冒的概率就是五十分之一即2%”。至于第二问，
        <strong>如果在80%的情况下，证词是准确的，那么目击者的可信度就是80%，就算可能低一点，但是肇事的出租车一定是蓝色。</strong>
      </p>
      <p>
        没错，通过问题中的信息，我们可以“轻松”得出以上的两个结论。那么，我们把第一个问题修改一下，再看看你又能得出什么结论呢？
      </p>
      <blockquote>
        <p>班上有50人，如果有一人得了感冒，那么小明得感冒的概率是多少呢？（原问）</p>
        <p>
          <strong>班上有50人，如果小明得了感冒，那么这个班的所有学生得感冒的概率是多少呢？</strong>
        </p>
      </blockquote>
      <p>
        现在，你也许会说，两个问题的概率是一样的，都是2%。<strong>那么修改前后的两问题究竟有什么区别呢？</strong>
      </p>

      <h2>什么是“贝叶斯定理”？</h2>
      <figure>
        <img
          src="/assets/img/blog-thomas-bayes.webp"
          width={304}
          height={326}
          loading="lazy"
          alt="托马斯·贝叶斯的版画肖像"
        />
        <figcaption>托马斯·贝叶斯（Thomas Bayes，1701-1761），英国统计学家，哲学家。图片来自维基百科。</figcaption>
      </figure>
      <p>要理解贝叶斯定理，我们从一个简单的小问题开始：</p>
      <p>
        假设你的邻居有两个孩子，有一天，你去问他：“<strong>你的孩子中有没有男孩啊？</strong>
        ”他说：“有。”那么他的另一个小孩是女孩的概率是多少呢？
      </p>
      <p>
        你可能会不假思索的说，二分之一，因为有两个孩子，他说了有男孩子，那么至少有一个是男孩，
        <strong>剩下的那个既可能是男孩，也可能是女孩，那么是女孩子的概率就是50%</strong>。
      </p>
      <p>
        真的是这样吗？我们试想一下，在我们向邻居提问之前，我们猜测，他的孩子的性别组合会是：
        <strong>男+男，女+男，男+女，女+女</strong>，这四种情况，也就是说，
        <strong>是一男一女的可能性是50%，而是两个男孩或者两个女孩的可能性只有25%</strong>
        。那么，在你知道有一个孩子是男孩的情况下，<strong>其实就只剩下3种可能性而非4种可能性</strong>
        ，即，孩子的性别组合只能是{"{"}男+男，女+男，男+女{"}"}，那么第二个孩子是女孩的情况就是三分之二。
      </p>
      <p>
        等等，发生了什么？难道{"{"}女+男{"}"} 和 {"{"}男+女{"}"} 不应该是一样的吗？
        <strong>当然不一样，因为我们没有确定两个孩子谁是男孩，谁是女孩</strong>
        。假设你的面前有两个性别不同的孩子站着，那么就会产生两种情况，左边是男孩，右边是女孩，或者左边是女孩而右边是男孩。所以
        {"{"}女+男{"}"} 和 {"{"}男+女{"}"} 是两种完全不同的情况。
      </p>
      <p>
        我们再把问题修改一下：假设你的邻居有两个孩子，有一天，<strong>你看见了其中一个的小孩跑过，是男孩</strong>
        。那么，剩下的那个是女孩的可能性是多少呢？于是你可能会不假思索地说，三分之二！
      </p>
      <p>
        那么我们再来分析一下：在你看到这个小男孩之前，你是不知道他们家的孩子的性别组成的。也就是说，他的孩子的性别组成是：
        {"{"}男+男，女+男，男+女，女+女{"}"}。但当你看见这个小男孩的时候，你就知道他们家一定有一个男孩，也就是说，
        <strong>剩下的小孩只可能是{"{"}男，女{"}"}两个性别，所以，是二分之一</strong>。
      </p>
      <p>
        等等。为什么这个时候不考虑他们家的两个孩子的性别组成，而只考虑一个孩子了呢？
        <strong>这个问题被称为男女孩悖论（Boy or Girl Paradox）。</strong>
      </p>
      <p>那么，究竟问题出在哪里？</p>
      <p>
        你明明觉得两个问题是一样的，<strong>一个是我知道有男孩，另一个是我看见了一个男孩</strong>
        。就像郭德纲的相声里，说的：“于老师去给人家做形象大便了。” 于谦说：“那叫形象大shǐ。” 郭德纲问：“有什么区别？”
      </p>
      <p>
        区别就在于，我们在计算概率时，<strong>你的选项必须来自于观察的现实，而不是逻辑假设</strong>
        。也就是说，在第一个问题中，你并没有观察到你邻居家有一个男孩，只是他告诉你他有一个男孩，于是你便推测出：他们家的孩子的性别组成情况只可能是
        {"{"}男+男，女+男，男+女{"}"}。
      </p>
      <p>
        但是第二个问题中，<strong>你是千真万确地看见了邻居家的男孩</strong>
        ，于是，你可以直接认为，剩下的孩子只可能是男孩或者女孩，而不再需要考虑第一个孩子的情况了，因为你观测到了“现实”。
      </p>
      <p>
        在数学中，我们把所求的概率建立在观测某种事件后的概率称为<strong>条件概率（Conditional Probability）</strong>或者
        <strong>后验概率（Posterior probability）</strong>。那么，上面的男女悖论中的概率，我们记作：
      </p>
      <blockquote>
        <Tex block>{String.raw`P(\text{第二个孩子是女孩} \mid \text{已知邻居有至少一个男孩的情况下}) = \frac{2}{3}`}</Tex>
        <p>
          在已知邻居有<strong>至少一个男孩</strong>的情况下，第二个孩子是女孩的后验概率。
        </p>
        <Tex block>{String.raw`P(\text{第二个孩子是女孩} \mid \text{已知邻居有一个男孩的情况下}) = \frac{1}{2}`}</Tex>
        <p>
          在已知邻居<strong>有一个男孩</strong>的情况下，第二个孩子是女孩的后验概率。
        </p>
      </blockquote>
      <p>
        既然条件概率称为后验概率，那么不要建立在其它条件的概率是否就是先验概率呢？当然，简单地来说，
        <strong>先验概率是，某一个独立事件发生的概率</strong>
        ，例如抛硬币得到落地时正面或反面朝上的概率，就是1/2。也可以理解为是通过大范围的统计或者反复实验得到的概率，我们称为
        <strong>先验概率（Prior Probability）。</strong>
      </p>
      <p>到这里，我们就铺垫完贝叶斯定理的理论基础了。贝叶斯定理的定义为：</p>
      <blockquote>
        <p>
          <strong>贝叶斯定理</strong>
        </p>
        <Tex block>{String.raw`P(A \mid B)\,P(B) = P(B \mid A)\,P(A)`}</Tex>
        <p>
          <Tex>{String.raw`P(A \mid B)`}</Tex>：已知B，A的后验概率。<Tex>{String.raw`P(B \mid A)`}</Tex>：已知A，B的后验概率。
          <br />
          <Tex>{String.raw`P(A)`}</Tex>：A单独发生的先验概率。<Tex>{String.raw`P(B)`}</Tex>：B单独发生的先验概率。
        </p>
      </blockquote>
      <p>
        再举一个例子，如果玩《英雄联盟》的人数占到中国总人口的10%，那么不玩《英雄联盟》的人数就占到90%。而在玩《英雄联盟》的人中有90%是男生，不玩《英雄联盟》的人中有90%是女生。那么，
        <strong>已知一名游戏玩家是女生，那么她有多大概率是玩《英雄联盟》的呢？</strong>
        即P(玩《英雄联盟》| 女生) = ？
        <Ref n={2} />
      </p>
      <p>我们来梳理一下已知条件：</p>
      <Tex block>{String.raw`\begin{aligned}
P(\text{玩《英雄联盟》}) &= 0.1 \\
&\phantom{=}\ \text{\small（玩《英雄联盟》占到中国总人口的10\%）} \\
P(\text{是女生}) &= \underbrace{0.1 \cdot 0.1}_{\text{玩《英雄联盟》的女生}} + \underbrace{0.9 \cdot 0.9}_{\text{不玩《英雄联盟》的女生}} \\
P(\text{女生} \mid \text{玩《英雄联盟》}) &= 0.1
\end{aligned}`}</Tex>
      <Tex block>{String.raw`\begin{aligned}
& P(\text{玩《英雄联盟》} \mid \text{女生}) \\
&\quad= \frac{P(\text{女生} \mid \text{玩《英雄联盟》}) \cdot P(\text{玩《英雄联盟》})}{P(\text{是女生})} \\
&\quad= \frac{0.1 \cdot 0.1}{0.1 \cdot 0.1 + 0.9 \cdot 0.9} \\
&\quad= \frac{1}{82} \approx 1.22\%
\end{aligned}`}</Tex>
      <p>即在中国，一名女性玩家玩英雄联盟的概率约等于1.22%。</p>

      <h2>基本比率谬误</h2>
      <p>让我们返回到一开始的两个问题：</p>
      <blockquote>
        <p>班上有50人，如果有一人得了感冒，那么小明得感冒的概率是多少呢？</p>
        <p>
          假设A市有两种颜色的出租车：绿和蓝，其中85%是绿色。有天晚上一辆出租车在夜间肇事后逃逸，但还好当时有一位目击证人。这位目击者认定肇事的出租车是蓝色的。公安人员经过在相同环境下对该目击者进行“蓝绿”辨色测试而得到：
          <strong>其在80%的情况下识别正确，20%的情况不正确</strong>。那么其“目击的可信度”是多少呢？
        </p>
      </blockquote>
      <p>
        我在前文中也提了第一问的一个变体，就是即，班上有50人，如果小明得了感冒，那么这个班的所有学生得感冒的概率是多少呢？那么前后两个问题有什么区别呢？
      </p>
      <p>
        在变体中，我们明确知道，即我们观测到的事实是小明感冒了，于是便可以判定概率为1/50，即2%。因为学生是均匀分布的，所以从中这个概率等同于随机选一个是小明的概率。
        <strong>但是在原问中，我们只观测到了有人感冒，于是我们不能直接推导小明得病的概率是2%，而要用贝叶斯定理</strong>
        ，即计算P(小明得病 | 有一个人得病)。
      </p>
      <Tex block>{String.raw`\begin{aligned}
& P(\text{小明得病} \mid \text{有一个人得病}) \\
&\quad= \frac{P(\text{有一个人得病} \mid \text{小明得病}) \times P(\text{小明得病})}{P(\text{有一个人得病})} \\
&\quad= \frac{100\% \times P(\text{小明得病})}{100\%} \quad \text{（因为我已经知道了）} \\
&\quad= P(\text{小明得病})
\end{aligned}`}</Tex>
      <p>
        这个时候，我们发现，我们并不能算出这个概率，<strong>因为我们并不知道小明得病的概率</strong>
        。什么意思呢？可以理解为，我把小明从这个班里独立出来了，那么他得感冒的概率，即P(小明得感冒)的先验概率。
        <strong>
          那么这个先验概率怎么计算呢？当然是取决于小明自身，如果小明的抵抗力很强，那么他感冒的概率就低。如果他天生体弱，那么这个概率就高。
        </strong>
        所以单凭一句这个班有人感冒，是无法推断小明感冒的概率是2%的。
      </p>
      <p>
        那么第二个问题呢？我们要计算的是P(肇事车辆是蓝色 | 目击者认为是蓝色)，即在目击者看到蓝车的情况下，肇事车辆是蓝色的概率有多大。
      </p>
      <Tex block>{String.raw`\begin{aligned}
& P(\text{肇事车辆是蓝色} \mid \text{目击者认为是蓝色}) \\
&\quad= \frac{P(\text{目击者认为是蓝色} \mid \text{肇事车辆是蓝色}) \times P(\text{肇事车辆是蓝色})}{P(\text{目击者认为是蓝色})} \\
&\quad= \frac{0.8 \times 15\%}{\underbrace{0.8 \times 15\%}_{\text{肇事车辆是蓝车，并且目击者也认为是蓝车}} + \underbrace{0.2 \times 85\%}_{\text{肇事车辆是绿车，但目击者认为是蓝车}}} \\
&\quad= \frac{12}{29} \approx \mathbf{41.4\%}
\end{aligned}`}</Tex>
      <p>
        那么，我们发现，其实目击者指认出肇事车辆是蓝色的准确率仅为41.4%，不到50%。更重要的是，目击者认为肇事车辆是蓝色，但其实是绿色的可能性为：
      </p>
      <Tex block>{String.raw`\begin{aligned}
& P(\text{肇事车辆是绿色} \mid \text{目击者认为是蓝色}) \\
&\quad= \frac{P(\text{目击者认为是蓝色} \mid \text{肇事车辆是绿色}) \times P(\text{肇事车辆是绿色})}{P(\text{目击者认为是蓝色})} \\
&\quad= \frac{0.2 \times 85\%}{\underbrace{0.8 \times 15\%}_{\text{肇事车辆是蓝车，并且目击者认为是蓝车}} + \underbrace{0.2 \times 85\%}_{\text{肇事车辆是绿车，但目击者认为是蓝车}}} \\
&\quad= \frac{17}{29} \approx 58.6\%
\end{aligned}`}</Tex>
      <p>
        即 P(肇事车辆是蓝色 | 目击者认为是蓝色) 小于 P(肇事车辆是绿色 | 目击者认为是蓝色)，
        <strong>也就是肇事车辆是绿色的可能性依然大过肇事车辆是蓝色的可能性</strong>
        ，即便在80%的情况下，目击者都能准确地在同等情况下分辨车辆的颜色。
      </p>
      <p>
        我们通过以上两个例子发现，在现实生活中，<strong>一些看似直接的信息，并通过我们的直觉所定下的结论往往都是错的</strong>
        。正如在肇事车辆的例子中，我们的假设（H）是肇事车辆是蓝色，而证据（E）是目击者在80%的情况下都可以分辨蓝色和绿色，即在假设肇事车辆是蓝色的情况下，目击的准确度是：
        <Tex>{String.raw`P(E \mid H) = 80\%`}</Tex>，而很多人就错误的理解成了<Tex>{String.raw`P(H \mid E) = 80\%`}</Tex>，
        <strong>
          即目击者在80%的情况下目击了蓝色的车，而推导出肇事的是蓝色的车，但在当中却忽略了蓝色车和绿色车在整体中的比率。
        </strong>
      </p>
      <p>
        这个错误，就是<strong>基本比率谬误（Base Rate Fallacy）</strong>。
      </p>

      <h2>你以为的事真的是你以为的吗？</h2>
      <p>
        我相信，通过这篇文章，你已经领悟到我指出的社会中的许多问题了吧。我们总是下意识地认为很多事物是真实可靠的，但是，我们一定要学会去抽丝剥茧，看清事实的本质是什么。就如感冒的那个问题一样，其实你有新冠肺炎的症状并不用感到可怕，
        <strong>
          我们只需冷静地通过数据去计算，就能发现其实你在家隔离，没有和外人接触的情况下，得新冠肺炎的可能性不到十万分之六
        </strong>
        。当在你真的有过和新冠肺炎患者密切接触的情况下，你应该做的是去医院接受检查和隔离，而不是刷微博、微信查症状，
        <strong>这不但不会治好你的感冒，还会耽误你的治疗。</strong>
      </p>
      <p>
        然而在现实中的大多数时候，我们会把<Tex>{String.raw`P(E \mid H)`}</Tex>错当成<Tex>{String.raw`P(H \mid E)`}</Tex>，
        <strong>即把推论当成了结论。</strong>
      </p>
      <p>
        <strong>你认为的事真的不是你认为的那样。</strong>
      </p>

      <h2>后记</h2>
      <p>
        我们在真正计算概率时，数据样本的选取和真实性颇为重要。
        <strong>例如，如果你在武汉的话，很显然，你得新冠肺炎的概率远远高于身在其他地方的人</strong>
        。因为相比与全国其他地方来说，武汉有数量最多的新冠肺炎感染者。如何去合情合理的取值是一个非常麻烦的问题，我这里只是举了新冠肺炎这个例子，因为大多数时候，
        <strong>
          对于一种新出现且传染性极强的病毒，我们是无法在还在传播的当下就统计出准确的病人数量的，所以大家仍然要小心。
        </strong>
        如果你认为自己和新冠肺炎确诊者有过密切接触的情况，请及时就医。
      </p>
      <p>
        其实，文章中目击者的例子已经阐述了一个基本比率谬误会导致的社会问题，那就是一概而论、以偏概全或者以全概偏。我们都知道，同性恋者得艾滋病（HIV）的概率远超异性恋者。但是，在现实生活中，人们通常都会有这两种推测：1.他是同性恋，所以肯定有艾滋病；2.他有艾滋病，那他一定是同性恋。其实这两者所犯的都是基本比率谬误。具体的计算过程我就不赘述了。
        <strong>总之，我们不能通过一句话中有“概率远超”就去下结论，以致于恶意攻击行为和歧视的发生。</strong>
      </p>
    </>
  ),
  signed: <span lang="en">s1lin</span>,
  refs: [
    <Fragment key="1">
      文克玲，《细说贝叶斯定理》
      <SourceLink href="http://wap.sciencenet.cn/blog-583426-1047454.html?mobile=1" />
    </Fragment>,
    <Fragment key="2">
      知乎作者昌硕，《如何理解先验概率与后验概率》
      <SourceLink href="https://zhuanlan.zhihu.com/p/26464206" />
    </Fragment>,
  ],
  note: (
    <>
      First ran on WeChat under a pen name. Reprinted here without three pictures that are not free to reprint or whose
      source I could not trace: a stock photograph of children, an impossible triangle, and a still from Yes, Prime
      Minister. Its sums are corrected: the League of Legends player comes to 1/82, about 1.22% (it read 1/83, about
      1.84%); the taxi is less likely blue than green, 小于 (it read 大于); and 12/29 and 17/29 round to 41.4% and 58.6%
      (they read 41.3% and 58.7%).
    </>
  ),
};
