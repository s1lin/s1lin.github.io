import type { Lang } from "@/components/life/copy";

/** Words for comments, reactions and shapes, in the three languages of the site. */
export interface SocialCopy {
  commentsH: string;
  shapesH: string;
  shapesIntro: string;
  count: (n: number) => string;
  like: string;
  liked: string;
  repost: string;
  reposted: string;
  /** The honest title of the repost button: what a repost does. */
  repostTitle: string;
  repostedTitle: string;
  /** "Reposted by A, B and 3 more": the words before the names, the join, the "and N more", and the words after. */
  repostedByPre: string;
  repostedByJoin: string;
  repostedByMore: (n: number) => string;
  repostedByPost: string;
  reply: string;
  cancel: string;
  send: string;
  sending: string;
  placeholder: string;
  replyPlaceholder: string;
  signInPrompt: string;
  createAccount: string;
  signIn: string;
  signOut: string;
  signedInAs: (name: string) => string;
  waitingPopup: string;
  popupBlocked: string;
  popupClosed: string;
  empty: string;
  loading: string;
  loadError: string;
  retry: string;
  more: string;
  pendingTag: string;
  approvedNote: string;
  pendingNote: string;
  rejectedNote: (reason: string) => string;
  rateNote: string;
  invalidNote: string;
  authNote: string;
  refusedNote: string;
  networkNote: string;
  serverNote: string;
  by: (name: string) => string;
  galleryEmpty: string;
  openInPad: string;
  publish: string;
  publishH: string;
  publishHint: string;
  titleLabel: string;
  titlePlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  cropInfo: (w: number, h: number) => string;
  tooBig: (w: number, h: number, max: number) => string;
  emptyBoard: string;
  submitShape: string;
  shapeApproved: string;
  shapePending: string;
  shapeRejected: (reason: string) => string;
  close: string;
  /** The composer: the box, its toolbar, and what sits under it. */
  signedOutPlaceholder: string;
  reviewNote: string;
  postHint: string;
  overLimit: string;
  /** "Revise with Aha": the button, the model chip and its popover, the thread with Aha. */
  revise: string;
  reviseTitle: string;
  modelsTitle: string;
  modelsNote: string;
  modelsLoading: string;
  modelsError: string;
  addModel: string;
  modelChip: (model: string) => string;
  quick: string;
  tones: { polish: string; shorter: string; friendlier: string; clearer: string };
  sayPlaceholder: string;
  sayLabel: string;
  saySend: string;
  you: string;
  aha: (model: string) => string;
  thinking: string;
  stop: string;
  use: string;
  inBox: string;
  again: string;
  closeThread: string;
  earlier: (n: number) => string;
  undo: string;
  undoTitle: string;
  usedNote: string;
  errNoKey: string;
  errRate: string;
  errRefused: (reason: string) => string;
  errFailed: string;
  errOffline: string;
  errAuth: string;
  openConsole: string;
  revisionNote: string;
}

const EN: SocialCopy = {
  commentsH: "Comments",
  shapesH: "Shapes by readers",
  shapesIntro: "Shapes other people made on the launch pad, each with a note on what it is. Click one to open it and run it yourself.",
  count: (n) => (n === 1 ? "1 comment" : `${n} comments`),
  like: "Like",
  liked: "Liked",
  repost: "Repost",
  reposted: "Reposted",
  repostTitle: "Repost: shows this on your Aha page",
  repostedTitle: "Reposted: it is on your Aha page. Press to undo",
  repostedByPre: "Reposted by ",
  repostedByJoin: ", ",
  repostedByMore: (n) => ` and ${n} more`,
  repostedByPost: "",
  reply: "Reply",
  cancel: "Cancel",
  send: "Post",
  sending: "Posting…",
  placeholder: "Add a comment. Be kind, be specific.",
  replyPlaceholder: "Write a reply",
  signInPrompt: "Sign in with TokensBeat to comment, like and repost.",
  createAccount: "Create a TokensBeat account",
  signIn: "Sign in",
  signOut: "Sign out",
  signedInAs: (name) => `Signed in as ${name}`,
  waitingPopup: "Waiting for the sign-in window…",
  popupBlocked: "The sign-in window was blocked. Allow pop-ups for this site and try again.",
  popupClosed: "The sign-in window was closed before it finished.",
  empty: "No comments yet. Be the first.",
  loading: "Loading…",
  loadError: "The comments could not be loaded.",
  retry: "Try again",
  more: "Load more",
  pendingTag: "waiting for review",
  approvedNote: "Posted. Thank you.",
  pendingNote: "Thank you. Your comment is waiting for a person to look at it; it will appear once it is approved.",
  rejectedNote: (r) => `Not posted: ${r}`,
  rateNote: "Slow down a little: too many comments in a short time. Try again in a minute.",
  invalidNote: "That could not be posted. Check it and try again.",
  authNote: "Your sign-in has expired. Sign in again.",
  refusedNote: "This account cannot post here.",
  networkNote: "No connection to TokensBeat. Try again.",
  serverNote: "TokensBeat had a problem. Try again later.",
  by: (n) => `by ${n}`,
  galleryEmpty: "No shapes yet. Make one on the launch pad and publish it.",
  openInPad: "Open in the launch pad",
  publish: "Publish my shape",
  publishH: "Publish this shape",
  publishHint: "The live cells on the board are cropped to their box and sent for review, with your note.",
  titleLabel: "Name",
  titlePlaceholder: "What do you call it?",
  noteLabel: "What is it?",
  notePlaceholder: "Say what it is and what it does.",
  cropInfo: (w, h) => `${w} × ${h} cells`,
  tooBig: (w, h, max) => `This shape is ${w} × ${h}; a published shape fits ${max} × ${max}.`,
  emptyBoard: "Draw something first: the board is empty.",
  submitShape: "Submit shape",
  shapeApproved: "Published. It is in the gallery now.",
  shapePending: "Thank you. A person will look at your shape before it appears.",
  shapeRejected: (r) => `Not published: ${r}`,
  close: "Close",
  signedOutPlaceholder: "Sign in to join the conversation",
  reviewNote: "Comments are reviewed before they appear.",
  postHint: "⌘/Ctrl ↵ to post",
  overLimit: "Too long to post: cut it to 2,000 characters.",
  revise: "Revise with Aha",
  reviseTitle: "Aha rewrites your draft with your own model. Nothing is posted until you press Post.",
  modelsTitle: "Your models",
  modelsNote: "Runs on your own TokensBeat key and is billed to your balance.",
  modelsLoading: "Models…",
  modelsError: "Models unavailable · retry",
  addModel: "Add a model",
  modelChip: (m) => `Model for Revise with Aha: ${m}. Change model`,
  quick: "Quick revisions",
  tones: { polish: "Polish", shorter: "Shorter", friendlier: "Friendlier", clearer: "Clearer" },
  sayPlaceholder: "Or tell Aha what to change…",
  sayLabel: "Tell Aha what to change",
  saySend: "Ask Aha",
  you: "You",
  aha: (m) => (m ? `Aha · ${m}` : "Aha"),
  thinking: "Aha is revising…",
  stop: "Stop",
  use: "Use this",
  inBox: "In the box",
  again: "Try again",
  closeThread: "Close the revision",
  earlier: (n) => `Show ${n} earlier`,
  undo: "Undo",
  undoTitle: "Put back your draft from before Aha's text",
  usedNote: "Aha's text is in the box. Edit it, or post when you are ready.",
  errNoKey: "You have no model to revise with yet.",
  errRate: "Too many revisions just now; try again in a minute.",
  errRefused: (r) => r || "That model is not available on your plan or balance.",
  errFailed: "Aha could not revise this. Try again.",
  errOffline: "No connection to TokensBeat. Try again.",
  errAuth: "Your sign-in has expired. Sign in again.",
  openConsole: "Open your TokensBeat console",
  revisionNote: "Aha only suggests: your draft changes when you choose Use this, and a posted comment is still reviewed."
};

const ZH: SocialCopy = {
  commentsH: "评论",
  shapesH: "读者的图案",
  shapesIntro: "其他人在发射台上做出的图案,每个都附一句说明。点一个,打开它,自己运行看看。",
  count: (n) => `${n} 条评论`,
  like: "喜欢",
  liked: "已喜欢",
  repost: "转发",
  reposted: "已转发",
  repostTitle: "转发:会显示在你的 Aha 页面上",
  repostedTitle: "已转发:它在你的 Aha 页面上。再按一次撤销",
  repostedByPre: "转发者:",
  repostedByJoin: "、",
  repostedByMore: (n) => ` 等 ${n} 人`,
  repostedByPost: "",
  reply: "回复",
  cancel: "取消",
  send: "发表",
  sending: "发送中…",
  placeholder: "写下你的评论。友善,具体。",
  replyPlaceholder: "写下回复",
  signInPrompt: "用 TokensBeat 登录后才能评论、喜欢和转发。",
  createAccount: "创建 TokensBeat 账号",
  signIn: "登录",
  signOut: "退出登录",
  signedInAs: (name) => `已登录:${name}`,
  waitingPopup: "等待登录窗口…",
  popupBlocked: "登录窗口被拦截了。请允许本站弹出窗口后再试。",
  popupClosed: "登录窗口在完成前被关闭了。",
  empty: "还没有评论,来抢沙发吧。",
  loading: "加载中…",
  loadError: "评论加载失败。",
  retry: "重试",
  more: "加载更多",
  pendingTag: "等待审核",
  approvedNote: "已发表,谢谢。",
  pendingNote: "谢谢。你的评论正等待人工查看,通过后会显示出来。",
  rejectedNote: (r) => `未发表:${r}`,
  rateNote: "慢一点:短时间内评论太多。一分钟后再试。",
  invalidNote: "这条无法发表。检查后再试。",
  authNote: "登录已过期,请重新登录。",
  refusedNote: "这个账号不能在这里发表。",
  networkNote: "连不上 TokensBeat,请重试。",
  serverNote: "TokensBeat 出了点问题,请稍后再试。",
  by: (n) => `作者 ${n}`,
  galleryEmpty: "还没有图案。去发射台做一个并发布吧。",
  openInPad: "在发射台中打开",
  publish: "发布我的图案",
  publishH: "发布这个图案",
  publishHint: "棋盘上的活细胞会被裁成它的外框,连同你的说明一起送去审核。",
  titleLabel: "名字",
  titlePlaceholder: "你管它叫什么?",
  noteLabel: "它是什么?",
  notePlaceholder: "说说它是什么,会做什么。",
  cropInfo: (w, h) => `${w} × ${h} 格`,
  tooBig: (w, h, max) => `这个图案是 ${w} × ${h};发布的图案最大 ${max} × ${max}。`,
  emptyBoard: "先画点东西:棋盘是空的。",
  submitShape: "提交图案",
  shapeApproved: "已发布,现在就在图库里。",
  shapePending: "谢谢。你的图案会先由人工查看,再显示出来。",
  shapeRejected: (r) => `未发布:${r}`,
  close: "关闭",
  signedOutPlaceholder: "登录后加入讨论",
  reviewNote: "评论会先经过审核再显示。",
  postHint: "⌘/Ctrl ↵ 发表",
  overLimit: "太长了,发表前请删到 2,000 字以内。",
  revise: "让 Aha 改一改",
  reviseTitle: "Aha 用你自己的模型改写草稿。按下发表之前,不会发出任何内容。",
  modelsTitle: "你的模型",
  modelsNote: "使用你自己的 TokensBeat 密钥运行,费用从你的余额扣除。",
  modelsLoading: "模型…",
  modelsError: "模型不可用 · 重试",
  addModel: "添加模型",
  modelChip: (m) => `“让 Aha 改一改”使用的模型:${m}。更换模型`,
  quick: "快捷修改",
  tones: { polish: "润色", shorter: "更简短", friendlier: "更友善", clearer: "更清楚" },
  sayPlaceholder: "或者告诉 Aha 要怎么改…",
  sayLabel: "告诉 Aha 要怎么改",
  saySend: "发给 Aha",
  you: "你",
  aha: (m) => (m ? `Aha · ${m}` : "Aha"),
  thinking: "Aha 正在修改…",
  stop: "停止",
  use: "采用",
  inBox: "已放进输入框",
  again: "再试一次",
  closeThread: "关闭修改",
  earlier: (n) => `显示更早的 ${n} 条`,
  undo: "撤销",
  undoTitle: "恢复 Aha 改写之前的草稿",
  usedNote: "Aha 的文字已放进输入框。可以再改,准备好了就发表。",
  errNoKey: "你还没有可以用来修改的模型。",
  errRate: "修改太频繁了,一分钟后再试。",
  errRefused: (r) => r || "你的套餐或余额不能使用这个模型。",
  errFailed: "Aha 没能改好这段,请再试一次。",
  errOffline: "连不上 TokensBeat,请重试。",
  errAuth: "登录已过期,请重新登录。",
  openConsole: "打开 TokensBeat 控制台",
  revisionNote: "Aha 只给建议:选“采用”才会替换你的草稿,发表的评论仍会经过审核。"
};

const JA: SocialCopy = {
  commentsH: "コメント",
  shapesH: "読者のかたち",
  shapesIntro: "発射台で作られたかたちと、それが何かの一言。クリックして開き、自分で動かしてみてください。",
  count: (n) => `コメント ${n} 件`,
  like: "いいね",
  liked: "いいね済み",
  repost: "リポスト",
  reposted: "リポスト済み",
  repostTitle: "リポスト:あなたの Aha ページに表示されます",
  repostedTitle: "リポスト済み:Aha ページに載っています。もう一度押すと取り消し",
  repostedByPre: "",
  repostedByJoin: "、",
  repostedByMore: (n) => ` ほか${n}人`,
  repostedByPost: "がリポスト",
  reply: "返信",
  cancel: "キャンセル",
  send: "投稿",
  sending: "送信中…",
  placeholder: "コメントを書く。やさしく、具体的に。",
  replyPlaceholder: "返信を書く",
  signInPrompt: "コメント、いいね、リポストには TokensBeat へのログインが必要です。",
  createAccount: "TokensBeat アカウントを作る",
  signIn: "ログイン",
  signOut: "ログアウト",
  signedInAs: (name) => `${name} でログイン中`,
  waitingPopup: "ログインウィンドウを待っています…",
  popupBlocked: "ログインウィンドウがブロックされました。このサイトのポップアップを許可して、もう一度。",
  popupClosed: "ログインウィンドウが完了前に閉じられました。",
  empty: "まだコメントはありません。最初の一人になってください。",
  loading: "読み込み中…",
  loadError: "コメントを読み込めませんでした。",
  retry: "再試行",
  more: "もっと見る",
  pendingTag: "確認待ち",
  approvedNote: "投稿しました。ありがとうございます。",
  pendingNote: "ありがとうございます。コメントは人が確認するまで待機中で、承認されると表示されます。",
  rejectedNote: (r) => `投稿されませんでした:${r}`,
  rateNote: "少しゆっくり:短時間にコメントが多すぎます。1分後にもう一度。",
  invalidNote: "投稿できませんでした。内容を確認してもう一度。",
  authNote: "ログインの期限が切れました。もう一度ログインしてください。",
  refusedNote: "このアカウントはここに投稿できません。",
  networkNote: "TokensBeat に接続できません。もう一度。",
  serverNote: "TokensBeat で問題が起きました。しばらくしてからもう一度。",
  by: (n) => `${n} さん`,
  galleryEmpty: "まだかたちはありません。発射台で作って公開してください。",
  openInPad: "発射台で開く",
  publish: "自分のかたちを公開",
  publishH: "このかたちを公開",
  publishHint: "盤面の生きたセルを外枠で切り取り、あなたの説明と一緒に審査へ送ります。",
  titleLabel: "名前",
  titlePlaceholder: "何と呼びますか?",
  noteLabel: "これは何?",
  notePlaceholder: "何で、何をするかを書いてください。",
  cropInfo: (w, h) => `${w} × ${h} セル`,
  tooBig: (w, h, max) => `このかたちは ${w} × ${h} です。公開できるのは ${max} × ${max} までです。`,
  emptyBoard: "まず何か描いてください。盤面が空です。",
  submitShape: "かたちを送る",
  shapeApproved: "公開しました。ギャラリーに載っています。",
  shapePending: "ありがとうございます。表示される前に人が確認します。",
  shapeRejected: (r) => `公開されませんでした:${r}`,
  close: "閉じる",
  signedOutPlaceholder: "ログインして会話に加わる",
  reviewNote: "コメントは表示される前に審査されます。",
  postHint: "⌘/Ctrl ↵ で投稿",
  overLimit: "長すぎます。2,000 文字以内にしてから投稿してください。",
  revise: "Aha で推敲",
  reviseTitle: "Aha があなた自身のモデルで下書きを書き直します。投稿を押すまで何も送られません。",
  modelsTitle: "あなたのモデル",
  modelsNote: "あなた自身の TokensBeat キーで動き、残高から支払われます。",
  modelsLoading: "モデル…",
  modelsError: "モデルを使えません · 再試行",
  addModel: "モデルを追加",
  modelChip: (m) => `「Aha で推敲」のモデル:${m}。モデルを変える`,
  quick: "すばやい推敲",
  tones: { polish: "整える", shorter: "短く", friendlier: "やわらかく", clearer: "わかりやすく" },
  sayPlaceholder: "または、どう直すか Aha に伝える…",
  sayLabel: "どう直すか Aha に伝える",
  saySend: "Aha に送る",
  you: "あなた",
  aha: (m) => (m ? `Aha · ${m}` : "Aha"),
  thinking: "Aha が推敲しています…",
  stop: "止める",
  use: "これを使う",
  inBox: "入力欄に入れました",
  again: "もう一度",
  closeThread: "推敲を閉じる",
  earlier: (n) => `前の ${n} 件を表示`,
  undo: "元に戻す",
  undoTitle: "Aha の文に置き換える前の下書きに戻す",
  usedNote: "Aha の文が入力欄に入りました。直してもいいし、そのまま投稿しても。",
  errNoKey: "推敲に使えるモデルがまだありません。",
  errRate: "推敲が多すぎます。1分後にもう一度。",
  errRefused: (r) => r || "このモデルはあなたのプランまたは残高では使えません。",
  errFailed: "Aha はこれを推敲できませんでした。もう一度試してください。",
  errOffline: "TokensBeat に接続できません。もう一度。",
  errAuth: "ログインの期限が切れました。もう一度ログインしてください。",
  openConsole: "TokensBeat コンソールを開く",
  revisionNote: "Aha は提案するだけです。「これを使う」で下書きが置き換わり、投稿したコメントは審査されます。"
};

export const SOCIAL_COPY: Record<Lang, SocialCopy> = { en: EN, zh: ZH, ja: JA };
