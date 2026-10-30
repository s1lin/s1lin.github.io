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
  reply: string;
  cancel: string;
  send: string;
  sending: string;
  placeholder: string;
  replyPlaceholder: string;
  moderation: string;
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
  revise: string;
  reviseHide: string;
  reviseModel: string;
  reviseTone: string;
  tones: { polish: string; shorter: string; friendlier: string; clearer: string };
  reviseGo: string;
  revising: string;
  reviseNote: string;
  reviseLoadingModels: string;
  reviseNoKey: string;
  reviseNoKeyLink: string;
  reviseYours: string;
  reviseSuggestion: (model: string) => string;
  reviseUse: string;
  reviseUndo: string;
  reviseAgain: string;
  reviseDiscard: string;
  reviseApplied: string;
  reviseRate: string;
  reviseRefused: (reason: string) => string;
  reviseFailed: string;
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
  reply: "Reply",
  cancel: "Cancel",
  send: "Post comment",
  sending: "Sending…",
  placeholder: "Add a comment. Be kind, be specific.",
  replyPlaceholder: "Write a reply",
  moderation: "Comments are screened first. Most appear at once; a few wait for a person to look.",
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
  revise: "Revise with AI",
  reviseHide: "Hide AI revise",
  reviseModel: "Model",
  reviseTone: "Tone",
  tones: { polish: "Polish", shorter: "Shorter", friendlier: "Friendlier", clearer: "Clearer" },
  reviseGo: "Revise",
  revising: "Revising…",
  reviseNote: "Your own model, on your own key, rewrites your draft. Nothing is posted until you press the post button, and a posted comment is still screened.",
  reviseLoadingModels: "Loading your models…",
  reviseNoKey: "You have no model key to revise with yet. Sign in to TokensBeat and add a key in your console, then come back.",
  reviseNoKeyLink: "Open TokensBeat",
  reviseYours: "Your draft",
  reviseSuggestion: (m) => (m ? `Suggestion from ${m}` : "Suggestion"),
  reviseUse: "Use this",
  reviseUndo: "Undo",
  reviseAgain: "Try again",
  reviseDiscard: "Discard",
  reviseApplied: "Your draft was replaced.",
  reviseRate: "Too many revisions just now. Wait a moment and try again.",
  reviseRefused: (r) => `That model is not available on your plan or balance${r ? `: ${r}` : "."}`,
  reviseFailed: "The model did not answer. Try again, or pick another model.",
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
  reply: "回复",
  cancel: "取消",
  send: "发表评论",
  sending: "发送中…",
  placeholder: "写下你的评论。友善,具体。",
  replyPlaceholder: "写下回复",
  moderation: "评论会先经过审核。大多数会立即显示,少数需要人工查看。",
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
  revise: "用 AI 润色",
  reviseHide: "收起 AI 润色",
  reviseModel: "模型",
  reviseTone: "语气",
  tones: { polish: "润色", shorter: "更简短", friendlier: "更友善", clearer: "更清楚" },
  reviseGo: "润色",
  revising: "润色中…",
  reviseNote: "用你自己的模型、你自己的密钥改写草稿。点发表之前不会发出任何内容,发表后的评论仍会经过审核。",
  reviseLoadingModels: "正在读取你的模型…",
  reviseNoKey: "你还没有可用来润色的模型密钥。请登录 TokensBeat,在控制台里添加密钥,再回来。",
  reviseNoKeyLink: "打开 TokensBeat",
  reviseYours: "你的草稿",
  reviseSuggestion: (m) => (m ? `${m} 的建议` : "建议"),
  reviseUse: "采用",
  reviseUndo: "撤销",
  reviseAgain: "再试一次",
  reviseDiscard: "放弃",
  reviseApplied: "草稿已替换。",
  reviseRate: "润色太频繁了,请稍等再试。",
  reviseRefused: (r) => `你的套餐或余额不能使用这个模型${r ? `:${r}` : "。"}`,
  reviseFailed: "模型没有回应。请重试,或换一个模型。",
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
  reply: "返信",
  cancel: "キャンセル",
  send: "コメントする",
  sending: "送信中…",
  placeholder: "コメントを書く。やさしく、具体的に。",
  replyPlaceholder: "返信を書く",
  moderation: "コメントは先に審査されます。ほとんどはすぐ表示され、一部は人が確認します。",
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
  revise: "AI で推敲",
  reviseHide: "AI 推敲を閉じる",
  reviseModel: "モデル",
  reviseTone: "トーン",
  tones: { polish: "整える", shorter: "短く", friendlier: "やわらかく", clearer: "わかりやすく" },
  reviseGo: "推敲する",
  revising: "推敲中…",
  reviseNote: "あなた自身のモデルが、あなた自身のキーで下書きを書き直します。投稿ボタンを押すまで何も送られず、投稿したコメントは審査されます。",
  reviseLoadingModels: "モデルを読み込み中…",
  reviseNoKey: "推敲に使えるモデルキーがまだありません。TokensBeat にサインインし、コンソールでキーを追加してから戻ってきてください。",
  reviseNoKeyLink: "TokensBeat を開く",
  reviseYours: "あなたの下書き",
  reviseSuggestion: (m) => (m ? `${m} の提案` : "提案"),
  reviseUse: "これを使う",
  reviseUndo: "元に戻す",
  reviseAgain: "もう一度",
  reviseDiscard: "破棄",
  reviseApplied: "下書きを置き換えました。",
  reviseRate: "推敲の回数が多すぎます。少し待ってからもう一度。",
  reviseRefused: (r) => `このモデルはあなたのプランまたは残高では使えません${r ? `:${r}` : "。"}`,
  reviseFailed: "モデルが応答しませんでした。もう一度試すか、別のモデルを選んでください。",
};

export const SOCIAL_COPY: Record<Lang, SocialCopy> = { en: EN, zh: ZH, ja: JA };
