/* ============================================================
   FURIGANA, WORKED OUT RATHER THAN TYPED.

   Asking somebody to type the reading of every phrase they write down is
   asking them to do the one part of the work a machine can do, and it is the
   part that makes people stop writing phrases down.

   WHAT THIS IS AND IS NOT. Perfect Japanese readings need a morphological
   analyser with a full dictionary — ten megabytes or so of it — because
   Japanese readings are not a property of characters but of words, and often
   of the sentence around the word: 人 is ひと, にん, じん or り depending on
   what it is doing. That is not going into a single file that has to open
   offline on a tablet.

   What goes in instead is the structure that actually covers ordinary
   vocabulary, in three layers:

     A WORD LIST first, longest match wins. Everything irregular lives here —
     今日 きょう, 大人 おとな, 一人 ひとり — along with the commonest words
     whose readings are not predictable from their parts. This layer is exact.

     OKURIGANA MATCHING second. 食べる is 食 + べる, and 食's kun reading is
     recorded as た.べる, so the べる identifies both the reading and where
     the word ends. This is how nearly every verb and adjective in the
     language is written, and matching on the tail makes it reliable.

     ON READINGS last, for runs of kanji with no kana between them, which is
     how nearly every compound noun is written: 経営 is けい + えい.

   AND IT SAYS WHEN IT DOES NOT KNOW. A kanji not in the table comes back
   unread rather than guessed at, and anything holding a reading can see that
   it is incomplete. A wrong reading written down confidently is worse than
   no reading, because you will learn it.
   ============================================================ */

/* Kanji, its on readings, and its kun readings with a dot where the
   okurigana starts. Kept as text rather than as an object literal because
   this is a table to be read and corrected, not code. */
const JA_KANJI_SRC = `
一|いち,いつ|ひと.つ,ひと
二|に|ふた.つ,ふた
三|さん|み.っつ,み
四|し|よ.っつ,よん,よ
五|ご|いつ.つ,いつ
六|ろく|む.っつ,む
七|しち|なな.つ,なな
八|はち|や.っつ,や
九|きゅう,く|ここの.つ,ここの
十|じゅう|とお,と
百|ひゃく|
千|せん|ち
万|まん,ばん|
円|えん|まる.い,まる
日|にち,じつ|ひ,か
月|げつ,がつ|つき
火|か|ひ
水|すい|みず
木|もく,ぼく|き
金|きん,こん|かね
土|ど,と|つち
年|ねん|とし
時|じ|とき
分|ふん,ぶん|わ.ける,わ.かる
秒|びょう|
週|しゅう|
曜|よう|
今|こん,きん|いま
先|せん|さき
来|らい|く.る,き.たる
毎|まい|
朝|ちょう|あさ
昼|ちゅう|ひる
夜|や|よる,よ
晩|ばん|
午|ご|
前|ぜん|まえ
後|ご,こう|あと,うし.ろ,のち
半|はん|なか.ば
間|かん,けん|あいだ,ま
中|ちゅう|なか
外|がい,げ|そと,ほか
上|じょう|うえ,あ.げる,あ.がる,のぼ.る
下|か,げ|した,さ.げる,さ.がる,くだ.さる
左|さ|ひだり
右|う,ゆう|みぎ
北|ほく|きた
南|なん|みなみ
東|とう|ひがし
西|せい,さい|にし
人|じん,にん|ひと
男|だん,なん|おとこ
女|じょ,にょ|おんな,め
子|し,す|こ
父|ふ|ちち
母|ぼ|はは
兄|きょう,けい|あに
姉|し|あね
弟|てい,だい|おとうと
妹|まい|いもうと
家|か,け|いえ,うち
族|ぞく|
友|ゆう|とも
名|めい,みょう|な
私|し|わたし,わたくし
僕|ぼく|
彼|ひ|かれ
達|たつ|
学|がく|まな.ぶ
校|こう|
生|せい,しょう|い.きる,う.まれる,なま
教|きょう|おし.える,おそ.わる
室|しつ|
文|ぶん,もん|ふみ
字|じ|
本|ほん|もと
読|どく|よ.む
書|しょ|か.く
言|げん,ごん|い.う,こと
話|わ|はな.す,はなし
語|ご|かた.る
英|えい|
国|こく|くに
聞|ぶん|き.く,き.こえる
見|けん|み.る,み.せる,み.える
行|こう,ぎょう|い.く,おこな.う
帰|き|かえ.る,かえ.す
出|しゅつ|で.る,だ.す
入|にゅう|はい.る,い.れる
立|りつ|た.つ,た.てる
座|ざ|すわ.る
歩|ほ|ある.く
走|そう|はし.る
止|し|と.まる,と.める
動|どう|うご.く,うご.かす
働|どう|はたら.く
休|きゅう|やす.む,やす.み
寝|しん|ね.る
起|き|お.きる,お.こす
使|し|つか.う
作|さく,さ|つく.る
買|ばい|か.う
売|ばい|う.る
持|じ|も.つ
待|たい|ま.つ
会|かい|あ.う
合|ごう|あ.う,あ.わせる
知|ち|し.る
思|し|おも.う
考|こう|かんが.える
覚|かく|おぼ.える
忘|ぼう|わす.れる
感|かん|かん.じる
信|しん|しん.じる
決|けつ|き.める,き.まる
始|し|はじ.める,はじ.まる
終|しゅう|お.わる,お.える
続|ぞく|つづ.ける,つづ.く
変|へん|か.わる,か.える
違|い|ちが.う
同|どう|おな.じ
似|じ|に.る
多|た|おお.い
少|しょう|すく.ない,すこ.し
大|だい,たい|おお.きい,おお.い
小|しょう|ちい.さい,こ,お
高|こう|たか.い
低|てい|ひく.い
長|ちょう|なが.い
短|たん|みじか.い
早|そう|はや.い
速|そく|はや.い
遅|ち|おそ.い,おく.れる
新|しん|あたら.しい
古|こ|ふる.い
若|じゃく|わか.い
強|きょう|つよ.い
弱|じゃく|よわ.い
重|じゅう,ちょう|おも.い,かさ.ねる
軽|けい|かる.い
広|こう|ひろ.い
狭|きょう|せま.い
深|しん|ふか.い
浅|せん|あさ.い
明|めい|あか.るい,あ.ける
暗|あん|くら.い
暑|しょ|あつ.い
寒|かん|さむ.い
熱|ねつ|あつ.い
冷|れい|つめ.たい,ひ.える
暖|だん|あたた.かい
涼|りょう|すず.しい
良|りょう|よ.い
悪|あく|わる.い
安|あん|やす.い
忙|ぼう|いそが.しい
楽|らく,がく|たの.しい
苦|く|くる.しい,にが.い
嬉|き|うれ.しい
悲|ひ|かな.しい
美|び|うつく.しい
面|めん|おも,つら
白|はく|しろ.い,しろ
黒|こく|くろ.い,くろ
赤|せき|あか.い,あか
青|せい|あお.い,あお
色|しょく,しき|いろ
好|こう|す.き,この.む
嫌|けん|きら.い,いや
欲|よく|ほ.しい
食|しょく|た.べる,く.う
飲|いん|の.む
料|りょう|
理|り|
味|み|あじ
肉|にく|
魚|ぎょ|さかな
野|や|の
菜|さい|
米|べい,まい|こめ
茶|ちゃ,さ|
酒|しゅ|さけ
氷|ひょう|こおり
店|てん|みせ
屋|おく|や
市|し|いち
町|ちょう|まち
村|そん|むら
都|と,つ|みやこ
県|けん|
道|どう|みち
路|ろ|じ
駅|えき|
車|しゃ|くるま
電|でん|
気|き,け|
自|じ|みずか.ら
転|てん|ころ.ぶ
運|うん|はこ.ぶ
乗|じょう|の.る,の.せる
降|こう|お.りる,ふ.る
橋|きょう|はし
川|せん|かわ
山|さん|やま
海|かい|うみ
空|くう|そら,あ.く
天|てん|あま
雨|う|あめ
雪|せつ|ゆき
風|ふう|かぜ
雲|うん|くも
星|せい|ほし
花|か|はな
草|そう|くさ
林|りん|はやし
森|しん|もり
石|せき|いし
田|でん|た
畑||はたけ
犬|けん|いぬ
猫|びょう|ねこ
鳥|ちょう|とり
虫|ちゅう|むし
体|たい|からだ
頭|とう,ず|あたま
顔|がん|かお
目|もく|め
耳|じ|みみ
口|こう|くち
鼻|び|はな
手|しゅ|て
足|そく|あし,た.りる
指|し|ゆび
心|しん|こころ
胸|きょう|むね
腹|ふく|はら
背|はい|せ
病|びょう|やまい
院|いん|
医|い|
薬|やく|くすり
痛|つう|いた.い
元|げん|もと
仕|し|つか.える
事|じ|こと
社|しゃ|やしろ
員|いん|
業|ぎょう|
務|む|つと.める
職|しょく|
給|きゅう|
銀|ぎん|
物|ぶつ,もつ|もの
品|ひん|しな
服|ふく|
着|ちゃく|き.る,つ.く
靴||くつ
帽|ぼう|
鞄||かばん
紙|し|かみ
筆|ひつ|ふで
机|き|つくえ
椅|い|
窓|そう|まど
戸|こ|と
門|もん|かど
部|ぶ|
台|だい,たい|
所|しょ|ところ
場|じょう|ば
公|こう|おおやけ
園|えん|その
図|ず,と|
館|かん|
映|えい|うつ.る,うつ.す
画|が,かく|
写|しゃ|うつ.す
真|しん|ま
音|おん|おと
歌|か|うた,うた.う
踊|よう|おど.る
絵|え,かい|
描|びょう|えが.く,か.く
術|じゅつ|
芸|げい|
化|か,け|ば.ける
史|し|
世|せい,せ|よ
界|かい|
政|せい|まつりごと
治|ち,じ|なお.る,おさ.める
経|けい|へ.る
済|さい|す.む,す.ませる
営|えい|いとな.む
産|さん|う.む
商|しょう|あきな.う
農|のう|
工|こう,く|
建|けん|た.てる,た.つ
造|ぞう|つく.る
機|き|
械|かい|
具|ぐ|
科|か|
研|けん|と.ぐ
究|きゅう|きわ.める
問|もん|と.う
題|だい|
答|とう|こた.える,こた.え
試|し|ため.す,こころ.みる
験|けん|
練|れん|ね.る
習|しゅう|なら.う
復|ふく|
予|よ|
準|じゅん|
備|び|そな.える
計|けい|はか.る
実|じつ|み,みの.る
現|げん|あらわ.れる
果|か|は.たす
結|けつ|むす.ぶ
成|せい|な.る
功|こう|
失|しつ|うしな.う
敗|はい|やぶ.れる
勝|しょう|か.つ
負|ふ|ま.ける,お.う
努|ど|つと.める
力|りょく,りき|ちから
能|のう|
才|さい|
技|ぎ|わざ
方|ほう|かた
法|ほう|
式|しき|
用|よう|もち.いる
利|り|き.く
便|べん,びん|
不|ふ,ぶ|
無|む,ぶ|な.い
有|ゆう,う|あ.る
必|ひつ|かなら.ず
要|よう|い.る
切|せつ|き.る,き.れる
急|きゅう|いそ.ぐ
危|き|あぶ.ない
険|けん|
全|ぜん|まった.く,すべ.て
守|しゅ|まも.る
助|じょ|たす.ける
伝|でん|つた.える,つた.わる
送|そう|おく.る
受|じゅ|う.ける
取|しゅ|と.る
渡|と|わた.す,わた.る
借|しゃく|か.りる
貸|たい|か.す
返|へん|かえ.す,かえ.る
払|ふつ|はら.う
配|はい|くば.る
届|かい|とど.く,とど.ける
選|せん|えら.ぶ
集|しゅう|あつ.める,あつ.まる
別|べつ|わか.れる
開|かい|ひら.く,あ.ける,あ.く
閉|へい|し.める,し.まる,と.じる
押|おう|お.す
引|いん|ひ.く
打|だ|う.つ
投|とう|な.げる
落|らく|お.ちる,お.とす
拾|しゅう|ひろ.う
捨|しゃ|す.てる
置|ち|お.く
並|へい|なら.ぶ,なら.べる
込|こみ|こ.む
過|か|す.ぎる,す.ごす
通|つう|とお.る,かよ.う
発|はつ|
到|とう|
向|こう|む.かう,む.く
戻|れい|もど.る,もど.す
探|たん|さが.す
付|ふ|つ.く,つ.ける
追|つい|お.う
逃|とう|に.げる
隠|いん|かく.れる,かく.す
消|しょう|き.える,け.す
残|ざん|のこ.る,のこ.す
増|ぞう|ふ.える,ふ.やす
減|げん|へ.る,へ.らす
直|ちょく|なお.す,なお.る
壊|かい|こわ.す,こわ.れる
洗|せん|あら.う
掃|そう|は.く
除|じょ|のぞ.く
片|へん|かた
連|れん|つ.れる
絡|らく|
相|そう,しょう|あい
談|だん|
約|やく|
束|そく|たば
招|しょう|まね.く
訪|ほう|おとず.れる,たず.ねる
泊|はく|と.まる
旅|りょ|たび
観|かん|
光|こう|ひかり,ひか.る
宿|しゅく|やど
泳|えい|およ.ぐ
登|とう,と|のぼ.る
釣|ちょう|つ.る
遊|ゆう|あそ.ぶ
笑|しょう|わら.う
泣|きゅう|な.く
怒|ど|おこ.る,いか.る
驚|きょう|おどろ.く
困|こん|こま.る
悩|のう|なや.む
迷|めい|まよ.う
慣|かん|な.れる
飽|ほう|あ.きる
恥|ち|は.ずかしい
許|きょ|ゆる.す
謝|しゃ|あやま.る
褒|ほう|ほ.める
叱|しつ|しか.る
頼|らい|たの.む,たよ.る
願|がん|ねが.う
祈|き|いの.る
数|すう|かず,かぞ.える
量|りょう|はか.る
測|そく|はか.る
比|ひ|くら.べる
例|れい|たと.える
説|せつ|と.く
証|しょう|
拠|きょ|
由|ゆ,ゆう|よし
原|げん|はら
因|いん|よ.る
最|さい|もっと.も
初|しょ|はじ.め,はつ
次|じ|つぎ
番|ばん|
号|ごう|
第|だい|
回|かい|まわ.る,まわ.す
度|ど|たび
点|てん|
線|せん|
形|けい|かたち
角|かく|かど,つの
丸|がん|まる.い
組|そ|く.む,くみ
勉|べん|
疲|ひ|つか.れる
難|なん|むずか.しい
単|たん|
漢|かん|
春|しゅん|はる
夏|か|なつ
秋|しゅう|あき
冬|とう|ふゆ
誰||だれ
何|か|なに,なん
京|きょう,けい|
遠|えん|とお.い
近|きん|ちか.い
太|たい,た|ふと.い
細|さい|ほそ.い,こま.かい
厚|こう|あつ.い
薄|はく|うす.い
優|ゆう|やさ.しい,すぐ.れる
情|じょう|なさ.け
態|たい|
反|はん|そ.る
対|たい|
賛|さん|
望|ぼう|のぞ.む
希|き|
参|さん|まい.る
加|か|くわ.える,くわ.わる
民|みん|たみ
供|きょう|そな.える,とも
育|いく|そだ.てる,そだ.つ
訓|くん|
認|にん|みと.める
識|しき|
解|かい|と.く,わ.かる
表|ひょう|おもて,あらわ.す
裏|り|うら
内|ない|うち
側|そく|がわ
位|い|くらい
権|けん|
責|せき|せ.める
任|にん|まか.せる
役|やく|
割|かつ|わ.る,わり
般|はん|
普|ふ|
常|じょう|つね
非|ひ|
更|こう|さら
既|き|すで.に
状|じょう|
況|きょう|
環|かん|
境|きょう|さかい
影|えい|かげ
響|きょう|ひび.く
象|しょう,ぞう|
総|そう|
各|かく|おのおの
個|こ|
声|せい|こえ
静|せい|しず.か
騒|そう|さわ.ぐ
辛|しん|から.い,つら.い
甘|かん|あま.い
酸|さん|す.い
塩|えん|しお
砂|さ|すな
糖|とう|
卵|らん|たまご
豆|とう|まめ
麦|ばく|むぎ
粉|ふん|こな
油|ゆ|あぶら
焼|しょう|や.く,や.ける
煮|しゃ|に.る
混|こん|ま.ぜる,ま.じる
包|ほう|つつ.む
箱|そう|はこ
袋|たい|ふくろ
瓶|びん|
缶|かん|
皿||さら
杯|はい|さかずき
枚|まい|
冊|さつ|
匹|ひき|
歳|さい|
誕|たん|
祝|しゅく|いわ.う
婚|こん|
離|り|はな.れる,はな.す
児|じ|
妻|さい|つま
夫|ふ|おっと
親|しん|おや,した.しい
息|そく|いき
娘||むすめ
孫|そん|まご
祖|そ|
`;

/* Words whose reading is not the sum of their parts, and common words worth
   getting exactly right rather than nearly right. Longest match wins, so a
   word here always beats the character-by-character fallback below.
   熟字訓 — readings attached to a whole compound rather than to its kanji —
   can only live here: there is no rule that turns 今日 into きょう. */
const JA_WORDS_SRC = `
今日|きょう
明日|あした
昨日|きのう
一昨日|おととい
明後日|あさって
毎日|まいにち
今朝|けさ
今晩|こんばん
今年|ことし
去年|きょねん
来年|らいねん
毎年|まいとし
今月|こんげつ
先月|せんげつ
来月|らいげつ
毎月|まいつき
今週|こんしゅう
先週|せんしゅう
来週|らいしゅう
毎週|まいしゅう
一人|ひとり
二人|ふたり
大人|おとな
子供|こども
友達|ともだち
上手|じょうず
下手|へた
今|いま
時計|とけい
眼鏡|めがね
部屋|へや
田舎|いなか
果物|くだもの
八百屋|やおや
土産|みやげ
手伝|てつだ
一日|ついたち
二十歳|はたち
一緒|いっしょ
本当|ほんとう
大丈夫|だいじょうぶ
先生|せんせい
学生|がくせい
留学生|りゅうがくせい
会社|かいしゃ
会社員|かいしゃいん
仕事|しごと
自分|じぶん
自転車|じてんしゃ
自動車|じどうしゃ
電車|でんしゃ
電話|でんわ
携帯|けいたい
世界|せかい
社会|しゃかい
文化|ぶんか
経済|けいざい
政治|せいじ
経営|けいえい
学校|がっこう
大学|だいがく
高校|こうこう
中学|ちゅうがく
小学|しょうがく
教室|きょうしつ
図書館|としょかん
病院|びょういん
銀行|ぎんこう
郵便|ゆうびん
公園|こうえん
駅前|えきまえ
場所|ばしょ
住所|じゅうしょ
名前|なまえ
言葉|ことば
日本|にほん
日本語|にほんご
英語|えいご
外国|がいこく
外国人|がいこくじん
料理|りょうり
食事|しょくじ
朝食|ちょうしょく
昼食|ちゅうしょく
夕食|ゆうしょく
野菜|やさい
飲物|のみもの
食物|たべもの
時間|じかん
時々|ときどき
最初|さいしょ
最後|さいご
最近|さいきん
今度|こんど
一度|いちど
一番|いちばん
全部|ぜんぶ
半分|はんぶん
以上|いじょう
以下|いか
以外|いがい
場合|ばあい
理由|りゆう
問題|もんだい
質問|しつもん
答|こた
説明|せつめい
practice|れんしゅう
練習|れんしゅう
復習|ふくしゅう
予習|よしゅう
宿題|しゅくだい
試験|しけん
発音|はつおん
文法|ぶんぽう
単語|たんご
会話|かいわ
作文|さくぶん
意味|いみ
大切|たいせつ
大変|たいへん
便利|べんり
不便|ふべん
有名|ゆうめい
親切|しんせつ
元気|げんき
気持|きも
気分|きぶん
心配|しんぱい
安心|あんしん
残念|ざんねん
興味|きょうみ
趣味|しゅみ
旅行|りょこう
散歩|さんぽ
運動|うんどう
掃除|そうじ
洗濯|せんたく
買物|かいもの
準備|じゅんび
用意|ようい
約束|やくそく
返事|へんじ
連絡|れんらく
相談|そうだん
紹介|しょうかい
説明|せつめい
確認|かくにん
注意|ちゅうい
無理|むり
必要|ひつよう
重要|じゅうよう
簡単|かんたん
複雑|ふくざつ
普通|ふつう
特別|とくべつ
自然|しぜん
天気|てんき
気温|きおん
季節|きせつ
音楽|おんがく
映画|えいが
写真|しゃしん
小説|しょうせつ
新聞|しんぶん
雑誌|ざっし
物語|ものがたり
値段|ねだん
料金|りょうきん
給料|きゅうりょう
道具|どうぐ
機械|きかい
建物|たてもの
部長|ぶちょう
社長|しゃちょう
今回|こんかい
毎回|まいかい
手紙|てがみ
右手|みぎて
左手|ひだりて
両方|りょうほう
片方|かたほう
勉強|べんきょう
高校生|こうこうせい
中学生|ちゅうがくせい
小学生|しょうがくせい
大学生|だいがくせい
組合|くみあい
番組|ばんぐみ
仕組|しく
両親|りょうしん
兄弟|きょうだい
姉妹|しまい
家族|かぞく
親切|しんせつ
誕生日|たんじょうび
結婚|けっこん
今回|こんかい
一生懸命|いっしょうけんめい
大丈夫|だいじょうぶ
丁寧|ていねい
一緒|いっしょ
普通|ふつう
一般|いっぱん
非常|ひじょう
状況|じょうきょう
環境|かんきょう
影響|えいきょう
感情|かんじょう
関係|かんけい
関心|かんしん
参加|さんか
経験|けいけん
表現|ひょうげん
理解|りかい
認識|にんしき
責任|せきにん
役割|やくわり
個人|こじん
自信|じしん
成長|せいちょう
成功|せいこう
失敗|しっぱい
努力|どりょく
能力|のうりょく
技術|ぎじゅつ
情報|じょうほう
資料|しりょう
内容|ないよう
方法|ほうほう
目的|もくてき
目標|もくひょう
計画|けいかく
結果|けっか
原因|げんいん
影|かげ
声|こえ
静|しず
`;

/* ---------- reading the table ---------- */
const JA_KANJI = (() => {
  const map = new Map();
  JA_KANJI_SRC.trim().split('\n').forEach(line => {
    const [ch, on, kun] = line.split('|');
    if(!ch || ch.length !== 1) return;
    map.set(ch, {
      on: (on || '').split(',').filter(Boolean),
      /* each kun is stem + the okurigana that identifies it */
      kun: (kun || '').split(',').filter(Boolean).map(k => {
        const at = k.indexOf('.');
        return at < 0 ? {stem: k, tail: ''} : {stem: k.slice(0, at), tail: k.slice(at + 1)};
      })});
  });
  return map;
})();
const JA_WORDS = (() => {
  const map = new Map();
  let longest = 1;
  JA_WORDS_SRC.trim().split('\n').forEach(line => {
    const [w, r] = line.split('|');
    if(!w || !r || !/[\u4e00-\u9fff]/.test(w)) return;
    map.set(w, r);
    longest = Math.max(longest, w.length);
  });
  map.longest = longest;
  return map;
})();

/* ---------- okurigana, conjugated ----------
   A dictionary tail is the tail of the dictionary form: 飲.む, 降.る, 高.い.
   Running text almost never has the dictionary form in it. 飲み物 has み,
   降って has っ, 高かった has か — and a reader matching only on む, る and
   い finds none of them and falls back to the on reading, which is how
   飲み物 comes out いんみもの.

   The conjugations of a Japanese verb all stay in the same consonant row as
   the dictionary form's last kana, with two sound changes on top: う, つ and
   る go to っ before て and た; ぬ, ぶ and む go to ん; く and ぐ go to い.
   That is a short enough rule to write down, and it covers the ordinary
   conjugation of every regular verb and adjective in the language. */
const JA_ROWS = ['あいうえお','かきくけこ','がぎぐげご','さしすせそ','ざじずぜぞ',
  'たちつてと','だぢづでど','なにぬねの','はひふへほ','ばびぶべぼ','ぱぴぷぺぽ',
  'まみむめも','やゆよ','らりるれろ','わをん'];
const JA_ROW_OF = (() => { const m = {};
  JA_ROWS.forEach(r => [...r].forEach(c => m[c] = r)); return m; })();
/* the extra shapes a tail's first kana can take once it is conjugated */
const JA_ONBIN = {'う':'っ', 'つ':'っ', 'る':'っ', 'ぬ':'ん', 'ぶ':'ん', 'む':'ん',
  'く':'い', 'ぐ':'い'};
function jaTailFits(tail, want){
  if(!want) return false;
  if(tail.startsWith(want)) return true;           /* the dictionary form itself */
  const a = want[0], b = tail[0];
  if(!a || !b) return false;
  if(JA_ONBIN[a] === b) return true;               /* 降って, 飲んで, 書いて */
  /* an い-adjective inflects through か, く and け: 高かった, 高く, 高ければ */
  if(a === 'い') return 'かくけ'.includes(b);
  /* and everything else stays in its own row: 飲み, 飲ま, 飲め */
  const row = JA_ROW_OF[a];
  return !!row && row.includes(b);
}
const JA_KANJI_RE = /[\u4e00-\u9fff\u3005]/;
const JA_KANA_RE = /[\u3040-\u309f\u30a0-\u30ff\u30fc]/;
const jaIsKanji = c => JA_KANJI_RE.test(c);
const jaIsKana = c => JA_KANA_RE.test(c);
/* katakana to hiragana, so a reading written either way compares and prints
   the same — furigana is written in hiragana whatever the word is */
const jaToHira = s => String(s || '').replace(/[\u30a1-\u30f6]/g,
  c => String.fromCharCode(c.charCodeAt(0) - 0x60));

/* ---------- the reading of a piece of text ----------
   Returns the text cut into pieces: every piece is either kana and
   punctuation, which reads as itself, or a run of kanji with a reading
   worked out for it. A piece whose reading could not be worked out comes
   back with `sure: false` and no reading rather than with a guess. */
function jaReadings(text){
  const s = String(text || '');
  const out = [];
  let i = 0;
  const plain = c => { const last = out[out.length - 1];
    if(last && !last.reading && last.sure) last.text += c;
    else out.push({text: c, reading: '', sure: true}); };
  while(i < s.length){
    const c = s[i];
    if(!jaIsKanji(c)){ plain(c); i++; continue; }
    /* 1. a word, longest first */
    let hit = null;
    for(let n = Math.min(JA_WORDS.longest, s.length - i); n >= 1; n--){
      const w = s.slice(i, i + n);
      if(JA_WORDS.has(w)){ hit = {text: w, reading: JA_WORDS.get(w), sure: true}; break; }
    }
    if(hit){ out.push(hit); i += hit.text.length; continue; }
    /* 2. one kanji plus the kana after it: the okurigana says which reading */
    const tail = (() => { let j = i + 1; while(j < s.length && jaIsKana(s[j])) j++;
      return s.slice(i + 1, j); })();
    const info = JA_KANJI.get(c);
    if(info){
      /* the dictionary form first, then the conjugated shapes: a reading
         whose own tail is spelled out is better evidence than one inferred */
      const kun = info.kun.find(k => k.tail && tail.startsWith(k.tail))
        || info.kun.find(k => k.tail && jaTailFits(tail, k.tail));
      if(kun){
        out.push({text: c, reading: kun.stem, sure: true});
        i++;
        continue;
      }
    }
    /* 3. a run of kanji with nothing between them: on readings, in order */
    let j = i; while(j < s.length && jaIsKanji(s[j])) j++;
    const run = s.slice(i, j);
    if(run.length > 1){
      const parts = [...run].map(ch => { const k = JA_KANJI.get(ch);
        return k && k.on.length ? k.on[0] : null; });
      if(parts.every(Boolean)){
        out.push({text: run, reading: parts.join(''), sure: true});
        i = j; continue;
      }
    }
    /* A single kanji with nothing to go on. Which reading it takes depends on
       what is beside it: a kanji standing between other kanji is part of a
       compound and takes its on reading, and one standing among kana is a
       word of its own and takes its kun. 生 alone is なま; the 生 on the end
       of 高校生 is せい, and reading it なま is how 高校生 becomes こうこうなま. */
    if(info){
      const beside = (i > 0 && jaIsKanji(s[i - 1])) || (i + 1 < s.length && jaIsKanji(s[i + 1]));
      const bare = info.kun.find(k => !k.tail);
      const say = beside
        ? (info.on[0] || (bare ? bare.stem : ''))
        : (bare ? bare.stem : (info.on[0] || ''));
      if(say){ out.push({text: c, reading: say, sure: true}); i++; continue; }
    }
    out.push({text: c, reading: '', sure: false});
    i++;
  }
  return out;
}
/* The whole thing said out in kana, which is what a reading field holds. */
function jaFurigana(text){
  return jaReadings(text).map(p => p.reading || (p.sure ? jaToHira(p.text) : p.text)).join('');
}
/* Whether every kanji in it was accounted for. A reading with a hole in it
   is still worth having; it is not worth pretending to be complete. */
const jaFuriganaSure = text => jaReadings(text).every(p => p.sure);
/* And the same thing as ruby, for showing the reading over the word rather
   than beside it — which is where a reader wants it. */
function jaRubyHTML(text){
  return jaReadings(text).map(p => p.reading && p.reading !== p.text
    ? `<ruby>${esc(p.text)}<rt>${esc(p.reading)}</rt></ruby>`
    : esc(p.text)).join('');
}
