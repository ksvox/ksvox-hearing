// ヒアリングシートの項目定義。文言を変えたい時はここを直す

export const TYPES = {
  trial: { label: 'お試しレッスン', short: 'お試し', note: '初めてレッスンを体験される方' },
  counseling: { label: 'カウンセリング', short: 'カウンセリング', note: '声や歌のご相談・スクール選びのご相談' },
  interview: { label: '面談', short: '面談', note: 'ご入門をお考えの方(45分)' },
};

export const OCCUPATIONS = ['会社員', 'アルバイト・パート', '自営業・自由業', '学生', '主婦・主夫', 'その他'];

export const HOPE_CLASSES = ['門下生クラス', 'レッスン生クラス', 'ボイトレクラス', '未定'];

export const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 9); // 9〜22時

export const EMAIL_DOMAINS = [
  'gmail.com', 'icloud.com', 'yahoo.co.jp', 'docomo.ne.jp', 'au.com', 'softbank.ne.jp', 'i.softbank.jp',
];

export const SELF_CHECKS = [
  { key: 'volume', label: '声量(声の大きさ)', left: '大きい', right: '小さい' },
  { key: 'pitch', label: '音程', left: '良い', right: '悪い' },
  { key: 'rhythm', label: 'リズム感', left: 'ある', right: 'ない' },
  { key: 'diction', label: '発音', left: '良い', right: '悪い' },
];

export const MOTIVES = [
  '歌が上手くなりたい', '発声を基礎から学び直したい', '独学に限界を感じた', '今の先生・スクールに疑問がある',
  '英語(洋楽)を上手に歌いたい', '声の悩みを解消したい', 'ライブ・オーディションに向けて', '本格的に歌を続けていきたい', 'その他',
];

export const CONCERNS = [
  '高い声が出ない・苦しい', '音程が不安定', 'リズムが取れない', '声が小さい・通らない', '喉が疲れる・痛くなる',
  '声がかすれる・裏返る', '息が続かない', '自分の声質が好きではない', '英語の発音', '人前だと緊張して歌えない', 'その他',
];

export const PRIORITIES = [
  'ボイトレ(ボイストレーナー)とボーカルレッスン(ボーカルコーチ)の違い', '歌に関しての総評(歌唱あり)',
  '発声法の是非(正しく発声できているか)', '腹式呼吸のメカニズム(方法)', '姿勢や骨格について',
  '英語(洋楽)を歌う利点', '先生やスクールの選び方', "K's VOXの特徴(理念・方針)", 'その他疑問',
];

export const MUSIC_EXP = [
  { key: 'lesson', label: 'レッスン経験がある', detail: 'どんなレッスン・期間など' },
  { key: 'band', label: 'バンド経験がある' },
  { key: 'live', label: 'ライブの経験がある' },
  { key: 'instrument', label: '楽器が演奏できる', detail: '楽器名' },
];

export const MY_SONG = [
  { key: 'onchi', label: '自分は音痴だと思う' },
  { key: 'highKey', label: 'キーは高めだと思う' },
  { key: 'bright', label: '声は明るめだと思う' },
  { key: 'stage', label: '人前で歌うのが好き' },
];

export const YNU = ['はい', 'いいえ', 'わからない'];

export const PRIVACY_NOTE =
  'お預かりした個人情報は、当方からのご連絡のみに使用します。ご入門されなかった場合、3ヶ月後に自動で削除されます。';

// 所見の手書き欄
export const SHOKEN_SECTIONS = ['声量', '音程', 'リズム感', '発音(調音)', 'その他テクニック'];

export function emptyAnswers() {
  return {
    name: '', kana: '', birth: { y: '', m: '', d: '' }, occupation: '', occupationOther: '',
    residence: '', phone: '', emailLocal: '', emailDomain: 'gmail.com', emailOther: '',
    hopeClass: '', days: [], timeFrom: '', timeTo: '',
    self: { volume: 0, pitch: 0, rhythm: 0, diction: 0 },
    motives: [], motivesOther: '', concerns: [], concernsOther: '', priorities: [], prioritiesOther: '',
    exp: { lesson: '', lessonDetail: '', band: '', live: '', instrument: '', instrumentDetail: '' },
    song: { onchi: '', highKey: '', bright: '', stage: '' },
  };
}

export function emailOf(a) {
  if (!a.emailLocal) return '';
  const dom = a.emailDomain === 'other' ? a.emailOther : a.emailDomain;
  return dom ? `${a.emailLocal}@${dom}` : a.emailLocal;
}
