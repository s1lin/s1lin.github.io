import { Fragment } from "react";
import { Ref, SourceLink } from "@/components/bits";
import type { Post } from "@/content/posts";

const ORIGINAL = "https://mp.weixin.qq.com/s/Ij2HCOvtRPc3Xj08lNOdAg";
const MAP = "https://commons.wikimedia.org/wiki/File:Easter_Island_map-en.svg";
const BY_SA = "https://creativecommons.org/licenses/by-sa/2.5/";

/** 我们为什么要探索宇宙？, part one of 我们的征途是星辰大海, from 呓语种地. */
export const whyExploreSpace: Post = {
  slug: "why-explore-space",
  no: "02",
  title: "我们为什么要探索宇宙？",
  lang: "zh-Hans",
  id: "9a2ebab5-7807-4f7b-9dae-fd92fb716349",
  dek: "Written after watching SpaceX’s Dragon carry its first crew: a NASA scientist’s 1970 letter to a nun in Zambia, the fall of Easter Island, and how a company made rockets cheaper.",
  epigraph: {
    text: "当你发射火箭时，你并不是让它飞起来，某种意义上说你只是把它挂了起来。",
    by: "迈克尔·安德森",
  },
  spec: [
    ["Language", "Chinese"],
    [
      "First ran",
      <Fragment key="ran">
        On the WeChat account <span lang="zh-Hans">呓语种地</span>, as part one of{" "}
        <span lang="zh-Hans">我们的目标是星辰大海</span>; part two is{" "}
        <a href="/blog/moon-landing/" lang="zh-Hans">
          登月奇迹
        </a>
        . <a href={ORIGINAL}>The original&nbsp;↗</a>
      </Fragment>,
    ],
    ["Author", "s1lin"],
    ["Editor", <span key="editor" lang="zh-Hans">司马严</span>],
    ["Proofs", <span key="proofs" lang="zh-Hans">Joe是宅</span>],
    [
      "Pictures",
      <Fragment key="pictures">
        NASA and SpaceX, public domain, via Wikipedia. The map: Eric Gaba (Sting), translated by Bamse,{" "}
        <a href={BY_SA}>CC BY-SA 2.5</a>, via <a href={MAP}>Wikimedia Commons</a>
      </Fragment>,
    ],
  ],
  body: (
    <>
      <p>
        在最近这段关“禁闭”的时间里，我先是在朋友的推荐下看了电视剧《星际迷航·皮卡德》，而在追剧的同时，又碰巧遇上了SpaceX的“龙”飞船的载人首航的电视直播。我不禁再次因人类探索宇宙的梦想、宇宙的浩瀚无垠以及现代人类的技术进步而深有感慨。受此激发，我萌生了以此为主题撰写数篇文章的想法。今天，我先来和大家摆一个闲龙门阵——我们为什么要探索宇宙？
      </p>
      <p>
        相信很多人都听说过这个故事：在1970年，赞比亚的一位修女玛丽·尤肯达（Mary
        Jucunda）给远在美国国家航空航天局（NASA）的科学家恩斯特·施图林格（Ernst
        Stuhlinger）博士写去了一封信，向他提出了深入灵魂的质问：“
        <strong>目前地球上还有这么多小孩子吃不上饭，你怎么舍得为远在火星的项目花费数十亿美元？</strong>”
      </p>
      <p>
        施图林格的回信很长，我会在后面放上两个链接供大家查阅。首先，他认为修女玛丽·尤肯达肯定不希望得到这样的答案：“哦，我都不知道还有小孩子快饿死了，好吧，从现在开始，暂停所有的太空项目，直到孩子们都吃上饭再说。”
        <strong>因为这样做只是承认了现实，但是却无法提供解决问题的方案。</strong>
        接着施图林格讲了一个发生在中世纪时期德国小镇里的真实故事：
      </p>
      <p>
        那时的德国经常爆发席卷全国的瘟疫。在镇上，有一位心地善良的伯爵，他将自己的一大部分收入都赠予了镇上的穷人。一天，伯爵碰到了一个奇怪的人。这个人的家中有一个工作台和一个小实验室，他白天卖力工作，晚上专心将小玻璃片研磨成镜片，然后把研磨好的镜片装到镜筒里，并以此来观察细小的物件。
      </p>
      <p>
        伯爵被这个前所未见的可以把东西放大的小发明迷住了。他邀请这个怪人住进了他的城堡里，以便他可以专心致志地来研究这些光学器件。然而，镇子上的人在得知伯爵把金钱花费在这么一个怪人和他那些无用的玩意儿上之后，都变得很生气。“我们还在受瘟疫的苦，”他们抱怨道，“而他却为那个闲人和他没用的爱好乱花钱！”伯爵听到后不为所动。“我会尽可能地接济大家，”他表示，“但我会继续资助这个人和他的工作，我确信终有一天会有回报。”
      </p>
      <p>
        果不其然，他的工作（以及同时期许多其他人的努力）换来了丰厚的成果，那就是显微镜的诞生。这让医学得到了长足的发展，而由此展开的研究及其成果，最终消除了世界上大部分地区肆虐的瘟疫和许多传染性疾病。
      </p>
      <p>
        <strong>
          在施图林格的故事里，伯爵花钱支持的这项研究，最终大大减轻了人类作为整体所遭受的苦难，因此受益的人数也远超那些瘟疫病人的数量
        </strong>
        。施图林格继续解释道，在1970年，仅有1.6%的预算将用于探索宇宙——这些花销将用于阿波罗计划和其他一些涵盖天体物理学、深空天文学、空间生物学、行星探测工程和地球资源工程的小项目以及空间工程技术。也就是说，每个年收入10,000美元的美国纳税人平均需要支付约30美元给太空事业，而剩下的9,970美元则可用于一般的生活开支、休闲娱乐、储蓄和别的税项等花销。也许有人会问，为什么不能从纳税人30美元的太空经费里抽出5美元，3美元或是1美元来救济饥饿的儿童呢？
      </p>
      <p>
        他认为，要解决饥荒的有两个关键问题：
        <strong>食物的生产和食物的分配，而人造地球卫星无疑是帮助解决这两个关键问题最有力的工具</strong>
        。事实证明，配备了土地资源传感器及相应的农业程序的人造卫星系统，即便是最简单的型号，也能帮助大幅提升农作物的年产量。
        <strong>更重要的是，宇宙探索可以促进科学技术的发展并提高整整一代人的科学素养。</strong>
      </p>
      <p>
        最后他引述了哲学家阿尔贝特·施韦泽的名言：“<strong>我忧心忡忡地看待未来，但仍满怀美好的希望</strong>（I am
        looking at the future with concern, but with good hope）。”
        <Ref n={1} />
      </p>
      <hr />
      <p>
        当然，这封信回答了两个问题：一是为什么要花钱去探索宇宙，二是美国在1970年代是怎样去花这笔钱的，投入到了哪些地方。那么，接下来我探讨的是，探索宇宙其实也是人类在为可见的地球资源危机寻找出路，以及我们在未来能否“更经济、高效”地去探索宇宙。
      </p>
      <p>
        我以太平洋南部的复活节岛的兴衰为例，根据美国纽约州立博物馆专家大卫·斯泰德的研究显示，在公元400年左右，波利尼西亚东部群岛有一群波利尼西亚人驾船出海，跨越大洋，并登上了复活节岛。在此后的400年间，他们在复活节岛上开荒种粮并在海洋中捕捞海产品，人口也随之增长。
      </p>
      <figure>
        <img
          src="/assets/img/blog-easter-island-map.webp"
          width={1280}
          height={910}
          loading="lazy"
          alt="复活节岛（拉帕努伊）的地形图，标有火山、海岸、道路和定居点"
        />
        <figcaption>
          复活节岛地图。图片来自维基百科：Eric Gaba (Sting)，Bamse 译，<a href={BY_SA}>CC BY-SA 2.5</a>。
        </figcaption>
      </figure>
      <p>
        但在公元800年左右，人口的增长导致了食物短缺。为了解决粮食问题，他们开始简单粗暴地大规模砍伐森林，特别是棕榈树，因为棕榈树是建造渔船的最佳材料。于是他们建造了大量的船只，发展了渔业，收获了更多的食物，而这也导致人口进一步增长。
        <strong>最终，人口对自然资源的消耗逐渐超过当地资源的承载能力。</strong>
        岛上的各部落为了争夺有限的资源爆发了冲突和战争，其证据就是岛上遗留的许多石矛和石匕首。
      </p>
      <p>
        又过了400年，在1200年左右，各部落为了建造巨大石像，加速了对森林的砍伐，因为棕榈树可以被用于薪木和运输石像。也是在这个时期，他们的渔获开始减少。更严重的是，在1400年时，森林被全部砍伐殆尽，棕榈树消失了。受此影响，首先是鸟类因缺乏食物而开始减少，随后，植物因失去授粉的鸟类也逐渐灭绝。因为人们没有了树木，其航海能力也越来越差。最终全岛只剩下几只独木舟，而岛民也转而开垦荒地种植谷物，但这当然无法满足人们的粮食需求。
        <strong>于是，岛上的文明开始衰落，甚至出现了食人部落。</strong>
      </p>
      <p>
        证据显示，从15世纪开始，岛上的垃圾堆中出现了更多的人骨，并且也从岛上民间传说中侧面印证了这一点。1700年时，岛上的人口衰减至顶峰时的1/5，并伴随着不断的部落战争。而到20世纪初时，全岛只剩下了111个土著居民。
        <strong>
          虽然复活节岛的居民曾经建立过辉煌的文明，但当社会经济的发展超过了环境的承载力时，文明便迅速走向了衰落
        </strong>
        <Ref n={2} />。
      </p>
      <hr />
      <p>
        我们知道，地球在40多亿年的历史中一共发生过五次生物大灭绝。而有文字记录的人类历史却不超过一万年。如今，地球上已经有超过70亿的人口，而根据预测，到本世纪中叶，地球上的人口数量将会逼近100亿。很显然，地球的资源是有限的。
        <strong>复活节岛的例子告诉我们，在资源尚未耗尽之前，为争夺资源所发动的战争便可能重创我们的文明</strong>
        。70年代的美国，在宇宙探索上仅需要花掉1.6%的年度预算，而为航天事业牺牲的宇航员也不到100人，这远小于任何一个国家卷入战争所需付出的代价。而如果人类能够在未来移居其他星球，那么资源分配的问题就可能得到缓解，我们也因此可以避免类似复活节岛似文明灭亡的悲剧。
      </p>
      <p>
        目前，人类对宇宙的探索依然是高风险和昂贵的。美国航天飞机计划的初衷就是为了让人类能够更方便和高效地进入宇宙，因为航天飞机可以重复使用，且载人数量更多，并且飞机本身可以搭载一些机器人设备。
      </p>
      <figure>
        <img
          src="/assets/img/blog-shuttle-launches.webp"
          width={1280}
          height={568}
          loading="lazy"
          alt="五架航天飞机升空的照片并排拼在一起：哥伦比亚号、挑战者号、发现号、亚特兰蒂斯号和奋进号"
        />
        <figcaption>
          从左往右分别为美国哥伦比亚号（Columbia），挑战者号（Challenger），发现号（Discovery），亚特兰蒂斯号（Atlantis），和奋进号（Endeavour）航天飞机升空照片。图片来自维基百科。
        </figcaption>
      </figure>
      <p>
        从1981年4月12日的第一次任务，到2011年7月21日最后一次任务结束，航天飞机持续了近30年，一共135次，仅有两次致命事故（挑战者号和哥伦比亚号）。但航天飞机的成功，并不意味着探索宇宙的风险和成本的降低。相反，航天飞机虽然可以重复使用，但因为机龄的原因，其维护费用也在年年攀升，同时暴涨的还有将物品运入太空的成本——1972年的预估成本为1,109美元／磅，而在项目终结时，135次任务的实际平均成本高达37,207美元／磅
        <Ref n={3} />。
      </p>
      <p>
        在航天飞机任务结束后的9年时间里，美国失去了从本土将宇航员送入太空的能力，而只能使用俄罗斯的火箭。
        <strong>
          从公布的数据中看，单次火箭发射的费用也同样是在逐年攀升——从一开始的3000万美元，涨到了如今的7000万美元
        </strong>
        。在极度有限的预算下，NASA既要负责研发航天技术，又要负责生产火箭，还要主导火箭发射和宇航员的培养，而这些项目所需要的开销也变得越来越庞大。虽然NASA掌握了航天领域几乎所有的“黑”科技，但是在资金的重重压力下，也不得不去寻找新的发展模式。
      </p>
      <p>
        早在2002年，伊隆·马斯克（Elon
        Musk）便看到了当时NASA所面临的这些问题，于是，他创立了一家名为SpaceX的公司。他希望通过“商业化”的模式来解决NASA的这些问题，即，
        <strong>
          让NASA成为技术的提供方和火箭服务的需求方，而让SpaceX成为火箭的生产商和对应的载人、载物服务的供应方
        </strong>
        。同时，NASA也是技术标准的提出方，而SpaceX来提供通过标准的相关服务。
      </p>
      <figure>
        <img
          src="/assets/img/blog-crs8-landing.webp"
          width={1280}
          height={853}
          loading="lazy"
          alt="猎鹰9号的第一级火箭竖立在海上的无人着陆船上"
        />
        <figcaption>在CRS-8任务中，猎鹰9号运载火箭第一级首次成功降落在海上无人驾驶着陆船上。图片来自维基百科。</figcaption>
      </figure>
      <p>
        在经过长达19年的努力后，我们共同目睹了SpaceX所取得的成就：首先是猎鹰9号使用了人类首个可重复发射的一级火箭，这使得火箭发射的成本大大减少；其次，是成功发射了由一个经过强化的猎鹰9号中央芯级和两个额外的猎鹰9号一级火箭组成的新型猎鹰重型运载火箭（Falcon
        Heavy），尽管很多火箭专家一开始并不看好这种“并联”的建造方式。此外，猎鹰重型运载火箭也是当前世界现役最大推力的运载火箭
        <Ref n={5} />
        。并且，2017年的数据显示，使用猎鹰重型火箭将货物送入地球近地轨道的成本为2,350美元／千克，即1,066美元／磅，相比于我国的长征-3B型火箭5,833美元／千克的运输成本便宜了一半以上
        <Ref n={4} />。
      </p>
      <hr />
      <p>
        终于，在2020年5月30日，SpaceX首次用商业航天飞船将宇航员送上了太空。作为一家商业公司，SpaceX的商业运作模式有两大十分显著的优势：一是生产线的集中，二是更加灵活的技术研发。以NASA为例，在火箭的生产过程中，按规定为了能带来更多的就业，
        <strong>火箭零件的采购必须要来自全美国供应商，不能依赖单一的供货源</strong>
        。这么做的成本很高，而且在技术上很难协调。且在新技术的研发环节过程中，NASA也不能大胆地尝试新的技术，因为一旦失败，便会被国会追问是否在浪费纳税人的钱。因此，虽然在我们看来，SpaceX的每一步都迈得很大而且很险，但它总能出人意料地获得成功。
      </p>
      <figure>
        <img
          src="/assets/img/blog-falcon-heavy.webp"
          width={800}
          height={1274}
          loading="lazy"
          alt="猎鹰重型运载火箭竖立在发射台上，三枚芯级并排"
        />
        <figcaption>猎鹰重型运载火箭矗立于肯尼迪航天中心39号发射台。图片来自维基百科。</figcaption>
      </figure>
      <p>
        SpaceX为“怎样更经济、更高效地探索宇宙”这个问题提供了一种解答。我认为，只要政府机构和企业能够彼此高效地配合，就一定能催生出更多类似于SpaceX这样的勇者和探路者，让宇宙探索不再遥不可及。
      </p>
      <p>
        也许在不远的将来，人类也可以像坐飞机一样，方便、安全且快捷地进行星际旅行。正如《玩具总动员》里巴斯光年（Buzz
        Lightyear）的那句口号一样：“<strong>飞向宇宙，浩瀚无垠</strong>（To Infinity and Beyond）！”
      </p>
    </>
  ),
  signed: <span lang="en">s1lin</span>,
  refs: [
    <Fragment key="1">
      恩斯特·施图林格博士的回信的英文版与中文版：
      <SourceLink href="https://lettersofnote.com/2012/08/06/why-explore-space/" />
      <SourceLink href="https://zhuanlan.zhihu.com/p/24016686" />
    </Fragment>,
    <Fragment key="2">
      本段选取自知乎：
      <SourceLink href="https://www.zhihu.com/question/265533849" />
    </Fragment>,
    <Fragment key="3">
      数据来源：
      <SourceLink href="https://en.wikipedia.org/wiki/Space_Shuttle" />
    </Fragment>,
    <Fragment key="4">
      数据来源：
      <SourceLink href="http://mil.news.sina.com.cn/jssd/2017-04-05/doc-ifycwymx3864103.shtml" />
      <SourceLink href="https://zh.wikipedia.org/wiki/%E9%95%BF%E5%BE%81%E4%BA%94%E5%8F%B7%E7%B3%BB%E5%88%97%E7%81%AB%E7%AE%AD" />
    </Fragment>,
    <Fragment key="5">
      信息来源：
      <SourceLink href="https://en.wikipedia.org/wiki/Falcon_Heavy" />
    </Fragment>,
  ],
  note: (
    <>
      First ran on WeChat under a pen name. Reprinted here without four pictures that are not free to
      reprint or whose source I could not trace: the opening artwork, a portrait of Ernst Stuhlinger, a photograph of the
      moai and a still from Toy Story.
    </>
  ),
};
