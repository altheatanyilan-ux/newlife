/* ============================================================
   DIVINATION — a mirror, not a fortune

   None of the source books mention tarot. All of them describe the state it
   is for: Hill's "receiving set", Maltz's creative mechanism working below
   consciousness, Hicks' allowing. A symbolic system is a focus object — it
   gives the part of you that already knows something a language to say it in.
   So nothing here predicts anything. It deals a symbol, and then asks you
   what you make of it, and keeps your answer.

   The 78 tarot cards are the Rider-Waite-Smith deck, normalised from Mark
   McElroy's "A Guide to Tarot Meanings" by way of the corpora project
   (dariusk/corpora, data/divination/tarot_interpretations.json) — the
   fallback the specification named, since the first-choice repository has
   moved. Embedded, as everything here is: no network, no API.
   ============================================================ */
const TAROT = [
  {n:"The Fool",s:"major",r:0,k:["freedom","faith","inexperience","innocence"],u:"Freeing yourself from limitation. Expressing joy and youthful vigor. Being open-minded.",v:"Being gullible and naive. Taking unnecessary risks. Failing to be serious when required."},
  {n:"The Magician",s:"major",r:1,k:["capability","empowerment","activity"],u:"Taking appropriate action. Receiving guidance from a higher power. Becoming a channel of divine will.",v:"Inflating your own ego. Abusing talents. Manipulating or deceiving others."},
  {n:"The Papess/High Priestess",s:"major",r:2,k:["intuition","reflection","purity","initiation"],u:"Listening to your feelings and intuitions. Exploring unconventional spirituality. Keeping secrets.",v:"Being aloof. Obsessing on secrets and conspiracies. Rejecting guidance from spirit or intuition."},
  {n:"The Empress",s:"major",r:3,k:["fertility","productivity","ripeness","nurturing"],u:"Nurturing yourself and others. Bearing fruit. Celebrating your body.",v:"Overindulging. Being greedy. Smothering someone with attention."},
  {n:"The Emperor",s:"major",r:4,k:["authority","regulation","direction","structure"],u:"Exercising authority. Defining limits. Directing the flow of work.",v:"Micromanaging. Crushing the creativity of others with a rigid, iron-fisted approach. Insisting on getting your own way."},
  {n:"The Pope/Hierophant",s:"major",r:5,k:["guidance","knowledge","revelation","belief"],u:"Teaching or guiding others. Searching for the truth. Asking for guidance from a higher power.",v:"Using experience as a means of manipulating or misguiding others. Being dogmatic. Favoring tradition over what is expedient or necessary."},
  {n:"The Lovers",s:"major",r:6,k:["love","passion","unity","choice"],u:"Being in love. Showing your love to others. Expressing passion or romantic feelings.",v:"Debilitating passion. Allowing an unhealthy desire for love to motivate destructive behavior. Disrupting unity."},
  {n:"The Chariot",s:"major",r:7,k:["advancement","victory","triumph","success"],u:"Breaking through barriers. Moving forward with confidence and authority. Reaching the pinnacle of success.",v:"Resting on laurels. Riding roughshod over the feelings or expectations of others. Focusing more on past successes than future opportunities."},
  {n:"Strength",s:"major",r:8,k:["discipline","boldness","self-discipline","power","vitality"],u:"Imposing restrictions on yourself for your own benefit. Bringing your passions under the control of reason. Resisting impulses that work against your best interests.",v:"Indulging weakness, even when you know it will damage your health and happiness. Languishing in addiction. Allowing your instincts to tame and conquer you."},
  {n:"The Hermit",s:"major",r:9,k:["solitude","experience","stillness","withdrawal"],u:"Becoming or seeking out a guru. Going on a retreat. Recharging spiritual or creative batteries.",v:"Being a loner. Fearing contact with others. Becoming a know-it-all."},
  {n:"The Wheel",s:"major",r:10,k:["luck","randomness","cycles","karma","fate"],u:"Allowing events to unfold. Seeing the larger pattern in everyday events. Trusting your luck.",v:"Losing money gambling. Refusing to do your part to bring a plan to fruition. Taking a fatalistic approach to life."},
  {n:"Justice",s:"major",r:11,k:["balance","law","fairness","objectivity"],u:"Making an objective decision. Weighing an issue carefully before taking action. Appropriately scaling your reaction to a situation.",v:"Delivering harsh criticism. Obsessing on rules and regulations. Playing by the book even when it is destructive or counterproductive to do so."},
  {n:"The Hanged Man",s:"major",r:12,k:["enlightenment","sacrifice","perspective","suspension","reversals"],u:"Seeing growth opportunities in unpleasant events. Experiencing a dramatic change in personal perspective. Making the best of an unforeseen change in your life or work.",v:"Being untrue to yourself and your values. Refusing to make sacrifices when appropriate. Refusing to adapt to new situations."},
  {n:"Death",s:"major",r:13,k:["ending","conclusion","transition","passage","departure"],u:"Bringing an unpleasant phase of life to an end. Recognizing and celebrating the conclusion of something. Putting bad habits to rest.",v:"Obsessing on death and dying. Refusing to give up old habits or unhealthy relationships. Insisting that everything and everyone should stay the same forever."},
  {n:"Temperance",s:"major",r:14,k:["blending","synthesis","mediation","combination","harmony"],u:"Bringing opposites together. Moderating your actions or emotions. Finding middle ground.",v:"Going to extremes. Disrupting group efforts. Ignoring healthy approaches to life."},
  {n:"The Devil",s:"major",r:15,k:["shadow","materialism","bondage","delusion"],u:"Appreciating the luxuries that life has to offer. Being comfortable in your own skin. Enjoying your sexuality.",v:"Putting excessive emphasis on appearances. Always wanting more. Valuing possessions more than people or relationships."},
  {n:"The Tower",s:"major",r:16,k:["demolition","upheaval","deconstruction","disaster","destruction"],u:"Breaking out of old, confining habits and mindsets. Clearing the way for new growth. Dispelling the influence of an inflated ego.",v:"Clinging to traditions that repress growth. Engaging in willful blindness. Rejecting evidence that change is needed."},
  {n:"The Star",s:"major",r:17,k:["hope","optimism","openness","certainty","faith"],u:"Hoping for the best. Believing good things happen to good people. Seeing events in the best possible light.",v:"Denying unpleasant truths. Denying personal accountability and saying, \"Things just happen!\". Ignoring signs and omens."},
  {n:"The Moon",s:"major",r:18,k:["mystery","fantasy","imagination","dreams","uncertainty"],u:"Enjoying healthy fantasies and daydreams. Using your imagination. Practicing magic or celebrating the magic of everyday life.",v:"Becoming unable to separate fantasy from reality. Suffering from delusions. Losing your appreciation for the fantastic or magical."},
  {n:"The Sun",s:"major",r:19,k:["joy","brilliance","validation","attention","energy"],u:"Seeing things clearly. Experiencing intense joy. Celebrating your own successes.",v:"Being dazzled by your own accomplishments. Becoming absorbed in your own self-image. Feeling rushed and distracted."},
  {n:"Judgement",s:"major",r:20,k:["revival","renewal","resurrection","evaluation","invitation"],u:"Receiving a wake-up call. Discovering a new purpose in life. Becoming totally and completely yourself.",v:"Being weighed in the balances and found wanting. Failing to measure up to a well-defined standard. Being caught goofing off or misbehaving."},
  {n:"The World",s:"major",r:21,k:["wholeness","integration","totality","completeness","fullness"],u:"Having it all. Knowing and loving yourself as completely as possible. Seeing the interconnection of all things and people.",v:"Allowing greed and envy to prevent you from enjoying what you do possess. Failing to see the larger design in ordinary events. Believing that everything that exists can be touched, counted, or measured."},
  {n:"Ace of Wands",s:"wands",r:1,k:["desire","inspiration","vision","creation","invention"],u:"Being inspired. Identifying an important goal. Being given the opportunity to do whatever you want to do.",v:"Failing to take advantage of a great opportunity. Being ineffectual or lazy. Making an inadequate effort."},
  {n:"Two of Wands",s:"wands",r:2,k:["conflict","decision","option","individuality"],u:"Having a choice. Offering or being offered an option. Seeing the value of another person's approach.",v:"Misrepresenting your intentions. Doing one thing while desiring another. Changing course mid-stream for no good reason."},
  {n:"Three of Wands",s:"wands",r:3,k:["implementation","action","exploration"],u:"Putting a plan into motion. Taking that critical first step. Making good things happen.",v:"Procrastinating. Knowing what to do, but refusing to do it. Launching a project without a clear definition of who should do what."},
  {n:"Four of Wands",s:"wands",r:4,k:["celebration","jubilation","community","teamwork","completion"],u:"Sharing in a great celebration. Sharing in a communal sense of achievement and success. Preparing for a party.",v:"Keeping your nose to the grindstone. Recognizing good work by demanding more work. Failing to share in a group celebration."},
  {n:"Five of Wands",s:"wands",r:5,k:["confrontation","disruption","distinction","objection","strife"],u:"Calmly expressing a dissenting opinion. Allowing someone to use his or her own methods to get a job done. Opening the floor for discussion or debate.",v:"Berating others for their ridiculous opinions. Picking fights. Offering destructive criticism."},
  {n:"Six of Wands",s:"wands",r:6,k:["victory","achievement","success","triumph"],u:"Outperforming your peers. Winning a competition. Being recognized as a capable person.",v:"Being a bad winner. Allowing your achievements to inflate your ego. Looking down on people who seem less capable."},
  {n:"Seven of Wands",s:"wands",r:7,k:["bravery","resolve","determination"],u:"Refusing to be silenced through fear or intimidation. Continuing a fight against all odds. Being fierce.",v:"Having a chip on your shoulder. Taking unnecessary risks as a means of proving your fearlessness. Looking for an opportunity to take offense."},
  {n:"Eight of Wands",s:"wands",r:8,k:["speed","swiftness","responsiveness","change"],u:"Taking swift action. Moving forward with a plan as quickly as possible. Energizing yourself.",v:"Giving in to panic. Running in circles and screaming. Insisting things must always stay the same."},
  {n:"Nine of Wands",s:"wands",r:9,k:["toughness","persistence","stamina","loyalty","release"],u:"Sticking with it for the duration. Fulfilling your promises and obligations. Bearing up under incredible duress.",v:"Making yourself a martyr. Abandoning your post. Giving up at the first sign of opposition."},
  {n:"Ten of Wands",s:"wands",r:10,k:["exhaustion","resistance","burden","oppression"],u:"Holding your own in extreme circumstances. Helping others carry their burdens. Coming to the aid of the oppressed.",v:"Taking on more work than you know you can handle. Refusing to say \"No\" when you're already overloaded. Making a habit of working overtime."},
  {n:"Page of Wands",s:"wands",r:11,k:["enthusiasm","eagerness","confidence","validation","affirmation"],u:"Leaping at a new opportunity. Being a cheerleader or ardent advocate for your cause. Being a True Believer.",v:"Basing your entire self-image on what others think. Seizing every new idea that comes your way without question. Habitually discounting input or feedback from others."},
  {n:"Knight of Wands",s:"wands",r:12,k:["boldness","bravado","passion","persuasion","advocacy"],u:"Charging ahead. Making rapid progress. Refusing limits.",v:"Blundering forward with inadequate skill or information. Running roughshod over the feelings of others. Using sex appeal to manipulate others."},
  {n:"Queen of Wands",s:"wands",r:13,k:["attention","attraction","unification","collaboration"],u:"Paying close attention. Helping others focus on the issue at hand. Getting everyone to work together.",v:"Being distracted, or using your charms or skills to distract others from the goal. Calling attention to yourself with negative or unhealthy behaviors. Disrupting group activities as a means of feeding your own ego."},
  {n:"King of Wands",s:"wands",r:14,k:["creativity","ingenuity","achievement","direction"],u:"Putting old things together in new and exciting ways. Coming up with unexpected solutions. Using your experience to solve puzzles and problems.",v:"Using your creativity to get out of honest work. Investing great energy in avoiding responsibility. Boasting about achievements without putting your expertise to practical use."},
  {n:"Ace of Cups",s:"cups",r:1,k:["intuition","spirituality","affection","motivation"],u:"Trusting your feelings. Opening yourself to spirit. Accepting and returning affection.",v:"Hiding your feelings. Spurning an opportunity to love or be loved. Numbing yourself to spiritual yearnings."},
  {n:"Two of Cups",s:"cups",r:2,k:["union","attraction","combination","affection"],u:"Being drawn to someone. Longing for someone or something. Acting on your desires.",v:"Burning bridges. Becoming caught up in unhealthy codependency. Shutting out anyone but your chosen few."},
  {n:"Three of Cups",s:"cups",r:3,k:["celebration","expression","community","friendliness"],u:"Celebrating your feelings or connections with others. Expressing joy through song, dance, or physical affection. Working together with others who share your feelings.",v:"Mistaking giddiness for true affection. Being dominated by manic emotions. Expecting everyone to always feel the same way you do."},
  {n:"Four of Cups",s:"cups",r:4,k:["boredom","listlessness","lethargy","stability","ingratitude"],u:"Maintaining your emotional stability. Refusing to give in to overwhelming emotions. Appreciating what you have and refusing to take it for granted.",v:"Being bored. Daydreaming at the expense of your work. Refusing to be engaged by opportunity."},
  {n:"Five of Cups",s:"cups",r:5,k:["loss","despair","re-evaluation","regret","uncertainty"],u:"Acknowledging loss and moving on. Focusing on how the glass remains \"half-full\". Finding the silver lining in a dark cloud.",v:"Wallowing in unhealthy grief or self-pity. Refusing to move on and let go. Clinging to the past."},
  {n:"Six of Cups",s:"cups",r:6,k:["charity","sharing","sacrifice","cooperation","fairness"],u:"Donating your time and talents to others. Taking satisfaction in knowing how your efforts will aid others. Creating a \"win-win\" scenario.",v:"Linking your sense of self-worth to the appraisals of others. Striving to appear more needy than you really are. Taking undeserved or unmerited charity."},
  {n:"Seven of Cups",s:"cups",r:7,k:["imagination","dreams","illusions","goals"],u:"Motivating yourself with images of future success. Using visualization to encourage progress. Taking an imaginative or creative approach to problem solving.",v:"Obsessing on imaginary fears or uncertain consequences. Giving in to emotional or political terrorism. Spending more time dreaming than working."},
  {n:"Eight of Cups",s:"cups",r:8,k:["longing","dissatisfaction","quest","departure","withdrawal"],u:"Wanting something better. Blazing your own trail. Realizing there must be more to life.",v:"Being implacable. Finding fault. Nitpicking."},
  {n:"Nine of Cups",s:"cups",r:9,k:["satisfaction","sensuality","luxury","pleasure"],u:"Being delighted with your own achievements. Recognizing your own talents and abilities. Reveling in the good things life has to offer.",v:"Being smug. Satisfying yourself at the expense of others. Being selfish."},
  {n:"Ten of Cups",s:"cups",r:10,k:["joy","fulfillment","overwhelming emotion","giddiness"],u:"Having more than you ever dreamed. Being deeply thankful for all you've been given. Recognizing the Hand of God in the gifts the Universe brings your way.",v:"Comparing your achievements or relationships to unrealistic fantasy standards. Experiencing emotions so intense they blunt your ability to cope with reality. Feeling overwhelmed."},
  {n:"Page of Cups",s:"cups",r:11,k:["enthusiasm","first impressions","romanticism","superficiality"],u:"Showing your emotions freely. Throwing yourself into romance. Nursing a secret crush.",v:"Mistaking a crush for true love. Reading romantic intention into innocent action. Frantically trying to impress others."},
  {n:"Knight of Cups",s:"cups",r:12,k:["fervor","zeal","moodiness","illumination"],u:"Being deeply committed to a cause. Giving in to strong emotions, from excitement to depression. Acting on intuition alone.",v:"Becoming a fanatic. Rejecting information that suggests your intuitions are misguided. Allowing your emotions to control you."},
  {n:"Queen of Cups",s:"cups",r:13,k:["insightfulness","spirituality","compassion","empathy","instinct"],u:"Allowing yourself to be moved by the plight of others. Feeling strong emotions. Possessing unusual sympathy or empathy.",v:"Becoming so caught up in matters of Spirit, you become detached from the world. Allowing empathy to disable you (instead of inspire action). Using psychic abilities to wield covert influence."},
  {n:"King of Cups",s:"cups",r:14,k:["wisdom","diplomacy","restraint","composure"],u:"Keeping a stiff upper lip. Being brave and clear in the face of adverse circumstances. Sharing experience as a way of comforting others.",v:"Allowing yourself to become rigid and unemotional. Making unfair decisions based on a hidden agenda. Making decisions without regard for their emotional impact on others."},
  {n:"Ace of Swords",s:"swords",r:1,k:["logic","objectivity","intellect","choice"],u:"Making objective decisions. Applying logic. Reasoning your way out of a difficult situation.",v:"Applying ruthless or twisted logic. Gloating over your own superior intellect. Using quick thinking to deceive or confuse others."},
  {n:"Two of Swords",s:"swords",r:2,k:["denial","debate","impasse","truce"],u:"Refusing to make a decision without getting the facts. Exploring both sides of an argument. Arguing passionately for what you believe in.",v:"Rejecting evidence that conflicts with dearly-held beliefs. Arguing with others just for the sake of doing so. Nit-picking."},
  {n:"Three of Swords",s:"swords",r:3,k:["variance","difference","dissatisfaction","heartache","rejection"],u:"Being brave enough to see things as they really are. Exercising your critical eye. Being your own best critic.",v:"Wallowing in despair. Allowing yourself to be completely crushed by the thoughts, words, or deeds of another. Judging yourself too harshly."},
  {n:"Four of Swords",s:"swords",r:4,k:["meditation","contemplation","perspective","mindset"],u:"Thinking over your plans before putting them into action. Pausing to meditate or clear your mind. Taking time to understand someone or something before criticizing it.",v:"Failing to think things through. Mistaking procrastination for thoughtfulness. Adopting a point of view and refusing to reconsider your conclusions, even when presented with refuting evidence."},
  {n:"Five of Swords",s:"swords",r:5,k:["selfishness","hostility","irrationality","self-preservation"],u:"Acting in your own best interest. Choosing to stand up for yourself. Not backing down from disagreement and discord.",v:"Taking advantage of others. Intimidating others. Acting in an unethical manner."},
  {n:"Six of Swords",s:"swords",r:6,k:["adaptation","adjustments","science","travel"],u:"Making the best of a bad situation. Recovering from defeat. Resetting expectations.",v:"Refusing to accept that things have changed. Playing the victim. Rejecting the idea that your actions have consequences."},
  {n:"Seven of Swords",s:"swords",r:7,k:["dishonesty","presumption","sneakiness","assumptions"],u:"Refusing to do something dishonest, even when there's no chance of ever being caught. Handling a difficult situation with finesse. Pointing out assumptions.",v:"Stealing or lying. Doing whatever you can get away with, simply because you can. Looking for a way around consequences."},
  {n:"Eight of Swords",s:"swords",r:8,k:["restriction","limitation","confinement","helplessness"],u:"Honoring limits. Respecting the rules. Deciding to go on a diet for your health's sake.",v:"Feeling trapped. Being lost in a maze of rules and regulations. Giving in to despair."},
  {n:"Nine of Swords",s:"swords",r:9,k:["remorse","worry","distraught","conclusion"],u:"Refusing to worry about what you cannot control. Rejecting anxiety. Judging your own performance with kindness and gentleness.",v:"Torturing yourself with regrets. Second-guessing your every move. Beating yourself up for your mistakes."},
  {n:"Ten of Swords",s:"swords",r:10,k:["exhaustion","ruin","disaster","stamina","obsession"],u:"Seeing the signs that you've reached your limits. Paying attention to what your body is trying to tell you. Giving in to the need for rest and renewal.",v:"Accepting defeat prematurely. Driving yourself to total exhaustion, especially mentally. Experiencing a mental breakdown."},
  {n:"Page of Swords",s:"swords",r:11,k:["student","apprentice","scholarship","information"],u:"Pursuing a course of study. Asking good questions. Investing time in study and practice.",v:"Pretending to knowledge or sophistication you do not possess. Cheating on an exam. Feigning interest as a way of gaining favor."},
  {n:"Knight of Swords",s:"swords",r:12,k:["bluntness","intelligence","incisiveness","investigation"],u:"Speaking your mind. Making your opinions known. Offering constructive criticism.",v:"Stating your opinions as fact. Picking fights. Starting arguments."},
  {n:"Queen of Swords",s:"swords",r:13,k:["grace","skill","wit","charm","aptitude"],u:"Exercising tact or using diplomacy. Defusing a tense situation. Knowing what to say and how to say it.",v:"Knowing exactly what to say to destroy another person. Withholding critical information. Using a barbed tongue to upset others."},
  {n:"King of Swords",s:"swords",r:14,k:["genius","expertise","decision","verdict"],u:"Expressing yourself with firmness and authority. Rendering a final decision. Consulting an expert.",v:"Insisting on having the last word. Flaunting your intellectual capability. Talking \"over the heads\" of others."},
  {n:"Ace of Pentacles",s:"pentacles",r:1,k:["health","wealth","practicality","receiving"],u:"Outlining a plan for achieving prosperity. Becoming aware of opportunities to improve income or health. Realizing you have everything you need.",v:"Indulging in relentless consumerism. Wanting more, no matter how much you have. Obsessing on your account balance."},
  {n:"Two of Pentacles",s:"pentacles",r:2,k:["evaluation","decision","budgeting","diagnosis"],u:"Weighing options. Comparing prices. Determining the value of one option over another.",v:"Engaging in endless price comparison. Putting off a buying decision for fear of finding a slightly better value later on. Buying something without regard for value."},
  {n:"Three of Pentacles",s:"pentacles",r:3,k:["expression","production","work","contribution"],u:"Finishing a project. Setting and meeting standards. Performing according to specifications.",v:"Pandering to the tastes of others. Failing to deliver what you've promised. Not delivering your best work unless closely supervised."},
  {n:"Four of Pentacles",s:"pentacles",r:4,k:["protection","conservation","preservation","safety"],u:"Saving for a rainy day. Fasting as part of a spiritual practice. Dieting in an effort to improve your body.",v:"Being stingy. Refusing to spend money that needs to be spent. Withholding sex from your partner."},
  {n:"Five of Pentacles",s:"pentacles",r:5,k:["poverty","destitution","need","crisis"],u:"Recognizing your needs and taking action to fulfill them. Doing as much as you can do with what little you have. Admitting you need help.",v:"Exaggerating your financial or physical needs. Adopting a poverty mentality. Refusing to support yourself."},
  {n:"Six of Pentacles",s:"pentacles",r:6,k:["charity","fairness","cooperation","sharing"],u:"Giving time, money, or effort to a charity. Taking part in a group effort. Lending your resources to others without expecting anything in return.",v:"Making a loan as a means of gaining control over someone. Using charitable acts to draw attention to yourself. Dividing work or resources unfairly."},
  {n:"Seven of Pentacles",s:"pentacles",r:7,k:["assessment","evaluation","re-evaluation","reflection"],u:"Measuring progress toward your goal. Looking at results with an eye toward improving performance. Asking, \"How happy am I?\".",v:"Becoming distracted by melancholy thoughts. Longing for \"the good old days\". Beating yourself up over lost opportunities."},
  {n:"Eight of Pentacles",s:"pentacles",r:8,k:["effort","work diligence","skill"],u:"Doing your best. Bringing enthusiasm and zeal to your work. Making an effort to be the best you can be.",v:"Working yourself to death. Doing a half-hearted or sloppy job. Continuing in a job you hate."},
  {n:"Nine of Pentacles",s:"pentacles",r:9,k:["training","discipline","confidence","enough"],u:"Investing time in learning or teaching a difficult task. Restraining yourself from physical or financial extremes. Making sacrifices as a way of achieving larger goals.",v:"Being assigned to a task without being trained to perform it. Pursuing a position for which you are not qualified. Disregarding requirements."},
  {n:"Ten of Pentacles",s:"pentacles",r:10,k:["wealth","abundance","acquisition","greed"],u:"Celebrating your physical and financial blessings. Realizing how lucky or how blessed you are. Being satisfied with your physical and financial achievements.",v:"Spending all of your money on extravagant gifts and possessions. Trying too hard to impress others with your wealth or physique. Giving an inappropriately expensive gift as a means of currying favor."},
  {n:"Page of Pentacles",s:"pentacles",r:11,k:["practicality","prosperity","learning","growth","adolescence"],u:"Learning the value of a dollar. Starting a savings plan. Taking the first steps toward getting out of debt.",v:"Trying to appear healthier or wealthier than you really are. Spending money carelessly. Living strictly for today, with no thought of tomorrow."},
  {n:"Knight of Pentacles",s:"pentacles",r:12,k:["caution","focus","realism","invention"],u:"Spending money wisely. Saving for a rainy day. Paying close attention to physical or financial details.",v:"Throwing caution to the four winds. Spending without regard for consequence. Spending on luxury when necessities are lacking."},
  {n:"Queen of Pentacles",s:"pentacles",r:13,k:["luxury","comfort","resourcefulness","generosity","prosperity"],u:"Appreciating fine food, fine wine, beautiful art, beautiful bodies, or any of the better things in life. Reveling in healthy sexuality. Treating yourself.",v:"Indulging in gluttony or greediness. Becoming insatiable. Blunting the impact of treats by indulging in them too often."},
  {n:"King of Pentacles",s:"pentacles",r:14,k:["stability","dependability","confidence","intervention"],u:"Becoming debt-free. Having more than enough to get by. Making contributions to a savings plan.",v:"Becoming so conservative you resist all change on principle alone. Ignoring innovations in the name of preserving tradition. Being smug or cocky."}
];

/* The 64 hexagrams of the I Ching, in King Wen order. Each carries its
   binary from the bottom line up (1 = yang, 0 = yin), its Chinese name and
   its English one, the gist of the Judgment, the Image, and a few words to
   hold it by. Written out here rather than fetched: nothing in this house
   goes to the network. */
const ICHING = [
  {i:1,  b:'111111', c:'乾 Qián',   n:'The Creative',            j:'Sublime success. Furthering through perseverance.',                      m:'The movement of heaven is full of power. So the superior person makes themselves strong and untiring.', k:['initiative','force','heaven','beginning']},
  {i:2,  b:'000000', c:'坤 Kūn',    n:'The Receptive',           j:'Success through devotion. Find friends in the west and south.',          m:'The earth\'s condition is receptive devotion. So the superior person carries the outer world.', k:['yielding','support','earth','patience']},
  {i:3,  b:'100010', c:'屯 Zhūn',   n:'Difficulty at the Beginning', j:'Perseverance furthers. Do not act; appoint helpers.',                m:'Clouds and thunder. So the superior person brings order out of confusion.', k:['struggle','sprouting','chaos','help']},
  {i:4,  b:'010001', c:'蒙 Méng',   n:'Youthful Folly',          j:'It is not I who seek the young fool; the young fool seeks me.',          m:'A spring wells up at the foot of the mountain. So the superior person fosters character by thoroughness.', k:['inexperience','teaching','asking','humility']},
  {i:5,  b:'111010', c:'需 Xū',     n:'Waiting',                 j:'If you are sincere, light and success. Crossing the great water furthers.', m:'Clouds rise up to heaven. So the superior person eats and drinks and is joyous.', k:['patience','nourishment','timing','trust']},
  {i:6,  b:'010111', c:'訟 Sòng',   n:'Conflict',                j:'You are sincere and obstructed. Halfway brings good fortune; going through to the end brings misfortune.', m:'Heaven and water go opposite ways. So the superior person considers the beginning of every affair.', k:['dispute','opposition','caution','retreat']},
  {i:7,  b:'010000', c:'師 Shī',    n:'The Army',                j:'Perseverance and a strong leader bring good fortune and no blame.',      m:'In the middle of the earth is water. So the superior person increases their masses by generosity.', k:['discipline','organisation','leadership','order']},
  {i:8,  b:'000010', c:'比 Bǐ',     n:'Holding Together',        j:'Inquire of the oracle again. Those who come too late meet with misfortune.', m:'On the earth is water. So the kings of antiquity bestowed the different states.', k:['union','alliance','belonging','loyalty']},
  {i:9,  b:'111011', c:'小畜 Xiǎo Xù', n:'The Taming Power of the Small', j:'Dense clouds, no rain from our western region.',                  m:'The wind drives across heaven. So the superior person refines the outward aspect of their nature.', k:['restraint','small steps','gathering','not yet']},
  {i:10, b:'110111', c:'履 Lǚ',     n:'Treading',                j:'Treading upon the tail of the tiger. It does not bite. Success.',        m:'Heaven above, the lake below. So the superior person discriminates between high and low.', k:['conduct','care','courtesy','danger']},
  {i:11, b:'111000', c:'泰 Tài',    n:'Peace',                   j:'The small departs, the great approaches. Good fortune. Success.',        m:'Heaven and earth unite. So the ruler divides and completes the course of heaven and earth.', k:['harmony','flourishing','flow','prosperity']},
  {i:12, b:'000111', c:'否 Pǐ',     n:'Standstill',              j:'Evil people do not further the perseverance of the superior person.',    m:'Heaven and earth do not unite. So the superior person falls back on inner worth.', k:['stagnation','blockage','withdrawal','waiting']},
  {i:13, b:'101111', c:'同人 Tóng Rén', n:'Fellowship with Others', j:'Fellowship in the open. Success. Crossing the great water furthers.',  m:'Heaven together with fire. So the superior person organises the clans and makes distinctions.', k:['community','shared aim','openness','kinship']},
  {i:14, b:'111101', c:'大有 Dà Yǒu', n:'Possession in Great Measure', j:'Supreme success.',                                                 m:'Fire in heaven above. So the superior person curbs evil and furthers good.', k:['abundance','clarity','responsibility','wealth']},
  {i:15, b:'001000', c:'謙 Qiān',   n:'Modesty',                 j:'Success. The superior person carries things through.',                   m:'Within the earth, a mountain. So the superior person reduces that which is too much.', k:['humility','balance','restraint','grace']},
  {i:16, b:'000100', c:'豫 Yù',     n:'Enthusiasm',              j:'It furthers one to install helpers and to set armies marching.',         m:'Thunder comes resounding out of the earth. So the ancient kings made music.', k:['momentum','readiness','music','rousing']},
  {i:17, b:'100110', c:'隨 Suí',    n:'Following',               j:'Supreme success. Perseverance furthers. No blame.',                      m:'Thunder in the middle of the lake. So the superior person goes indoors at nightfall for rest.', k:['adapting','following','rest','yielding']},
  {i:18, b:'011001', c:'蠱 Gǔ',     n:'Work on What Has Been Spoiled', j:'Supreme success. Three days before the starting point, three days after.', m:'The wind blows low on the mountain. So the superior person stirs up the people.', k:['repair','decay','correction','inheritance']},
  {i:19, b:'110000', c:'臨 Lín',    n:'Approach',                j:'Supreme success. In the eighth month there will be misfortune.',         m:'The earth above the lake. So the superior person is inexhaustible in their will to teach.', k:['drawing near','growth','opportunity','a season']},
  {i:20, b:'000011', c:'觀 Guān',   n:'Contemplation',           j:'The ablution has been made, but not yet the offering.',                  m:'The wind blows over the earth. So the kings of old visited the regions of the world.', k:['seeing','perspective','example','review']},
  {i:21, b:'100101', c:'噬嗑 Shì Kè', n:'Biting Through',        j:'Success. It furthers one to let justice be administered.',               m:'Thunder and lightning. So the kings of former times made firm the laws.', k:['decision','obstacle','justice','directness']},
  {i:22, b:'101001', c:'賁 Bì',     n:'Grace',                   j:'Success in small matters. It furthers one to undertake something.',      m:'Fire at the foot of the mountain. So the superior person clears current affairs.', k:['form','beauty','surface','small matters']},
  {i:23, b:'000001', c:'剝 Bō',     n:'Splitting Apart',         j:'It does not further one to go anywhere.',                                m:'The mountain rests on the earth. So those above can ensure their position by giving to those below.', k:['collapse','erosion','letting go','waiting']},
  {i:24, b:'100000', c:'復 Fù',     n:'Return',                  j:'Success. Going out and coming in without error. On the seventh day comes return.', m:'Thunder within the earth. So the ancient kings closed the passes at the solstice.', k:['turning point','renewal','return','solstice']},
  {i:25, b:'100111', c:'無妄 Wú Wàng', n:'Innocence',            j:'Supreme success. If someone is not as they should be, they have misfortune.', m:'Under heaven thunder rolls. So the ancient kings nourished all beings.', k:['spontaneity','the unexpected','honesty','no calculation']},
  {i:26, b:'111001', c:'大畜 Dà Xù', n:'The Taming Power of the Great', j:'Perseverance furthers. Not eating at home brings good fortune.',   m:'Heaven within the mountain. So the superior person acquaints themselves with many sayings of antiquity.', k:['stored power','holding firm','study','restraint']},
  {i:27, b:'100001', c:'頤 Yí',     n:'Corners of the Mouth',    j:'Perseverance brings good fortune. Pay heed to what you give nourishment to.', m:'At the foot of the mountain, thunder. So the superior person is careful of their words.', k:['nourishment','words','what you feed','care']},
  {i:28, b:'011110', c:'大過 Dà Guò', n:'Preponderance of the Great', j:'The ridgepole sags to the breaking point. It furthers one to have somewhere to go.', m:'The lake rises above the trees. So the superior person stands alone and is unconcerned.', k:['excess','strain','crisis','extraordinary times']},
  {i:29, b:'010010', c:'坎 Kǎn',    n:'The Abysmal',             j:'If you are sincere, you have success in your heart, and whatever you do succeeds.', m:'Water flows on uninterruptedly. So the superior person walks in lasting virtue.', k:['danger','depth','repetition','flow']},
  {i:30, b:'101101', c:'離 Lí',     n:'The Clinging Fire',       j:'Perseverance furthers. Care of the cow brings good fortune.',            m:'That which is bright rises twice. So the great person illuminates the four quarters.', k:['clarity','attachment','brightness','dependence']},
  {i:31, b:'001110', c:'咸 Xián',   n:'Influence',               j:'Success. Perseverance furthers. Taking a maiden to wife brings good fortune.', m:'A lake on the mountain. So the superior person encourages people to approach by their readiness to receive them.', k:['attraction','courtship','feeling','openness']},
  {i:32, b:'011100', c:'恆 Héng',   n:'Duration',                j:'Success. No blame. Perseverance furthers. It furthers one to have somewhere to go.', m:'Thunder and wind. So the superior person stands firm and does not change direction.', k:['endurance','constancy','marriage','the long run']},
  {i:33, b:'001111', c:'遯 Dùn',    n:'Retreat',                 j:'Success. In what is small, perseverance furthers.',                      m:'Mountain under heaven. So the superior person keeps the inferior at a distance without anger.', k:['withdrawal','distance','timing','dignity']},
  {i:34, b:'111100', c:'大壯 Dà Zhuàng', n:'The Power of the Great', j:'Perseverance furthers.',                                            m:'Thunder in heaven above. So the superior person does not tread upon paths that do not accord with order.', k:['strength','momentum','restraint','right use']},
  {i:35, b:'000101', c:'晉 Jìn',    n:'Progress',                j:'A powerful prince honoured with horses in large numbers.',               m:'The sun rises over the earth. So the superior person brightens their bright virtue.', k:['advance','recognition','daylight','ease']},
  {i:36, b:'101000', c:'明夷 Míng Yí', n:'Darkening of the Light', j:'In adversity it furthers one to be persevering.',                      m:'The light has sunk into the earth. So the superior person veils their light, yet still shines.', k:['concealment','adversity','endurance','inner light']},
  {i:37, b:'101011', c:'家人 Jiā Rén', n:'The Family',           j:'The perseverance of the woman furthers.',                                m:'Wind comes forth from fire. So the superior person has substance in their words.', k:['household','roles','order','belonging']},
  {i:38, b:'110101', c:'睽 Kuí',    n:'Opposition',              j:'In small matters, good fortune.',                                        m:'Above, fire; below, the lake. So amid all fellowship the superior person retains their individuality.', k:['difference','misunderstanding','small steps','individuality']},
  {i:39, b:'001010', c:'蹇 Jiǎn',   n:'Obstruction',             j:'The south-west furthers. The north-east does not. Seeing the great person furthers.', m:'Water on the mountain. So the superior person turns their attention to themselves.', k:['obstacle','difficulty','turning inward','help']},
  {i:40, b:'010100', c:'解 Xiè',    n:'Deliverance',             j:'The south-west furthers. If there is nowhere to go, return brings good fortune.', m:'Thunder and rain set in. So the superior person pardons mistakes and forgives misdeeds.', k:['release','relief','forgiveness','after the storm']},
  {i:41, b:'110001', c:'損 Sǔn',    n:'Decrease',                j:'Decrease combined with sincerity brings about supreme good fortune.',    m:'At the foot of the mountain, the lake. So the superior person controls their anger and restrains their instincts.', k:['sacrifice','simplicity','giving up','less']},
  {i:42, b:'100011', c:'益 Yì',     n:'Increase',                j:'It furthers one to undertake something. It furthers one to cross the great water.', m:'Wind and thunder. So the superior person, if they see good, imitates it.', k:['gain','generosity','opportunity','moving']},
  {i:43, b:'111110', c:'夬 Guài',   n:'Breakthrough',            j:'One must resolutely make the matter known at the court of the king.',    m:'The lake has risen up to heaven. So the superior person dispenses riches downward.', k:['resolution','declaring','risk','clearing out']},
  {i:44, b:'011111', c:'姤 Gòu',    n:'Coming to Meet',          j:'The maiden is powerful. One should not marry such a maiden.',            m:'Under heaven, wind. So the prince acts when disseminating their commands.', k:['encounter','temptation','the small returning','caution']},
  {i:45, b:'000110', c:'萃 Cuì',    n:'Gathering Together',      j:'Success. The king approaches his temple. Seeing the great person furthers.', m:'Over the earth, the lake. So the superior person renews their weapons to meet the unforeseen.', k:['assembly','centre','ritual','preparation']},
  {i:46, b:'011000', c:'升 Shēng',  n:'Pushing Upward',          j:'Supreme success. One must see the great person. Departing toward the south brings good fortune.', m:'Within the earth, wood grows. So the superior person heaps up small things to achieve something high.', k:['ascent','effort','small steps','growth']},
  {i:47, b:'010110', c:'困 Kùn',    n:'Oppression',              j:'Success. Perseverance. The great person brings about good fortune. No blame.', m:'There is no water in the lake. So the superior person stakes their life on following their will.', k:['exhaustion','constraint','endurance','few words']},
  {i:48, b:'011010', c:'井 Jǐng',   n:'The Well',                j:'The town may be changed, but the well cannot be changed.',               m:'Water over wood. So the superior person encourages the people at their work.', k:['source','the unchanging','depth','provision']},
  {i:49, b:'101110', c:'革 Gé',     n:'Revolution',              j:'On your own day you are believed. Supreme success. Remorse disappears.',  m:'Fire in the lake. So the superior person sets the calendar in order.', k:['change','moulting','timing','overthrow']},
  {i:50, b:'011101', c:'鼎 Dǐng',   n:'The Cauldron',            j:'Supreme good fortune. Success.',                                         m:'Fire over wood. So the superior person consolidates their fate by making their position correct.', k:['transformation','nourishment','vessel','culture']},
  {i:51, b:'100100', c:'震 Zhèn',   n:'The Arousing Thunder',    j:'Shock brings success. Shock comes — oh, oh! Laughing words — ha, ha!',   m:'Thunder repeated. So the superior person sets their life in order and examines themselves.', k:['shock','awakening','fear','then laughter']},
  {i:52, b:'001001', c:'艮 Gèn',    n:'Keeping Still',           j:'Keeping the back still so that one no longer feels the body. No blame.', m:'Mountains standing close together. So the superior person does not permit their thoughts to go beyond their situation.', k:['stillness','meditation','stopping','the mountain']},
  {i:53, b:'001011', c:'漸 Jiàn',   n:'Development',             j:'The maiden is given in marriage. Good fortune. Perseverance furthers.',  m:'On the mountain, a tree. So the superior person abides in dignity and virtue.', k:['gradual progress','patience','stages','the right order']},
  {i:54, b:'110100', c:'歸妹 Guī Mèi', n:'The Marrying Maiden',  j:'Undertakings bring misfortune. Nothing that would further.',             m:'Thunder over the lake. So the superior person understands the transitory in the light of the eternity of the end.', k:['a subordinate place','impulse','tact','waiting']},
  {i:55, b:'101100', c:'豐 Fēng',   n:'Abundance',               j:'Success. Be not sad. Be like the sun at midday.',                        m:'Thunder and lightning both come. So the superior person decides lawsuits and carries out punishments.', k:['fullness','zenith','clarity','the turn after']},
  {i:56, b:'001101', c:'旅 Lǚ',     n:'The Wanderer',            j:'Success through smallness. Perseverance brings good fortune to the wanderer.', m:'Fire on the mountain. So the superior person is clear-minded and cautious in imposing penalties.', k:['travel','impermanence','strangeness','discretion']},
  {i:57, b:'011011', c:'巽 Xùn',    n:'The Gentle Wind',         j:'Success through what is small. It furthers one to see the great person.', m:'Winds following one upon the other. So the superior person spreads their commands abroad.', k:['penetration','gentleness','influence','persistence']},
  {i:58, b:'110110', c:'兌 Duì',    n:'The Joyous Lake',         j:'Success. Perseverance is favourable.',                                   m:'Lakes resting one on the other. So the superior person joins with friends for discussion and practice.', k:['joy','openness','conversation','pleasure']},
  {i:59, b:'010011', c:'渙 Huàn',   n:'Dispersion',              j:'Success. The king approaches his temple. Crossing the great water furthers.', m:'The wind drives over the water. So the kings of old sacrificed to the Lord.', k:['dissolving','scattering','rigidity melting','reunion']},
  {i:60, b:'110010', c:'節 Jié',    n:'Limitation',              j:'Success. Galling limitation must not be persevered in.',                 m:'Water over the lake. So the superior person creates number and measure.', k:['boundaries','measure','discipline','enough']},
  {i:61, b:'110011', c:'中孚 Zhōng Fú', n:'Inner Truth',         j:'Pigs and fishes. Good fortune. Crossing the great water furthers.',      m:'Wind over the lake. So the superior person discusses criminal cases in order to delay executions.', k:['sincerity','trust','reaching','the centre']},
  {i:62, b:'001100', c:'小過 Xiǎo Guò', n:'Preponderance of the Small', j:'Success. The flying bird brings the message: it is not well to strive upward.', m:'Thunder on the mountain. So the superior person is exceedingly humble in their conduct.', k:['small things','humility','detail','not the great']},
  {i:63, b:'101010', c:'既濟 Jì Jì', n:'After Completion',       j:'Success in small matters. Good fortune at the beginning, disorder at the end.', m:'Water over fire. So the superior person takes thought of misfortune and arms against it.', k:['completion','order','the turn','vigilance']},
  {i:64, b:'010101', c:'未濟 Wèi Jì', n:'Before Completion',     j:'Success. But if the little fox gets its tail wet, there is nothing that would further.', m:'Fire over water. So the superior person is careful in the differentiation of things.', k:['almost there','transition','care','not yet']},
];

/* Three oracle decks — short, plain cards for a quick draw. Not a tarot: an
   oracle deck has no fixed structure, which is the point of it. */
const ORACLE_DECKS = [
  {id:'inner', name:'Inner Weather', cards:[
    ['Rest','The work is not the problem. You are tired.'],
    ['Begin badly','A poor first attempt outranks a perfect intention.'],
    ['Ask','Someone already knows the thing you are stuck on.'],
    ['Less','Take something out. Then take something else out.'],
    ['Wait a day','This does not need answering today.'],
    ['Say it plainly','The complicated version is a way of not deciding.'],
    ['Go outside','The answer is not in this room.'],
    ['Finish one','Two half-things weigh more than one whole one.'],
    ['Tell the truth','Especially the small one you have been rounding off.'],
    ['Enough','You have already done the thing you are about to talk yourself out of having done.'],
    ['Let it be ordinary','Not every day is for the important work.'],
    ['Return','The thing you abandoned is still good.'],
  ]},
  {id:'thresh', name:'Thresholds', cards:[
    ['The door','Something is open that will not stay open.'],
    ['The bridge','You are between. That is a place, not a failure.'],
    ['The hinge','A small decision is carrying a large one.'],
    ['The key','You have it. You are looking at the wrong lock.'],
    ['The road back','Returning is allowed and is not the same as failing.'],
    ['The long way','The direct route is not available. Take the other one.'],
    ['The gate','Someone is deciding whether to let you through. It is you.'],
    ['The threshold','Stand in it a moment before you cross.'],
    ['The window','You can see it but not reach it yet. Look longer.'],
    ['The stair','One at a time is the only speed there is.'],
  ]},
  {id:'elem', name:'Elements', cards:[
    ['Fire','What wants doing now, before the wanting cools.'],
    ['Water','What you feel about it, which you have not said.'],
    ['Air','The thought you keep having and keep not writing down.'],
    ['Earth','The practical thing. Money, sleep, food, the body.'],
    ['Wood','Growth that is slow and is happening anyway.'],
    ['Metal','What needs cutting away.'],
    ['Stone','What will still be here in ten years.'],
    ['Mist','You do not have enough information. Say so.'],
  ]},
];

/* The five spreads that used to be here are the twenty in
   16-divination-spreads.js, which also keeps their old ids working. */
const SUIT_COLOR = {major:'#8f7bb0', wands:'#b4462f', cups:'#4b7d9c', swords:'#c9a84c', pentacles:'#5f8d49'};
const SUIT_GLYPH = {major:'✦', wands:'🜂', cups:'🜄', swords:'🜁', pentacles:'🜃'};
const SUIT_ELEM  = {major:'', wands:'Fire', cups:'Water', swords:'Air', pentacles:'Earth'};

/* ---------- drawing ---------- */
/* Reversals are a choice: some readers use them and some do not, and a
   deck read upright only is not a lesser reading. `rev` is whether this
   deal allows them at all; the 30% is unchanged when it does. */
function tarotDraw(n, rev){
  if(rev === undefined) rev = divPrefs().reversals;
  /* a real shuffle: take from a copy of the deck so no card comes up twice */
  const deck = TAROT.slice();
  const out = [];
  for(let i = 0; i < n && deck.length; i++){
    const at = Math.floor(Math.random() * deck.length);
    const card = deck.splice(at, 1)[0];
    out.push({card: TAROT.indexOf(card), rev: rev ? Math.random() < .3 : false});
  }
  return out;
}
function oracleDraw(deckId, n){
  const deck = ORACLE_DECKS.find(d => d.id === deckId) || ORACLE_DECKS[0];
  const pool = deck.cards.map((_, i) => i);
  const out = [];
  for(let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
/* Three coins, six times, bottom line first. Two heads and a tail is a yang
   line; two tails and a head is yin; three of a kind is a moving line, which
   is the whole reason the coin method is worth doing rather than picking a
   hexagram out of a hat. */
function ichingCast(){
  const lines = [];
  for(let i = 0; i < 6; i++){
    const coins = [0, 0, 0].map(() => Math.random() < .5 ? 2 : 3);
    const total = coins[0] + coins[1] + coins[2];     /* 6, 7, 8 or 9 */
    lines.push({v: total % 2 ? 1 : 0, moving: total === 6 || total === 9, total, coins});
  }
  return lines;
}
const ichingBinary = lines => lines.map(l => l.v).join('');
function ichingLookup(bin){ return ICHING.find(h => h.b === bin) || ICHING[0]; }
function ichingRelating(lines){
  /* the moving lines turn into their opposite, giving the second hexagram —
     what the situation is becoming */
  if(!lines.some(l => l.moving)) return null;
  return ichingLookup(lines.map(l => l.moving ? (l.v ? 0 : 1) : l.v).join(''));
}

/* ---------- reading, and keeping the reading ----------
   A reading is a journal entry of type `divination`, so it lives in the
   Lived Record with everything else: searchable, taggable, and picked up by
   the Review. What is kept is the deal and what you made of it. */
function divinationSave(rec){
  const e = {id:uid(), type:'divination', title:rec.title, body:rec.reading || '',
    occurredAt:today(), createdAt:new Date().toISOString(), media:[],
    links:{stages:[],substages:[],threads:[],values:[],visions:[],skills:[],projects:rec.projectId?[rec.projectId]:[],people:[]},
    people:[], places:[], emotions:[], tags:['divination', rec.system], confidence:'',
    extra:{divination:{system:rec.system, question:rec.question || '', spread:rec.spread || '',
      cards:rec.cards || [], lines:rec.lines || null, hexagram:rec.hexagram || null,
      /* a cast keeps where every charm landed, because the positions ARE the
         reading — a list of which charms came up would be a different and
         much poorer thing to come back to */
      charms:rec.charms || null,
      /* which way it was asked, and what each toss actually was — the two
         methods do not have the same distribution, so a reading that does
         not say which one it came from cannot be read back properly */
      method:rec.method || null, tosses:rec.tosses || null,
      relating:rec.relating || null, deck:rec.deck || '', revisit: !!rec.revisit,
      /* where the cards were: dealt here, or laid out on a real table and
         typed in afterwards. Everything else about the two is identical. */
      source: rec.source === 'physical' ? 'physical' : 'digital'}}};
  S.entries.push(e); saveNow();
  /* a reading kept because you need to keep hearing it, rather than because
     it happened */
  if(rec.pin && typeof setEntryPinned === 'function') setEntryPinned(e.id, true);
  return e;
}
const divinationOf = e => e?.extra?.divination || null;
/* the one-line summary a reading shows in the journal list, before it is opened */
function divinationLine(e){
  const d = divinationOf(e); if(!d) return '';
  if(d.system === 'iching') return `${d.hexagram ? '#' + d.hexagram.i + ' ' + d.hexagram.n : ''}${d.relating ? ' → #' + d.relating.i + ' ' + d.relating.n : ''}`;
  if(d.system === 'oracle') return (d.cards || []).map(c => c.name).join(' · ');
  if(d.system === 'charms'){
    const a = castAnalyse(d.charms || []);
    return (a.sig ? a.sig.charm.name + ' at the centre · ' : '')
      + a.readable.length + ' read' + (a.hidden.length ? `, ${a.hidden.length} face down` : '');
  }
  return (d.cards || []).map(c => (TAROT[c.card]?.n || '') + (c.rev ? ' (R)' : '')).join(' → ');
}
/* ---------- what the reading actually said ----------
   A kept reading used to show the notes typed at the time and a row of names.
   The names are the smaller half: months later "Six of Swords, reversed" means
   nothing without the card, and the deck is not always to hand. So the meaning
   travels with the entry. It is read from the deck at render time rather than
   copied into the entry, so a correction to the deck reaches old readings. */
/* Every reading is filed in the Lived Record, which is right — but a card
   pulled on Today was pulled *for* today, and the point of pulling it is to
   have it in front of you while the day happens. So the day's draws stay
   where they were taken as well as going into the record. */
function divinationsOn(day){
  return (S.entries || []).filter(e => e.type === 'divination' && e.occurredAt === day)
    .sort((a, b) => (b.createdAt || '') < (a.createdAt || '') ? -1 : 1);
}
function drawnTodayHTML(day){
  const xs = divinationsOn(day || today());
  if(!xs.length) return '';
  return `<div class="dv-today">
    <div class="k mono">drawn today</div>
    ${xs.map(e => { const d = divinationOf(e); if(!d) return '';
      return `<div class="dv-today-card" data-dvopen="${esc(e.id)}" role="button" tabindex="0"
        title="open it in the Lived Record">
        <div class="dv-today-h"><b class="serif">${esc(divinationLine(e) || e.title || 'a reading')}</b>
          <span class="mono faint">${esc(d.system === 'iching' ? 'the coins' : d.system === 'oracle'
            ? ((ORACLE_DECKS.find(k => k.id === d.deck) || {}).name || 'oracle')
            : d.system === 'charms' ? 'the charms' : 'tarot')}</span></div>
        ${d.question ? `<div class="mono faint">${esc(d.question)}</div>` : ''}
        ${divinationReadHTML(d)}
      </div>`; }).join('')}
  </div>`;
}
function bindDrawnToday(root){
  root.querySelectorAll('[data-dvopen]').forEach(n => {
    const open = () => { const id = n.dataset.dvopen;
      /* the Lived Record is addressed by the kind of entry, not by the word
         "entries" — that address falls back to whichever journal was last open */
      navigate('#/journals/divination');
      setTimeout(() => { const el2 = document.querySelector(`[data-entry="${id}"]`);
        if(el2){ el2.scrollIntoView({block:'center'});
          el2.style.background = 'color-mix(in srgb,var(--terra) 12%,transparent)';
          setTimeout(() => el2.style.background = '', 1600); } }, 350); };
    n.onclick = open;
    n.onkeydown = ev => { if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); open(); } };
  });
}

function tarotMeaning(pick){
  const c = tarotCard(pick.card); if(!c) return null;
  const s = pick.rev ? c.reversed : c.upright;
  return {name:c.name + (pick.rev ? ', reversed' : ''), suit:c.suit, card:c, side:s,
    keys:(s.themes.length ? s.themes : c.keywords).join(' · '),
    text:s.summary || s.plain || ''};
}
function divinationReadHTML(d){
  if(!d) return '';
  /* A kept cast is redrawn rather than described: the scatter is the
     reading, so a row of charm names would be throwing it away. */
  if(d.system === 'charms') return castKeptHTML(d);
  if(d.system === 'iching'){
    const h = d.hexagram ? ICHING.find(x => x.i === d.hexagram.i) : null;
    const r = d.relating ? ICHING.find(x => x.i === d.relating.i) : null;
    const moving = (d.lines || []).map((l, i) => l.moving ? i : -1).filter(i => i >= 0);
    const one = (x, role, withLines) => { if(!x) return '';
      const rich = typeof ichingRich === 'function' ? ichingRich(x.i) : null;
      const paras = rich ? rich.d.split('\n\n').filter(Boolean) : [];
      return `<div class="dv-read-card">
        <div class="dv-read-h"><b class="serif">${esc(x.c)} · ${esc(x.n)}</b>
          <span class="mono faint">${esc(role)} · hexagram ${x.i}</span></div>
        ${typeof ichingTrigramsHTML === 'function' ? ichingTrigramsHTML(x.b) : ''}
        <div class="dv-read-k mono">${esc((x.k || []).join(' · '))}</div>
        <p class="dv-read-t">${esc(x.j)}</p>
        <p class="dv-read-t faint">${esc(x.m)}</p>
        ${paras.length ? `<details class="dv-read-more"><summary>the longer reading</summary>
          ${paras.map(t => `<p class="dv-read-t">${esc(t)}</p>`).join('')}
          <p class="dv-read-t faint">${esc(rich.mi)}</p>
          ${withLines && moving.length ? moving.map(i => `<div class="ic-lineread"><span class="mono">line ${i + 1}</span>
            <p>${esc(rich.L[i])}</p></div>`).join('') : ''}
          ${rich.q.length ? `<ul class="dv-cr-q">${rich.q.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
        </details>` : ''}</div>`; };
    return (d.lines && typeof ichingLinesHTML === 'function' ? ichingLinesHTML(d.lines, 'small') : '')
      + one(h, 'as cast', true) + one(r, 'as it becomes', false);
  }
  if(d.system === 'oracle'){
    return (d.cards || []).map(c => `<div class="dv-read-card">
      <div class="dv-read-h"><b class="serif">${esc(c.name || '')}</b></div>
      ${c.text ? `<p class="dv-read-t">${esc(c.text)}</p>` : ''}</div>`).join('');
  }
  /* A kept reading shows the summary and keeps the long version one click
     away: months later the point of opening it is usually to remember which
     cards came up, and occasionally to read the whole thing again. Both are
     read off the deck at render time rather than copied into the entry, so a
     correction to the deck reaches the readings already filed. */
  /* which spread it was, and whether it was dealt here or laid out on a
     table somewhere — both are worth knowing months later, and the spread
     is the only thing that tells you what the position names meant */
  const head = `<div class="dv-read-src">
    <span class="mono faint">${esc(spreadById(d.spread).name)}</span>
    ${d.source === 'physical' ? '<span class="dv-src mono">📖 read on paper</span>' : ''}</div>`;
  return head + (d.cards || []).map((c, i) => {
    const mn = tarotMeaning(c); if(!mn) return '';
    const slot = tarotSlot(d.spread, i);
    const guide = mn.card.positionGuidance ? mn.card.positionGuidance[slot] : '';
    const paras = (mn.side.inDepth || '').split('\n\n').filter(Boolean);
    return `<div class="dv-read-card"${SUIT_COLOR[mn.suit] ? ` style="--sc:${SUIT_COLOR[mn.suit]}"` : ''}>
      <div class="dv-read-h"><b class="serif">${esc(mn.name)}</b>${
        c.pos ? `<span class="mono faint">${esc(c.pos)}</span>` : ''}</div>
      ${mn.card.essence ? `<div class="dv-read-ess">${esc(mn.card.essence)}</div>` : ''}
      ${mn.keys ? `<div class="dv-read-k mono">${esc(mn.keys)}</div>` : ''}
      ${mn.text ? `<p class="dv-read-t">${esc(mn.text)}</p>` : ''}
      ${paras.length ? `<details class="dv-read-more"><summary>the longer reading</summary>
        ${paras.map(t => `<p class="dv-read-t">${esc(t)}</p>`).join('')}
        ${guide ? `<p class="dv-read-t faint"><span class="mono">in a ${esc(slot)} position</span> — ${esc(guide)}</p>` : ''}
        ${mn.side.questions.length ? `<ul class="dv-cr-q">${mn.side.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
        ${mn.side.advice ? `<p class="dv-cr-adv">${esc(mn.side.advice)}</p>` : ''}</details>` : ''}</div>`;
  }).join('');
}

/* ---------- the drawing ceremony ----------
   The old draw was a row of small rectangles you clicked to flip. It worked
   and it felt like a flashcard test. A reading is a ceremony — not because
   anything supernatural is happening, but because the pause, the intention
   and the turning are the mechanism by which a person gets far enough out
   of their own argument to hear themselves. Removing the ceremony removes
   the working part.

   Five phases: a moment to settle, the shuffle, choosing from a spread of
   backs, the turn, and then the reading. Every one of them is skippable by
   the person and every animation in them is dropped for anyone who has
   asked for less motion. */

/* Phase one. A full-viewport veil, warm and dark whatever the theme, with
   three lines that arrive one at a time. The button comes last and on its
   own, so there is a moment where there is nothing to do. */
function tarotCentering(then){
  const lines = ['Take a breath.', 'Close your eyes for a moment.', 'Hold your question in your mind.'];
  const soft = typeof reduced === 'function' && reduced();
  const veil = el(`<div class="dv-veil sheen" role="dialog" aria-label="a moment before the cards">
    <div class="dv-veil-in">
      ${lines.map((l, i) => `<p class="dv-veil-l" style="--i:${i}">${esc(l)}</p>`).join('')}
      <button class="btn primary dv-ready" ${soft ? '' : 'hidden'}>I'm ready</button>
      <button class="dv-skip mono">skip</button>
    </div></div>`);
  document.body.appendChild(veil);
  const go = () => { veil.classList.add('out'); setTimeout(() => veil.remove(), soft ? 0 : 420); then(); };
  veil.querySelector('.dv-ready').onclick = go;
  veil.querySelector('.dv-skip').onclick = go;
  if(!soft) setTimeout(() => { const b = veil.querySelector('.dv-ready'); b.hidden = false; b.focus(); },
    lines.length * 700 + 1400);
  else veil.querySelector('.dv-ready').focus();
  veil.addEventListener('keydown', e => { if(e.key === 'Escape') go(); });
  return veil;
}

/* Phase two. Seven backs in a loose pile that slide, restack and spread.
   The sequence is choreographed rather than random — a shuffle that looks
   random looks like a bug. */
function tarotShuffleHTML(){
  return `<div class="dv-shuffle" id="dvShuffle">
    <div class="dv-pile">${Array.from({length: 7}, (_, i) =>
      `<div class="dv-sh-card" style="--i:${i};--r:${(i * 37 % 13) - 6}deg"><div class="tc-mini">${tarotBackHTML()}</div></div>`).join('')}</div>
    <div class="dv-sh-say quote">The cards are being shuffled…</div>
  </div>`;
}

/* ---------- choosing the shape of the question ----------
   Twenty spreads in a dropdown is a list nobody reads. Laid out as tiles,
   grouped by how long they take, each with a diagram of its own shape, the
   choice is made with the eye — which is the right organ for it, because
   the shape IS the choice. */
function spreadPickerHTML(sel){
  return `<div class="sp-lib" id="dvLib">${SPREAD_CATEGORIES.map(cat => {
    const list = spreadsInCategory(cat.id);
    if(!list.length) return '';
    return `<section class="sp-cat"><h5 class="sp-cat-h"><span class="sc">${esc(cat.name)}</span>
      <span class="quote">${esc(cat.hint)}</span></h5>
      <div class="sp-tiles">${list.map(sp => `
        <button type="button" class="sp-tile${sp.id === sel ? ' on' : ''}" data-dvspread="${esc(sp.id)}"
          title="${esc(sp.desc)}">
          ${spreadDotsHTML(sp)}
          <span class="sp-name serif">${esc(sp.name)}</span>
          <span class="sp-n mono">${sp.cardCount} card${sp.cardCount === 1 ? '' : 's'}</span>
          ${sp.custom && sp.id !== 'custom' ? '<span class="sp-own" data-dvedit="' + esc(sp.id) + '" title="rename it, or change its positions">✎</span>' : ''}
        </button>`).join('')}
        ${cat.id === 'special' ? `<button type="button" class="sp-tile sp-new" data-dvnewspread
          title="name your own positions"><span class="sp-plus">＋</span>
          <span class="sp-name serif">One of your own</span>
          <span class="sp-n mono">you name them</span></button>` : ''}</div></section>`;
  }).join('')}</div>`;
}

/* the three switches that change how a reading behaves, in one row: whether
   cards may land upside down, and whether the room has light and sound in
   it. They are preferences, so they hold from one reading to the next. */
/* Selecting, making and editing a spread, wired the same way wherever the
   picker appears — a redraw is needed whenever the list itself changes,
   which is what making or forgetting a spread of your own does. */
function bindSpreadPicker(root, get, set){
  const bind = () => {
    root.querySelectorAll('[data-dvspread]').forEach(b => b.onclick = ev => {
      if(ev.target.closest('[data-dvedit]')) return;
      set(b.dataset.dvspread);
      if(typeof sound === 'function') sound('click');
    });
    root.querySelectorAll('[data-dvedit]').forEach(n => n.onclick = ev => { ev.stopPropagation();
      const rec = (divPrefs().customSpreads || []).find(x => x.id === n.dataset.dvedit);
      openCustomSpread(rec, id => { set(id || (get() === n.dataset.dvedit ? 'ppf' : get())); redraw(); }); });
    const nu = root.querySelector('[data-dvnewspread]');
    if(nu) nu.onclick = () => openCustomSpread(null, id => { if(id) set(id); redraw(); });
  };
  const redraw = () => { const host = root.querySelector('#dvLib');
    if(host) host.outerHTML = spreadPickerHTML(get());
    bind(); set(get()); };
  bind();
}

function divTogglesHTML(){
  const p = divPrefs();
  const sw = (k, on, label, hint) => `<button type="button" class="dv-sw${on ? ' on' : ''}" data-dvpref="${k}"
    role="switch" aria-checked="${on}" title="${esc(hint)}"><i></i><span>${esc(label)}</span></button>`;
  return `<div class="dv-switches">
    ${sw('reversals', p.reversals, 'Reversals', 'Cards may land upside down and be read the other way. Off means every card comes up upright.')}
    ${sw('sound', p.sound, 'Sound', 'A bowl, the paper, a chime as each card turns. Only ever during a reading.')}
    <label class="dv-vol" title="how loud, out of a not-very-loud whole"><span class="mono">vol</span>
      <input type="range" id="dvVol" min="0" max="100" step="5" value="${Math.round(p.volume * 100)}"></label>
    ${sw('particles', p.particles, 'Light', 'Dust in the air over the ceremony. Off if you have asked for less motion.')}
  </div>`;
}
function bindDivToggles(root){
  root.querySelectorAll('[data-dvpref]').forEach(b => b.onclick = () => {
    const k = b.dataset.dvpref, v = !divPrefs()[k];
    divPrefSet(k, v);
    b.classList.toggle('on', v); b.setAttribute('aria-checked', String(v));
    if(k === 'sound' && v) CeremonySound.chime();
    if(k === 'sound' && !v) CeremonySound.close();
  });
  const vol = root.querySelector('#dvVol');
  /* on `input` so it is heard while it is dragged, which is the only way to
     set a volume — and a chime on release so there is something to hear */
  if(vol){
    vol.addEventListener('input', () => { divPrefs().volume = +vol.value / 100;
      if(CeremonySound.master) CeremonySound.master.gain.value = divPrefs().volume; });
    vol.addEventListener('change', () => { saveNow(); if(divPrefs().sound) CeremonySound.chime(); });
  }
}

function openTarot(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  let spreadId = pre.spread || divPrefs().spread || 'ppf';
  if(!spreadById(spreadId)) spreadId = 'ppf';
  spreadId = spreadById(spreadId).id;
  const m = openModal(`<h2>A reading</h2>
    <div class="stack" id="divSetup">
      <div class="field"><label>What are you asking?</label>
        <input class="inp serif-lg" id="dvQ" value="${esc(pre.question || '')}" placeholder="Not ‘will it happen’ — ‘what am I not seeing’."></div>
      <div class="field"><label>The spread</label>
        ${spreadPickerHTML(spreadId)}
        <div class="sp-chosen" id="dvChosen"></div></div>
      ${divTogglesHTML()}
      <p class="th-quote">Hill: when ideas flash into the mind through what is popularly called a hunch, they come from somewhere you cannot reach on purpose. The cards are not the somewhere. They are the door handle.</p>
      <div class="row" style="justify-content:flex-end;gap:8px;flex-wrap:wrap">
        <button class="btn" id="dvPhys" title="cards you have already laid out on a table">📖 a reading you did on paper</button>
        <button class="btn primary" id="dvDraw">Take a breath, then deal</button></div>
    </div>
    <div id="divOut"></div>`, 'wide');
  bindDivToggles(m);
  m.querySelector('#dvPhys').onclick = () => { m.remove(); openPhysicalReading({question: m.querySelector('#dvQ')?.value || '', spread: spreadId}); };

  const spreadOf = () => spreadById(spreadId);
  const showChosen = () => {
    const sp = spreadOf();
    m.querySelector('#dvChosen').innerHTML = `<p class="sp-desc">${esc(sp.desc)}</p>
      <ol class="sp-poslist">${sp.positions.map(q =>
        `<li><b>${esc(q.name)}</b>${q.desc ? ` — ${esc(q.desc)}` : ''}</li>`).join('')}</ol>`;
    m.querySelectorAll('[data-dvspread]').forEach(b => b.classList.toggle('on', b.dataset.dvspread === sp.id));
  };
  bindSpreadPicker(m, () => spreadId, id => { spreadId = id; divPrefSet('spread', id); showChosen(); });
  showChosen();

  m.querySelector('#dvDraw').onclick = () => {
    const sp = spreadOf(), picks = tarotDraw(sp.cardCount, sp.forceRev || undefined);
    const soft = typeof reduced === 'function' && reduced();
    m.querySelector('#divSetup').hidden = true;
    /* the canvas sits over the whole ceremony and nothing else; it is torn
       down with the modal, and the field with it */
    m.querySelector('#divOut').innerHTML = `<div class="dv-cer" id="dvCer">
      <canvas class="dv-motes" id="dvMotes" aria-hidden="true"></canvas>
      <button class="dv-mute mono" id="dvMute" title="the sounds of the ceremony"></button>
      <div class="dv-cer-in" id="dvCerIn">${tarotShuffleHTML()}</div></div>`;
    const cer = m.querySelector('#dvCer'), inner = m.querySelector('#dvCerIn');
    const field = dvFieldStart(m.querySelector('#dvMotes'));
    const mute = m.querySelector('#dvMute');
    const showMute = () => { mute.textContent = divPrefs().sound ? '♪ sound on' : '♪ sound off';
      mute.classList.toggle('off', !divPrefs().sound); };
    mute.onclick = () => { const v = !divPrefs().sound; divPrefSet('sound', v); showMute();
      if(v) CeremonySound.chime(); else CeremonySound.close(); };
    showMute();
    /* a modal that goes takes the animation frame and the audio with it */
    const stopAll = () => { dvFieldStop(); CeremonySound.close(); window.removeEventListener('resize', fit); };
    /* a modal lives in #modals, and every way of closing one — the ×, the
       backdrop, Escape, a route away — ends with it removed from there */
    const stage = document.getElementById('modals') || document.body;
    const obs = new MutationObserver(() => { if(!stage.contains(m)){ stopAll(); obs.disconnect(); } });
    obs.observe(stage, {childList: true});
    const fit = () => { field.resize && field.resize(); tarotBoardFit(m); };
    window.addEventListener('resize', fit);

    field.ambient(38);
    tarotCentering(() => {
      dvMoment('bowl');
      const sh = m.querySelector('#dvShuffle');
      if(sh) sh.classList.add('go');
      /* four slides across the shuffle, on the beats of the animation */
      [0, 420, 980, 1500].forEach(t => setTimeout(() => dvMoment('slide'), soft ? 0 : t));
      setTimeout(deal, soft ? 0 : 2400);
    });

    /* Phase three onward. Backs are laid out to choose from — always more of
       them than will be drawn, because choosing from exactly as many as you
       need is not choosing. The cards themselves were dealt before any of
       this; which back you pick decides the order they arrive in, not what
       they are, and that is the honest arrangement. */
    function deal(){
      const many = clamp(picks.length + 6, 8, 14);
      inner.innerHTML = `
        <div class="dv-stage">
          <div class="dv-prompt" id="dvPrompt"></div>
          ${tarotBoardHTML(sp)}
          <div class="dv-fan" id="dvFan">${Array.from({length: many}, (_, i) =>
            `<button class="dv-pick" data-pick="${i}" style="--i:${i};--n:${many}" aria-label="choose a card">
              <div class="tc-mini">${tarotBackHTML()}</div></button>`).join('')}</div>
        </div>`;
      m.querySelector('#divOut').insertAdjacentHTML('beforeend', '<div id="dvRead" hidden></div>');
      tarotBoardFit(m);
      let turned = 0, busy = false;
      const prompt = m.querySelector('#dvPrompt');
      const say = () => { prompt.innerHTML = turned < picks.length
        ? `<span class="sc">choose your ${['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth'][turned] || (turned + 1) + 'th'} card</span> <b class="serif">${esc(sp.pos[turned])}</b>${
            sp.positions[turned].desc ? `<span class="dv-prompt-d quote">${esc(sp.positions[turned].desc)}</span>` : ''}`
        : '<span class="sc">the spread is complete</span>'; };
      say();

      /* where on the canvas a thing is, so the sparks come off the card
         rather than off the middle of the screen */
      const at = node => { const r = node.getBoundingClientRect(), c = cer.getBoundingClientRect();
        return [r.left - c.left + r.width / 2, r.top - c.top + r.height / 2]; };

      m.querySelectorAll('[data-pick]').forEach(btn => btn.onclick = () => {
        if(busy || turned >= picks.length || btn.classList.contains('taken')) return;
        busy = true;
        dvMoment('chime');
        const idx = turned++, hole = m.querySelector(`[data-hole="${idx}"]`);
        btn.classList.add('taken');
        const land = () => {
          hole.innerHTML = tarotCardHTML(picks[idx], idx, false);
          const cap = m.querySelector(`[data-cap="${idx}"]`);
          cap.innerHTML = tarotCaptionHTML(picks[idx]);
          const card = hole.querySelector('.tc');
          /* slide in, a breath, then the turn — the pause is the point of it */
          setTimeout(() => {
            card.classList.add('up');
            const [cx, cy] = at(card);
            dvMoment('thrum', cx, cy);
            setTimeout(() => {
              card.classList.add('pulse');
              /* the name arrives under the card as it comes round, rather
                 than being printed over the drawing */
              scrambleInto(cap.querySelector('.tc-cap-name'), TAROT[picks[idx].card].n, 900);
              dvMoment('tinkle');
              setTimeout(() => card.classList.remove('pulse'), 900);
            }, soft ? 0 : 420);
            busy = false; say();
            if(turned === picks.length){
              /* the rest of the deck has done its job — it goes, rather than
                 sitting under the spread as a row of gaps */
              const fan = m.querySelector('#dvFan');
              if(fan){ fan.classList.add('spent'); setTimeout(() => fan.remove(), soft ? 0 : 500); }
              setTimeout(() => { dvMoment('chord'); dvMoment('wind'); }, soft ? 0 : 700);
              setTimeout(showReading, soft ? 0 : 1400);
            }
          }, soft ? 0 : 300);
        };
        if(soft){ btn.style.visibility = 'hidden'; land(); return; }
        /* fly the chosen back to its place in the spread, then let the real
           card take over from it */
        const a = btn.getBoundingClientRect(), b = hole.getBoundingClientRect();
        btn.style.transformOrigin = 'top left';
        btn.style.transition = 'transform .42s cubic-bezier(.22,.61,.36,1), opacity .12s .34s';
        btn.style.transform = `translate(${(b.left - a.left).toFixed(1)}px,${(b.top - a.top).toFixed(1)}px) scale(${(b.width / a.width).toFixed(3)},${(b.height / a.height).toFixed(3)})`;
        btn.style.opacity = '0';
        setTimeout(() => { btn.style.visibility = 'hidden'; land(); }, 430);
      });

      function showReading(){
        /* The ceremony is over. The dust drops to a few motes while the
           reading arrives and then stops altogether: a person may sit
           writing in this box for ten minutes, and there is no version of
           this app that runs an animation frame behind them while they do. */
        field.ambient(18);
        setTimeout(() => field.stop(), soft ? 0 : 6000);
        const box = m.querySelector('#dvRead');
        box.innerHTML = tarotReadingHTML(picks, sp) + divKeepHTML(projects);
        box.hidden = false;
        box.scrollIntoView({behavior: soft ? 'auto' : 'smooth', block: 'start'});
        m.querySelector('#dvSave').onclick = () => {
          divinationSave({system:'tarot', question:m.querySelector('#dvQ').value.trim(), spread:sp.id,
            title:`${sp.name} — ${picks.map(pk => TAROT[pk.card].n).join(', ')}`,
            cards:picks.map((pk, i) => ({card:pk.card, rev:pk.rev, pos:sp.pos[i]})),
            reading:m.querySelector('#dvText').value.trim(), source:'digital',
            revisit:m.querySelector('#dvRevisit').checked, pin: m.querySelector('#dvPin')?.checked, projectId:m.querySelector('#dvProj')?.value || null});
          stopAll();
          sound('success'); toast('Kept in the Lived Record.'); m.remove(); rerender();
        };
      }
    }
  };
}

/* the box under every reading, digital or paper: what you make of it, which
   is the part that is actually yours */
function divKeepHTML(projects){
  return `<section class="dv-yours"><h4 class="dv-sec-h">Your reflection</h4>
    <p class="dv-yours-p">Now that you have read them — what lands? What surprised you? What do you want to sit with?</p>
    <div class="field"><textarea class="inp" id="dvText" rows="5" placeholder="Not what the book says. What it says to you, about the thing you asked."></textarea></div>
    <div class="row between" style="margin-top:10px;flex-wrap:wrap;gap:8px">
      <label class="row" style="gap:6px;font-size:.78rem;align-items:center"><input type="checkbox" id="dvRevisit"> <span>come back to this one</span></label>
      <!-- Some readings say the thing once and you are done with them. Some say
           the thing you have been avoiding, and the use of them is hearing it
           again tomorrow. This is the moment to know which — you have just read
           it — so the choice is here rather than found later in the archive. -->
      <label class="row" style="gap:6px;font-size:.78rem;align-items:center"><input type="checkbox" id="dvPin"> <span>📌 keep it on Today</span></label>
      ${(projects || []).length ? `<select class="inp sm" id="dvProj"><option value="">nothing in particular</option>
        ${projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>` : ''}
      <button class="btn primary" id="dvSave">Keep the reading</button></div>
  </section>`;
}
/* ---------- casting the coins ----------
   Three coins, six times, bottom line first. The toss is animated because
   the pacing is the practice: you are meant to throw a line, look at it,
   and throw the next, rather than press a button six times. The line lands
   as the coins settle, and when the sixth is down the hexagram pulses once
   and its name resolves out of noise, the same way a card's does. */
function openIChing(pre = {}){
  const projects = typeof thProjects === 'function' ? thProjects() : [];
  let method = divPrefs().castMethod || 'coins';
  const m = openModal(`<h2>The Book of Changes</h2>
    <div class="stack" id="icSetup">
      <div class="field"><label>What are you asking?</label>
        <input class="inp serif-lg" id="icQ" value="${esc(pre.question || '')}" placeholder="A situation, not a yes-or-no."></div>
      <div class="field"><label>How to ask it</label>
        <div class="ic-methods" id="icMethods">
          <button type="button" class="ic-method${method === 'coins' ? ' on' : ''}" data-icmethod="coins">
            <span class="ic-method-i">☰</span><span class="sp-name serif">Three coins</span>
            <span class="sp-n mono">six tosses</span>
            <span class="cc-size-h quote">What most people use, and quick. Every line is as likely to be moving as any other.</span></button>
          <button type="button" class="ic-method${method === 'yarrow' ? ' on' : ''}" data-icmethod="yarrow">
            <span class="ic-method-i">丨</span><span class="sp-name serif">Fifty yarrow stalks</span>
            <span class="sp-n mono">eighteen divisions</span>
            <span class="cc-size-h quote">The older way, and slower. Moving lines are rarer, and a moving yang is three times likelier than a moving yin — the readings have a different weather.</span></button>
        </div></div>
      ${divTogglesHTML()}
      <p class="th-quote">The book is older than any of its readers and has been asked most of this before. What it is good for is not prediction; it is being handed a description of a situation you did not write, and finding out which parts you argue with.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="icGo">Settle, then cast</button></div>
    </div>
    <div id="icOut"></div>`, 'wide rite');
  bindDivToggles(m);
  m.querySelectorAll('[data-icmethod]').forEach(b => b.onclick = () => {
    method = b.dataset.icmethod; divPrefSet('castMethod', method);
    m.querySelectorAll('[data-icmethod]').forEach(x => x.classList.toggle('on', x === b));
    if(typeof sound === 'function') sound('click');
  });

  m.querySelector('#icGo').onclick = () => {
    const soft = typeof reduced === 'function' && reduced();
    m.querySelector('#icSetup').hidden = true;
    const lines = [], rolls = [];
    m.querySelector('#icOut').innerHTML = `<div class="ic-cer" id="icCer">
      <canvas class="dv-motes" id="icMotes" aria-hidden="true"></canvas>
      <button class="dv-mute mono" id="icMute"></button>
      <div class="ic-stage">
        <div class="ic-figwrap" id="icFigWrap">${ichingFigureHTML(lines)}</div>
        <div class="ic-cast" id="icCast">
          ${method === 'yarrow' ? ichingYarrowHTML()
            : `<div class="ic-coins" id="icCoins">${[3, 3, 3].map((f, i) => ichingCoinHTML(f, i)).join('')}</div>`}
          <div class="ic-total mono" id="icTotal"></div>
        </div>
      </div>
      <div class="row between ic-bar">
        <span class="mono faint" id="icCount"></span>
        <button class="btn primary" id="icToss">${method === 'yarrow' ? 'divide the stalks' : 'toss the coins'}</button></div>
    </div>
    <div id="icRead" hidden></div>`;

    const cer = m.querySelector('#icCer');
    const field = dvFieldStart(m.querySelector('#icMotes'));
    const mute = m.querySelector('#icMute');
    const showMute = () => { mute.textContent = divPrefs().sound ? '♪ sound on' : '♪ sound off';
      mute.classList.toggle('off', !divPrefs().sound); };
    mute.onclick = () => { divPrefSet('sound', !divPrefs().sound); showMute();
      if(divPrefs().sound) CeremonySound.chime(); else CeremonySound.close(); };
    showMute();
    const stopAll = () => { dvFieldStop(); CeremonySound.close(); };
    const stage = document.getElementById('modals') || document.body;
    const obs = new MutationObserver(() => { if(!stage.contains(m)){ stopAll(); obs.disconnect(); } });
    obs.observe(stage, {childList: true});

    const count = () => { m.querySelector('#icCount').textContent = lines.length >= 6
      ? 'the hexagram is complete'
      : `${method === 'yarrow' ? 'division' : 'toss'} ${lines.length + 1} of 6`; };
    const redraw = () => { m.querySelector('#icFigWrap').innerHTML = ichingFigureHTML(lines);
      const row = m.querySelector(`[data-row="${lines.length - 1}"]`);
      if(row && !soft) row.classList.add('drawing'); };
    count(); redraw();
    field.ambient(30);
    ichingCentering(() => { dvMoment('bowl'); m.querySelector('#icToss').focus(); });

    let busy = false;
    m.querySelector('#icToss').onclick = () => {
      if(busy || lines.length >= 6) return;
      busy = true;
      const btn = m.querySelector('#icToss');
      btn.disabled = true;
      const roll = ichingToss(method);
      const kind = IC_LINE_KIND[roll.total];
      m.querySelector('#icTotal').innerHTML = '';

      const settleLine = () => {
        /* the total, then the line drawing itself into the figure */
        m.querySelector('#icTotal').innerHTML =
          `<span class="ic-tot-n">= ${roll.total}</span>
           <span class="ic-tot-k" style="--lc:${kind.c}">${esc(kind.name)}${kind.moving ? ' · changing' : ''}</span>`;
        setTimeout(() => {
          lines.push(Object.assign(ichingLineOf(roll.total), {coins: roll.coins || null}));
          rolls.push({toss: lines.length, total: roll.total, kind: kind.id,
            coins: roll.coins || null, rounds: roll.rounds || null});
          redraw(); count(); dvMoment('stone');
          if(lines.length < 6){ busy = false; btn.disabled = false; }
          else setTimeout(complete, soft ? 0 : 560);
        }, soft ? 0 : 260);
      };

      if(method === 'yarrow'){
        ichingDivideStalks(m.querySelector('#icYar'), roll, settleLine);
      } else {
        const box = m.querySelector('#icCoins');
        box.innerHTML = roll.coins.map((f, i) => ichingCoinHTML(f, i)).join('');
        ichingFlyCoins(box, roll.coins, settleLine);
      }
    };

    function complete(){
      const h = ichingLookup(ichingBinary(lines)), rel = ichingRelating(lines);
      const fig = m.querySelector('#icFigWrap');
      if(!soft){ fig.classList.add('done'); setTimeout(() => fig.classList.remove('done'), 1400); }
      dvMoment('chord');
      field.shimmer();
      m.querySelector('#icCast').classList.add('spent');
      m.querySelector('.ic-stage').classList.add('settled');
      /* the pair, side by side, with the movement between them */
      fig.innerHTML = `<div class="ic-pair${rel ? ' two' : ''}">
        <figure class="ic-one">${ichingFigureHTML(lines)}${ichingHeadHTML(h, {scramble: true})}</figure>
        ${rel ? `<div class="ic-arrow" aria-hidden="true"><span>→</span><span>→</span></div>
          <figure class="ic-one rel">${ichingFigureHTML(
            lines.map(l => ({v: l.moving ? (l.v ? 0 : 1) : l.v, moving: false,
              total: (l.moving ? (l.v ? 0 : 1) : l.v) ? 7 : 8})))}${ichingHeadHTML(rel, {})}</figure>` : ''}
      </div>${ichingTrigramNoteHTML(h.b)}`;
      const nm = fig.querySelector('.ic-hnm');
      if(nm){ if(soft) nm.textContent = h.n;
        else { scrambleInto(nm, h.n, 1200); setTimeout(() => dvMoment('tinkle'), 300); } }
      if(rel && !soft){
        fig.querySelector('.ic-one.rel').classList.add('arriving');
        setTimeout(() => dvMoment('turning'), 900);
      }

      const box = m.querySelector('#icRead');
      box.innerHTML = `<div class="mono faint ic-keys">${esc(h.k.join('  ·  '))}</div>
        <div class="ic-res"><b class="serif">${h.i}. ${esc(h.n)}</b> <span class="mono faint">${esc(h.c)}</span></div>
        ${ichingReadingHTML(lines, h, rel)}
        ${divKeepHTML(projects)}`;
      box.hidden = false;
      box.scrollIntoView({behavior: soft ? 'auto' : 'smooth', block: 'start'});
      setTimeout(() => field.stop(), soft ? 0 : 6000);
      m.querySelector('#dvSave').onclick = () => {
        divinationSave({system:'iching', question:m.querySelector('#icQ').value.trim(),
          title:`${h.i}. ${h.n}${rel ? ' → ' + rel.i + '. ' + rel.n : ''}`,
          lines:lines.map(l => ({v:l.v, moving:l.moving, total:l.total})),
          hexagram:{i:h.i, n:h.n, c:h.c}, relating:rel ? {i:rel.i, n:rel.n} : null,
          method, tosses:rolls,
          reading:m.querySelector('#dvText').value.trim(),
          revisit:m.querySelector('#dvRevisit').checked, pin: m.querySelector('#dvPin')?.checked,
          projectId:m.querySelector('#dvProj')?.value || null});
        stopAll(); sound('success'); toast('Kept in the Lived Record.'); m.remove(); rerender();
      };
    }
  };
}
/* ---------- the oracle ----------
   An oracle card is a sentence, and a sentence in a text box is a
   notification. Given a card to turn over and a moment to sit with before
   answering, the same sentence is something else — which is the whole
   difference this section is trying to make.

   What to do with a card depends on the deck it came from, so each deck
   says so in its own words. Inner Weather is about the afternoon you are
   actually in; Thresholds is about finding the real doorway behind the
   metaphor; Elements asks you to feel it before you think about it,
   because the answer that arrives from the head first is usually a
   defence. */
const ORACLE_SIT = {
  inner: "Before you answer, put this somewhere you will see it again this afternoon. Inner Weather is about what is actually going on rather than what you had planned, so the test of a card is simple: does it change anything in the next four hours?",
  thresh: "Find the actual threshold. Not the metaphor — the specific doorway this is pointing at: the conversation, the decision, the room you have been standing outside of. Name that first, then answer.",
  elem: "Take three slow breaths before you respond. Let it land in the body rather than in the head, and notice what arrives — a feeling, an image, a resistance. That is the answer beginning to form. The one that comes from the head first is usually a defence.",
};
function openOracle(deckId){
  const deck = ORACLE_DECKS.find(d => d.id === deckId) || ORACLE_DECKS[0];
  const soft = typeof reduced === 'function' && reduced();
  const m = openModal(`<h2>${esc(deck.name)}</h2>
    <div class="stack">
      <div class="row" style="gap:5px;flex-wrap:wrap">${ORACLE_DECKS.map(d =>
        `<button class="chip ${d.id === deck.id ? 'on' : ''}" data-deck="${d.id}">${esc(d.name)}</button>`).join('')}</div>
      <div class="field"><label>What are you asking?</label><input class="inp serif-lg" id="orQ"></div>
      <div id="orOut"></div>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" id="orDraw">draw one</button></div>
    </div>`, 'narrow');
  m.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => { m.remove(); openOracle(b.dataset.deck); });
  m.querySelector('#orDraw').onclick = () => {
    const [i] = oracleDraw(deck.id, 1); const [name, text] = deck.cards[i];
    m.querySelector('#orOut').innerHTML = `
      <div class="or-stage">
        <div class="or-card" id="orCard">
          <div class="or-inner">
            <div class="or-back">${tarotBackHTML()}<span class="or-deck mono">${esc(deck.name)}</span></div>
            <div class="or-face">
              <div class="or-name serif">${esc(name)}</div>
              <p class="or-text">${esc(text)}</p>
              <span class="or-src mono">${esc(deck.name)}</span>
            </div>
          </div>
        </div>
      </div>
      <section class="or-sit"><h4 class="dv-sec-h">Sit with this</h4>
        <p>${esc(ORACLE_SIT[deck.id] || ORACLE_SIT.inner)}</p></section>
      <section class="or-yours"><h4 class="dv-sec-h">Your response</h4>
        <div class="field"><textarea class="inp" id="orText" rows="4" placeholder="Not what it means in general. What it means here."></textarea></div>
        <label class="row" style="gap:6px;font-size:.78rem;align-items:center"><input type="checkbox" id="orPin"> <span>📌 keep it on Today</span></label>
      </section>`;
    const card = m.querySelector('#orCard');
    const turn = () => { card.classList.add('up'); sound('click');
      setTimeout(() => scrambleInto(card.querySelector('.or-name'), name, 800), soft ? 0 : 420); };
    if(soft) turn(); else setTimeout(turn, 380);
    m.querySelector('#orDraw').textContent = 'keep it';
    m.querySelector('#orDraw').onclick = () => {
      divinationSave({system:'oracle', deck:deck.id, question:m.querySelector('#orQ').value.trim(),
        title:`${deck.name} — ${name}`, cards:[{name, text}],
        reading:m.querySelector('#orText').value.trim(),
        pin:m.querySelector('#orPin')?.checked});
      sound('success'); m.remove(); rerender();
    };
  };
}
/* one card, no ceremony — the version you reach for on the way past */
function openQuickDraw(){
  const m = openModal(`<h2>A quick draw</h2>
    <div class="stack" style="gap:8px">
      <button class="choice" data-qd="tarot"><span class="ico">🔮</span><span><b>One tarot card</b><div class="d">From the full deck of 78.</div></span></button>
      <button class="choice" data-qd="oracle"><span class="ico">◈</span><span><b>An oracle card</b><div class="d">A short one. Something to hold for the day.</div></span></button>
      <button class="choice" data-qd="iching"><span class="ico">☰</span><span><b>Cast the coins</b><div class="d">Six tosses, and the hexagram they make.</div></span></button>
      <button class="choice" data-qd="charms"><span class="ico">🎲</span><span><b>Throw seven charms</b><div class="d">Older than the cards. Read where they fall rather than in what order.</div></span></button>
      <button class="choice" data-qd="full"><span class="ico">✦</span><span><b>A whole reading</b><div class="d">Twenty spreads, with room to write.</div></span></button>
      <button class="choice" data-qd="paper"><span class="ico">📖</span><span><b>A reading you did on paper</b><div class="d">Name the cards you laid out and get the same reading.</div></span></button>
      <button class="choice" data-qd="cast"><span class="ico">🔮</span><span><b>A full cast</b><div class="d">Fifteen charms or all thirty, on the cloth, with room to write.</div></span></button>
      <button class="choice" data-qd="deck"><span class="ico">📚</span><span><b>The deck</b><div class="d">All seventy-eight and all thirty charms, and every time each has come up for you.</div></span></button>
    </div>`, 'narrow');
  m.querySelectorAll('[data-qd]').forEach(b => b.onclick = () => {
    const k = b.dataset.qd; m.remove();
    divPrefSet('quickWith', k);
    if(k === 'iching') openIChing();
    else if(k === 'oracle') openOracle();
    else if(k === 'full') openTarot();
    else if(k === 'paper') openPhysicalReading();
    else if(k === 'deck') openCardDirectory();
    else if(k === 'charms') openCharmCast({size:'quick'});
    else if(k === 'cast') openCharmCast();
    else openTarot({spread:'daily'});
  });
}
