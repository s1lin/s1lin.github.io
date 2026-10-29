import { Fragment } from "react";
import { Ref, SourceLink } from "@/components/bits";
import type { Post } from "@/content/posts";

const ORIGINAL = "https://mp.weixin.qq.com/s/fxsXfApEy7WK7XBtVqvsmQ";

/** 登月奇迹, part two of 我们的目标是星辰大海, from 呓语种地. */
export const moonLanding: Post = {
  slug: "moon-landing",
  no: "03",
  title: "登月奇迹",
  lang: "zh-Hans",
  id: "f043ee36-dfd6-43bb-b274-b38af741814f",
  dek: "Part two of the space series: the Moon landing through four of the people behind it, a president, a rocket engineer, the women who computed the way home and the women who wove the software.",
  epigraph: {
    text: "我只要一艘船，和一颗为她掌舵的星。",
    by: "约翰·美斯菲尔德",
  },
  spec: [
    ["Language", "Chinese"],
    [
      "First ran",
      <Fragment key="ran">
        On the WeChat account <span lang="zh-Hans">呓语种地</span>, as part two of{" "}
        <span lang="zh-Hans">我们的目标是星辰大海</span>, after{" "}
        <a href="/blog/why-explore-space/" lang="zh-Hans">
          我们为什么要探索宇宙？
        </a>{" "}
        <a href={ORIGINAL}>The original&nbsp;↗</a>
      </Fragment>,
    ],
    ["Author", "s1lin"],
    ["Editor", <span key="editor" lang="zh-Hans">司马严</span>],
    ["Proofs", <span key="proofs" lang="zh-Hans">司马严 · Joe是宅</span>],
    ["Pictures", "NASA, public domain, via Wikipedia and NASA; a nineteenth-century engraving from an English edition of Verne"],
  ],
  body: (
    <>
      <figure>
        <img
          src="/assets/img/blog-apollo17-flag.webp"
          width={640}
          height={380}
          alt="阿波罗17号的宇航员站在月面的美国国旗旁，身后是月球车"
        />
      </figure>
      <blockquote>
        <p lang="en">“That’s one small step for a man, one giant leap for mankind.”</p>
        <p>“我的一小步，人类的一大步。”</p>
        <cite>——1969年7月20日，尼尔·阿姆斯特朗</cite>
      </blockquote>
      <p>
        从上古的东方传说中的“嫦娥奔月”，到19世纪异想天开的法国人儒勒·凡尔纳“欢乐地”把飞船轰上月球的“大炮俱乐部”三部曲《从地球到月球》《环绕月球》与《扭转乾坤》。
        <br />
        （注：《扭转乾坤》的故事背景设置在了北极，但是主人公仍然是《从地球到月球》中的巴尔的摩大炮俱乐部主任巴比康）
      </p>
      <p>
        再到1969年7月20日美国人阿姆斯特朗站在月球表面说：“我的一小步，人类的一大步”，人类登月的故事才终于完成了从幻想到文学，再到现实的跨越。
      </p>
      <figure>
        <img
          src="/assets/img/blog-verne-columbiad.webp"
          width={672}
          height={989}
          loading="lazy"
          alt="一幅版画：巨大的炮管斜插在山坡上，炮口指向天空"
        />
        <figcaption>儒勒·凡尔纳的“月球大炮”构想图，图片来自网络。</figcaption>
      </figure>
      <p>直到如今，仍有相当数量的阴谋论者们相信，登月只是美国自导自演的一部“影视作品”。</p>
      <p>
        2012年，我国的月球探测飞船“嫦娥二号”清晰地拍下了当年美国登月留下的痕迹，证实了登月是真实发生过的
        <Ref n={6} />。
      </p>
      <p>
        如果要我按照时间顺序去写上世纪60年代美国人是如何完成登月的流水账，大家还不如去知乎或者百度上去查阅类似题材的文章，我没必要再重复一遍，浪费大家的时间。
      </p>
      <p>
        虽然登月的故事和故事里的许多人物都是老生常谈的，如阿姆斯特朗、阿波罗13号的失利等等。但是这些故事中的一些其它关键人物的事迹，反倒是鲜有人提及。
      </p>
      <p>
        所以，我谨以本文，向登月计划里，<strong>在台前或者幕后发挥关键作用的四位人物致敬。</strong>
      </p>

      <h2>人物J</h2>
      <p>
        1962年9月12日，J在美国德克萨斯州的莱斯大学的橄榄球运动场，面向4万美国人发表了演讲：《我们选择登月（We Choose
        to go to Moon）》。
      </p>
      <p>
        J说我们之所以要登月“<strong>不是因为这件事简单，而是因为这件事很难</strong>（not because they are easy, but
        because they are hard）”。
      </p>
      <figure>
        <img
          src="/assets/img/blog-rice-speech.webp"
          width={302}
          height={298}
          loading="lazy"
          alt="莱斯大学体育场里坐满了听众，肯尼迪站在讲台上演讲"
        />
        <figcaption>《我们选择登月》演讲现场，图片来自维基百科。</figcaption>
      </figure>
      <p>
        这篇演讲发表在上世纪六十年代初美苏太空竞赛正酣之时，此时美国在这场竞赛中并没有任何优势，甚至还不如苏联。苏联率先在1961年4月12日，将尤里·加加林（Yuri
        Gagarin）送入太空，而美国则是在同年5月5日，才将艾伦·谢泼德（Alan Shepard）送入太空。
      </p>
      <p>
        在《我们选择登月》演讲之前，1961年5月25日J在美国国会发表了《国家紧急需求（Urgent National
        Needs）》演讲。J对于美国未能率先实现载人航天十分不甘，誓言要“不惜一切代价”，定要先一步将人类送上月球。
      </p>
      <p>
        他说：“在这个时代，没有任何一个宇宙探索计划会比探索月球更令人惊艳（No single space project in this period
        will be more impressive to mankind）”。
      </p>
      <p>
        <strong>J就是美国时任总统约翰·肯尼迪（John F. Kennedy）。</strong>
        美国载人登月的成功，也成为肯尼迪总统留下的最重要的政绩之一，并且发射“阿波罗”任务的宇航中心也以他的名字命名。
      </p>
      <p>
        <strong>不过可惜的是，J并没有亲眼看到美国成功登月，他于1963年11月被刺身亡</strong>。
      </p>
      <figure>
        <img
          src="/assets/img/blog-kennedy.webp"
          width={203}
          height={295}
          loading="lazy"
          alt="肯尼迪站在印有总统徽章的讲台后演讲"
        />
        <figcaption>美国总统约翰·肯尼迪，图片来自维基百科。</figcaption>
      </figure>
      <p>肯尼迪总统的《我们选择登月》演讲，全长18分钟。</p>

      <h2>人物F</h2>
      <p>仅靠一位总统做一场激动人心的演讲并不足以实现登月。人类若想要登上月球，就得有强大的火箭。</p>
      <p>
        物理告诉我们，飞船要到达月球，就先得让飞船脱离地球轨道，而这需要飞船达到第二宇宙速度（11.2km/s）。
      </p>
      <p>但是在1961年，人类的火箭只能飞船送上近地轨道，也就是说让飞船达到第一宇宙速度（7.9km/s）。</p>
      <p>这就意味着，美国航天航空局需要制造荷载量和推力更大的火箭。而说到造火箭，就绕不开提到这位F老爷子。</p>
      <p>
        F老爷子曾是纳粹的导弹物理学家，他在二战期间发明了令伦敦人闻风丧胆的V2火箭弹。战争结束前夕，他带着他的火箭团队投降了盟军，并被秘密地带到美国。
      </p>
      <p>
        当美国开始准备登月时，摆在F面前的任务是：要设计一种能将质量远大于简单的绕地飞行的载人登月飞船加速到第二宇宙速度，送出地球轨道的火箭。
        <strong>这种火箭是前无古人的。</strong>
      </p>
      <p>在《他们坐上东拼西凑的飞船，飞向月球》文中，对这个浩瀚的工程有一个形象的比喻：</p>
      <blockquote>
        <p>
          苏联解体后，马卡洛夫为“瓦良格”号航空母舰的命运发出的悲叹：“为了将航母完工，我们需要什么？”“苏联、党中央、国家计划委员会、军事工业委员会和九个国防工业部、600个相关专业、8000家配套厂家，总而言之，我们需要一个伟大的国家。”
        </p>
      </blockquote>
      <p>
        为此，美国国家航空航天局（NASA）不得不像苏联那样“集中力量办大事”。那么，一个能将人类送上月球的火箭配方是什么呢——
      </p>
      <p className="post__formula">
        <strong>
          一个用300万个零件所拼装的火箭
          <br />=<br />
          两个顶尖团队（由F领导的NASA的火箭团队和40万火箭产业工人）
          <br />+<br />
          65亿美元
          <br />+<br />
          三个顶级生产商（波音公司、北美航空和道格拉斯飞行器公司）
          <br />+<br />
          F的吹毛求疵
        </strong>
      </p>
      <p>
        <strong>F在火箭界是出了名的挑剔</strong>。例如
      </p>
      <blockquote>
        <p>
          “他会带着团队把造好的火箭全部拆开，以确保每个零件都在它们应该在的位置上。时任NASA局长的詹姆斯·韦伯实在看不下去，找到F说，你得相信业界，不要再把火箭拆开了。还没等韦伯说完，F从口袋里掏出一条毛巾：“你看，我在火箭里发现了这玩意儿”。
        </p>
        <cite>《他们坐上东拼西凑的飞船，飞向月球》</cite>
      </blockquote>
      <p>
        终于，功夫不负有心人，在F极为严苛的要求下，该类型火箭的发射成功率达到了100%。
        <strong>后来该型火箭被正式命名为“土星5号运载火箭”，而“F老爷子”就是冯·布劳恩。</strong>
      </p>
      <figure>
        <img
          src="/assets/img/blog-von-braun-f1.webp"
          width={209}
          height={260}
          loading="lazy"
          alt="冯·布劳恩站在五台巨大的F-1火箭发动机喷口下"
        />
        <figcaption>冯·布劳恩与土星五号火箭所用的F-1火箭发动机前留影。</figcaption>
      </figure>

      <h2>人物C</h2>
      <p>然而就算有了火箭，“登月”的问题也才解决了不到一半。</p>
      <p>要知道，造火箭是一门“大”学问，而发射和入轨则是一门“精”学问：</p>
      <ul>
        <li>什么时间能发射；</li>
        <li>发射的窗口是几分几秒到几分几秒；</li>
        <li>点火之后加速多少秒；</li>
        <li>几时几分脱离地球轨道；</li>
        <li>脱离地球轨道之后，什么时间可以到达月球；</li>
        <li>到达月球之后，几时几分开始登月流程；</li>
        <li>等等...</li>
      </ul>
      <p>
        这些时刻都是需要进行大量且准确无误的计算。
        <strong>
          然而，上个世纪60年代是一个没有电脑的时代，这也就意味着大量的计算依靠的是仅仅拿着计算尺和铅笔的计算员。
        </strong>
      </p>
      <p>而C不是一个人，而是一群“女人工计算机员”们（Human Computers）。</p>
      <p>
        我选择“C”作为该人物的代号，一是因为其代表“Computer”，二是因为这些计算机员在“阿波罗计划”中绝对是实力核心（Carry）。
      </p>
      <p>
        可以说，
        <strong>登月计划既不能没有立下誓言的高富帅总统J和执掌火箭开发的工程师F，也不能没有算出抛物线的C</strong>。
      </p>
      <p>1961年，C为前文提到的美国首位宇航员艾伦·谢泼德计算出了飞行轨道。</p>
      <p>
        1967年，还是C，拿着计算尺、铅笔和演算纸，完美计算出了阿波罗11号整个登月过程的复杂轨道运算，成为登月壮举的科学依据和信心保证。
      </p>
      <p>2016年，C当年的事迹被拍成了电影《隐藏人物》（Hidden Figures）。</p>
      <p>
        <strong>男人登月，女人指路。</strong>
      </p>
      <p>
        于今年2月24日去世的一位女计算员凯瑟琳·约翰逊（Katherine Johnson，也是电影《隐藏人物》中的女主角之一）曾说：
      </p>
      <blockquote>
        <p>
          “解决挑战性的问题和与聪明的人工作，让我感到兴奋（I was just excited to have challenging work to do and
          smart people to work with）。”
        </p>
      </blockquote>
      <p>
        毫无疑问，女计算员们是那个时代最出色的“计算机”，她们仅用计算尺、铅笔和演算纸，就能画出完美和准确的抛物线，并让宇航员们确信：
        <strong>这就是回家的路。</strong>
      </p>
      <figure>
        <img
          src="/assets/img/blog-katherine-johnson-facility.webp"
          width={614}
          height={318}
          loading="lazy"
          alt="凯瑟琳·约翰逊计算研究所的建筑效果图，上方写着 Future Home of the Katherine G. Johnson Computational Research Facility"
        />
        <figcaption>
          2016年，NASA决定将一所新建的计算研究所以凯瑟琳·约翰逊命名，该研究所已竣工，图片源自美国航空航天局（NASA）。
        </figcaption>
      </figure>

      <h2>人物D</h2>
      <p>
        有了阿姆斯特朗的宇航员梯队、J总统的雄心壮志、F老爷子的火箭、NASA的飞船，再加上C姐姐们的抛物线，我们就能上月球了吗？
      </p>
      <p>当然还不行，虽然C姐姐们明确了飞船该什么时候点火，什么时候变轨，但是要由谁来操作呢？</p>
      <p>
        宇宙那么大，飞船要朝哪里飞呢？到达月球之后，又由谁控制着陆呢？登月飞船不仅需要宇航员来控制，更需要一台计算机来完成一些
        <strong>极精准</strong>的操作。
      </p>
      <p>但前文不是才说过，60年代没有电脑吗？对，这里指的不是现代意义上的计算机，而只是需要一台能发出简单指令的导航计算机。</p>
      <p>
        这项工作由IBM扛了下来，并交给了麻省理工学院的计算机科学家哈尔·兰宁（Hal
        Laning）设计登月操作系统。这台计算机被命名为“阿波罗导航计算机（Apollo Guidance Computer）”。
      </p>
      <p>
        它每秒可以发布25次信号，以确保火箭在发射过程中保持正确的路线。但是，1960年代并没有现在的存储设备，那么程序是通过怎样的方式被保存的呢？
      </p>
      <p>
        我们现在所说的程序员的工作是编写程序，但上世纪60年代的程序真的就是靠“编”的。而我们的第四号主人公D就是60年代的程序员。
      </p>
      <p>
        在当时要将程序存下来，阿波罗计划组有三个选择：打孔纸带、磁带和磁环电缆。显然，在太空恶劣的环境中，
        <strong>磁环电缆</strong>最靠谱。
      </p>
      <p>
        磁环电缆是由很多磁环构成的阵列，电缆在阵列中穿过时，<strong>没有穿过磁环代表“0”，而穿过磁环代表“1”</strong>
        。通过这种简单的二进制机器码，D编写并存储了登月操作系统。
      </p>
      <p>
        当时登月操作系统的大小大约是60万个bits，差不多等于75kb
        <Ref n={3} />
        ，而现在75kb大小的软件，甚至还不如一般家用微波炉的计算能力。
      </p>
      <p>
        这个操作系统由589,824个“1”和“0”所组成。在当时D只能通过一种特殊的织机将电缆穿过磁环，一点一点、穿针引线地将软件给“编”出来。
      </p>
      <p>每一根电缆所穿过磁环与否都必须保证100%精确，否则复杂的飞行程序是无法运行的。</p>
      <p>
        <strong>拥有这般“神技”的D不是一个人，而是纺织工厂里的众多纺织女工</strong>。
      </p>
      <p>她们是世界上的第一批“程序员”，而登月操作系统就是靠她们毫无差错地把一个个“0”和“1”给“编”出来的。</p>
      <p>
        上世纪60年代中期一家名为威豪的计算机“编织”工厂爆发过一次短暂的罢工。在交货时间的压力下，工厂的经理和主管们试图通过自己去操作“织机”，来维持阿波罗计算机装配线的运转，但现实是，“
        <strong>他们编的所有东西都是废料</strong>”。
        <Ref n={5} />
      </p>
      <hr />
      <p>
        登月的故事可以讲的还有很多很多。虽然“阿波罗计划”在1972年12月完结，但是人类探索月球的步伐却没有因此停止。
      </p>
      <p>
        在人类探索月球甚至宇宙的路上，我们有像J总统那样心怀梦想的精神领袖们，也有像F老爷子那些追求完美的工程师们，更有像C和D那样在幕后默默奉献的女航天人们。
      </p>
      <p>21世纪的今天，世界上包括中国在内的许多国家都仍在为人类再次登上月球并建立月面基地而奋斗。</p>
      <p>
        最后引用一句美国首位宇航员也同时是阿波罗14号任务的成员之一的艾伦·谢泼德在登上月球后所说的第一句话：“
        <strong>路途十分遥远，但我们还是到了</strong>（And it's been a long way, but we're here）。”
      </p>
      <figure>
        <img
          src="/assets/img/blog-shepard-flag.webp"
          width={1280}
          height={579}
          loading="lazy"
          alt="艾伦·谢泼德站在月面的美国国旗旁"
        />
        <figcaption>艾伦·谢泼德在月球与美国国旗的合影，图片来自维基百科。</figcaption>
      </figure>
    </>
  ),
  signed: <span lang="en">s1lin</span>,
  refs: [
    <span key="1" lang="en">
      United States. Congress. House. Committee on Science and Astronautics. (1973). 1974 NASA authorization: hearings,
      Ninety-third Congress, first session, on H.R. 4567. Page 1271. Washington: U.S. Govt. Print. Off.
    </span>,
    <Fragment key="2">
      《一位为登月男人们指路的女人，百岁生快！》
      <SourceLink href="https://zhuanlan.zhihu.com/p/43099562" />
    </Fragment>,
    <Fragment key="3">
      《一台4分钟死机5次的电脑，带人类第一次登上月球》
      <SourceLink href="https://tech.sina.com.cn/d/s/2019-07-20/doc-ihytcerm5033612.shtml" />
    </Fragment>,
    <Fragment key="4">
      《他们坐上东拼西凑的飞船，飞向月球》
      <SourceLink href="https://renjian.163.com/19/0801/12/ELGA5RNJ000199ET.html" />
    </Fragment>,
    <Fragment key="5">
      《为阿波罗11号的月球航行提供动力的惊人的手工技术》
      <SourceLink href="https://dy.163.com/article/EKH6M4A40514EGQ9.html" />
    </Fragment>,
    <Fragment key="6">
      《嫦娥二号全月图拍到当年阿波罗11号登月遗迹》
      <SourceLink href="https://news.qq.com/a/20120207/000750.htm" />
    </Fragment>,
  ],
  note: (
    <>
      First ran on WeChat under a pen name. Reprinted here without the recording of Armstrong, the video
      of Kennedy’s speech, and the pictures that are not free to reprint or whose source I could not trace: Chang’e 2’s
      view of the Apollo 17 site, portraits of Gagarin and Shepard, a diagram of the three cosmic velocities, a V-2, the
      human computers at work, Katherine Johnson’s portrait and medal, the Hidden Figures poster, and the core rope memory.
    </>
  ),
};
