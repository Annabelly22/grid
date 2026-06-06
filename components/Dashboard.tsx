'use client';
import { useState, useEffect } from 'react';
import { UserProfile, Habit, getLevel, CATEGORY_COLORS } from '../lib/gameStore';
import GridLogo from './GridLogo';
import { getCyclePhase, getDayOfCycle, CYCLE_PHASES } from '../lib/supplementData';
import { GYM_DAYS } from '../lib/gymData';

type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  onNavigate: (tab: Tab) => void;
  onCompleteHabit: (id: string) => void;
}

const STOIC_QUOTES: { text: string; author: string }[] = [
  // ── MINDSET
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.", author: "Marcus Aurelius" },
  { text: "Ambition is tying your well-being to what other people do and say. Sanity is tying it to your own actions.", author: "Marcus Aurelius" },
  { text: "Men are disturbed not by things, but by the opinions about things.", author: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "Seek not the good in external things; seek it in yourself.", author: "Epictetus" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "Difficulties are things that show a person what they are.", author: "Epictetus" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "As long as you live, keep learning how to live.", author: "Seneca" },
  { text: "The whole future lies in uncertainty: live immediately.", author: "Seneca" },
  { text: "If you have nothing to stir you up and rouse you to action — nothing which will test your resolution by its threats and hostilities — if you recline in unshaken comfort, it is not tranquillity; it is merely a flat calm.", author: "Seneca" },
  { text: "Soft living imposes on us the penalty of debility; we cease to be able to do the things we have long been grudging about doing.", author: "Seneca" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.", author: "Viktor Frankl" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
  { text: "Those who have a why to live can bear with almost any how.", author: "Viktor Frankl" },
  { text: "A man who becomes conscious of the responsibility he bears toward an unfinished work will never be able to throw away his life.", author: "Viktor Frankl" },
  { text: "In some ways, suffering ceases to be suffering at the moment it finds a meaning, such as the meaning of a sacrifice.", author: "Viktor Frankl" },
  { text: "One does not become enlightened by imagining figures of light, but by making the darkness conscious.", author: "Carl Jung" },
  { text: "A man likes to believe that he is the master of his soul. But as long as he is unable to control his moods and emotions, he is certainly not his own master.", author: "Carl Jung" },
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
  { text: "The most terrifying thing is to accept oneself completely.", author: "Carl Jung" },
  { text: "You cannot get out of a problem with the same thinking that got you into it.", author: "Carl Jung" },
  { text: "One must still have chaos in oneself to be able to give birth to a dancing star.", author: "Friedrich Nietzsche" },
  { text: "The snake which cannot cast its skin has to die. As well the minds which are prevented from changing their opinions; they cease to be mind.", author: "Friedrich Nietzsche" },
  { text: "There are no facts, only interpretations.", author: "Friedrich Nietzsche" },
  { text: "The higher we soar, the smaller we appear to those who cannot fly.", author: "Friedrich Nietzsche" },
  { text: "Become who you are.", author: "Friedrich Nietzsche" },
  { text: "Your mind is the operating system. Everything else is just an app.", author: "Naval Ravikant" },
  { text: "Desire is a contract you make with yourself to be unhappy until you get what you want.", author: "Naval Ravikant" },
  { text: "The most important skill for getting rich is becoming a perpetual learner.", author: "Naval Ravikant" },
  { text: "The quality of your thinking determines the quality of your life.", author: "Naval Ravikant" },
  { text: "A rational person can find peace by cultivating indifference to things outside their control.", author: "Naval Ravikant" },
  { text: "Ego is the enemy of what you want and of what you have — of mastering a craft, of real creative insight, of working well with others, of building loyalty, of longevity.", author: "Ryan Holiday" },
  { text: "Silence is the respite of the confident and the strong.", author: "Ryan Holiday" },
  { text: "Most people want to be the noun without doing the verb. They want the title without the work.", author: "Ryan Holiday" },
  { text: "Most successful people are people you have never heard of. They want it that way. It keeps them sober. It helps them do their jobs.", author: "Ryan Holiday" },
  { text: "People fail in small ways all the time. But they do not learn. They do not see the problems that failure exposes.", author: "Ryan Holiday" },
  { text: "Can you imagine yourself in ten years if, instead of avoiding the things you know you should do, you actually did them every single day?", author: "Jordan Peterson" },
  { text: "You should never sacrifice what you could be for what you are.", author: "Jordan Peterson" },
  { text: "It is in responsibility that most people find the meaning that sustains them through life.", author: "Jordan Peterson" },
  { text: "People think they think, but it is mostly self-criticism that passes for thinking.", author: "Jordan Peterson" },
  { text: "You are going to pay a price for everything you do and everything you do not do.", author: "Jordan Peterson" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", author: "Theodore Roosevelt" },
  { text: "It is not that I am so smart, it is just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Reality is merely an illusion, albeit a very persistent one. Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  // ── MONEY/WEALTH
  { text: "Rule No.1: Never lose money. Rule No.2: Never forget Rule No.1.", author: "Warren Buffett" },
  { text: "Someone is sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "It is far better to buy a wonderful company at a fair price than a fair company at a wonderful price.", author: "Warren Buffett" },
  { text: "The first rule of compounding: never interrupt it unnecessarily.", author: "Charlie Munger" },
  { text: "Invert, always invert. Many hard problems are best solved when they are addressed backward.", author: "Charlie Munger" },
  { text: "It is remarkable how much long-term advantage we have gotten by trying to be consistently not stupid, instead of trying to be very intelligent.", author: "Charlie Munger" },
  { text: "The idea of caring that someone is making money faster than you are is one of the deadly sins. Envy is the only one you could never possibly have any fun with.", author: "Charlie Munger" },
  { text: "I succeeded because I have a long attention span.", author: "Charlie Munger" },
  { text: "The highest form of wealth is the ability to wake up every morning and say: I can do whatever I want today.", author: "Morgan Housel" },
  { text: "Wealth is hidden. It is income not spent. Wealth is an option not yet taken to buy something later.", author: "Morgan Housel" },
  { text: "Saving money is the gap between your ego and your income.", author: "Morgan Housel" },
  { text: "A genius who loses control of their emotions can be a financial disaster. An ordinary person with no financial education can be wealthy if they have a handful of behavioral skills that have nothing to do with formal intelligence.", author: "Morgan Housel" },
  { text: "The most important part of every plan is to plan on the plan not going according to plan.", author: "Morgan Housel" },
  { text: "If you are not aggressive, you are not going to make money, and if you are not defensive, you are not going to keep money.", author: "Ray Dalio" },
  { text: "The biggest mistake investors make is to believe that what happened in the recent past is likely to persist.", author: "Ray Dalio" },
  { text: "The most valuable habit I have acquired is using pain to trigger quality reflections.", author: "Ray Dalio" },
  { text: "To make money in the markets, you have to think independently and be humble.", author: "Ray Dalio" },
  { text: "He who lives by the crystal ball will eat shattered glass.", author: "Ray Dalio" },
  { text: "You will get rich by giving society what it wants but does not yet know how to get.", author: "Naval Ravikant" },
  { text: "Specific knowledge is knowledge that you cannot be trained for. If society can train you, it can train someone else and replace you.", author: "Naval Ravikant" },
  { text: "We live in an age of infinite leverage, and the economic rewards for genuine intellectual curiosity have never been higher.", author: "Naval Ravikant" },
  { text: "In an age of infinite leverage, judgment is the most important skill.", author: "Naval Ravikant" },
  { text: "Apply specific knowledge, with leverage, and eventually you will get what you deserve.", author: "Naval Ravikant" },
  { text: "The philosophy of the rich and the poor is this: the rich invest their money and spend what is left. The poor spend their money and invest what is left.", author: "Robert Kiyosaki" },
  { text: "Self-discipline is the number one delineating factor between the rich, the middle class, and the poor.", author: "Robert Kiyosaki" },
  { text: "An asset puts money in your pocket. A liability takes money out of your pocket.", author: "Robert Kiyosaki" },
  { text: "The poor and the middle class work for money. The rich have money work for them.", author: "Robert Kiyosaki" },
  { text: "I believe in the sacredness of a promise, that a man's word should be as good as his bond; that character — not wealth or power or position — is of supreme worth.", author: "John D. Rockefeller" },
  { text: "A man's wealth must be determined by the relation of his desires and expenditures to his income. If he feels rich on ten dollars, he really is rich.", author: "John D. Rockefeller" },
  { text: "Do not be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "Ninety percent of all millionaires become so through owning real estate.", author: "Andrew Carnegie" },
  { text: "If you want to be rich, think of saving as earning.", author: "Andrew Carnegie" },
  { text: "Wealth is not to feed our egos but to feed the hungry and to help people help themselves.", author: "Andrew Carnegie" },
  { text: "The man who acquires the ability to take full possession of his own mind may take possession of anything else to which he is justly entitled.", author: "Andrew Carnegie" },
  { text: "Markets are constantly in a state of uncertainty and flux, and money is made by discounting the obvious and betting on the unexpected.", author: "George Soros" },
  { text: "Once we realize that imperfect understanding is the human condition, there is no shame in being wrong, only in failing to correct our mistakes.", author: "George Soros" },
  { text: "The four most dangerous words in investing are: this time it is different.", author: "John Templeton" },
  { text: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { text: "In this business, if you are good, you are right six times out of ten. You are never going to be right nine times out of ten.", author: "Peter Lynch" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who does not, pays it.", author: "Albert Einstein" },
  { text: "Never spend your money before you have it.", author: "Thomas Jefferson" },
  { text: "He who has nothing to lose can risk everything. He who has much to lose risks nothing wisely.", author: "Nassim Nicholas Taleb" },
  { text: "Wealth is the slave of a wise man. The master of a fool.", author: "Seneca" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "The real measure of your wealth is how much you would be worth if you lost all your money.", author: "Unknown" },
  { text: "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs.", author: "Zig Ziglar" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  // ── DISCIPLINE
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "It is not what you preach, it is what you tolerate.", author: "Jocko Willink" },
  { text: "When the alarm goes off, do you get up out of bed, or do you lie there in comfort and fall back to sleep? If you have the discipline to get out of bed, you win.", author: "Jocko Willink" },
  { text: "All responsibility for success and failure rests with the leader. The leader must own everything in his or her world. There is no one else to blame.", author: "Jocko Willink" },
  { text: "Stop managing your emotions. Start managing your actions.", author: "Jocko Willink" },
  { text: "The most important conversation you will ever have is the one you have with yourself. And you have it every moment you are awake.", author: "David Goggins" },
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", author: "David Goggins" },
  { text: "The reason it is important to push hardest when you want to quit the most is because it helps you callous your mind.", author: "David Goggins" },
  { text: "If you really want to get hard, triple down on your weaknesses. That is the only way you can callous your mind.", author: "David Goggins" },
  { text: "Confidence came not from a perfect family or God-given talent. It came from personal accountability, which brought me self-respect, and self-respect will always light a way forward.", author: "David Goggins" },
  { text: "The mindset is not about seeking a result — it is more about the process of getting to that result. It is about the journey and the approach. It is a way of life.", author: "Kobe Bryant" },
  { text: "The only way I was able to pick up details on the court was by training my mind to do that off the court and focusing on every detail in my daily life.", author: "Kobe Bryant" },
  { text: "We all can be masters at our craft, but you have to make a choice. There are inherent sacrifices that come along with that.", author: "Kobe Bryant" },
  { text: "I cannot relate to lazy people. We do not speak the same language.", author: "Kobe Bryant" },
  { text: "I was not scared of missing, looking bad, or being embarrassed. I always focused on the long game.", author: "Kobe Bryant" },
  { text: "I have missed more than 9,000 shots in my career. I have lost almost 300 games. Twenty-six times I have been trusted to take the game-winning shot and missed. I have failed over and over again in my life. And that is why I succeed.", author: "Michael Jordan" },
  { text: "Some people want it to happen, some wish it would happen, others make it happen.", author: "Michael Jordan" },
  { text: "You must expect great things of yourself before you can do them.", author: "Michael Jordan" },
  { text: "Limits, like fears, are often just an illusion.", author: "Michael Jordan" },
  { text: "The key to success is failure. Failure teaches you what does not work. It teaches you to recalibrate.", author: "Michael Jordan" },
  { text: "Simplicity is the last step of art and the beginning of nature.", author: "Bruce Lee" },
  { text: "The height of cultivation runs to simplicity. Halfway cultivation runs to ornamentation.", author: "Bruce Lee" },
  { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
  { text: "Long-term consistency beats short-term intensity.", author: "Bruce Lee" },
  { text: "Notice that the stiffest tree is most easily cracked, while the bamboo or willow survives by bending with the wind.", author: "Bruce Lee" },
  { text: "Be tolerant with others and strict with yourself.", author: "Marcus Aurelius" },
  { text: "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being. What do I have to complain of, if I am going to do what I was born for?", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius" },
  { text: "Nowhere can man find a quieter or more untroubled retreat than in his own soul.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not enough to talk the talk. Those who truly have wisdom, they act it out.", author: "Epictetus" },
  { text: "Practice yourself, for heaven's sake, in little things; and thence proceed to greater.", author: "Epictetus" },
  { text: "Do not practice what you do not want to become.", author: "Jordan Peterson" },
  { text: "You have some vital role to play in the unfolding destiny of the world. You are, therefore, morally obliged to take care of yourself.", author: "Jordan Peterson" },
  { text: "We do not rise to the level of our expectations; we fall to the level of our training.", author: "Archilochus" },
  { text: "Talent is cheaper than table salt. What separates the talented individual from the successful one is a lot of hard work.", author: "Stephen King" },
  { text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.", author: "Vince Lombardi" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The more I practice, the luckier I get.", author: "Gary Player" },
  { text: "Pain is temporary. Quitting lasts forever.", author: "Lance Armstrong" },
  { text: "Amateurs practice until they get it right. Professionals practice until they cannot get it wrong.", author: "Unknown" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Plans are nothing; planning is everything.", author: "Dwight D. Eisenhower" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Self-control is the chief element in self-respect, and self-respect is the chief element in courage.", author: "Thucydides" },
  { text: "Without self-discipline, success is impossible, period.", author: "Lou Holtz" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "In reading the lives of great men, I found that the first victory they won was over themselves: self-discipline with all of them came first.", author: "Harry S. Truman" },
  // ── TRADING/INVESTING
  { text: "To anticipate the market is to gamble. To be patient and react only when the market gives the signal is to speculate.", author: "Jesse Livermore" },
  { text: "A loss never bothers me after I take it. I forget it overnight. But being wrong — not taking the loss — that is what does damage to the pocketbook and to the soul.", author: "Jesse Livermore" },
  { text: "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid, the mentally lazy, the person of inferior emotional balance, or the get-rich-quick adventurer.", author: "Jesse Livermore" },
  { text: "What beat me was not having brains enough to stick to my own game.", author: "Jesse Livermore" },
  { text: "The game is not in the buying and selling, but in the waiting.", author: "Jesse Livermore" },
  { text: "The most important rule of trading is to play great defense, not great offense.", author: "Paul Tudor Jones" },
  { text: "Do not ever average losers. Decrease your trading volume when you are doing poorly, not increase it.", author: "Paul Tudor Jones" },
  { text: "I am always thinking about losing money as opposed to making money. Do not focus on making money; focus on protecting what you have.", author: "Paul Tudor Jones" },
  { text: "I consider myself a premier market opportunist. I develop an idea on the market and pursue it from a very-low-risk standpoint until I have been repeatedly proven wrong, or until I change my viewpoint.", author: "Paul Tudor Jones" },
  { text: "Where you want to be is always in control, never wishing, always trading, and always first and foremost protecting your ass.", author: "Paul Tudor Jones" },
  { text: "It is not whether you are right or wrong that is important, but how much money you make when you are right and how much you lose when you are wrong.", author: "George Soros" },
  { text: "When I see a bubble forming, I rush in to buy, adding fuel to the fire. That is not irrational.", author: "George Soros" },
  { text: "Every bubble has two components: an underlying trend that prevails in reality and a misconception relating to that trend. When positive feedback develops between the trend and the misconception, a boom-bust process is set in motion.", author: "George Soros" },
  { text: "The financial markets generally are unpredictable. So one has to have different scenarios. The idea that you can actually predict what is going to happen contradicts my way of looking at the market.", author: "George Soros" },
  { text: "The way to build superior long-term returns is through preservation of capital and home runs.", author: "Stan Druckenmiller" },
  { text: "Diversification is very overrated. If you have really got a great thesis, put all your eggs in one basket and watch the basket very closely.", author: "Stan Druckenmiller" },
  { text: "The greatest investors make large concentrated bets where they have a lot of conviction.", author: "Stan Druckenmiller" },
  { text: "I have thought of many things with great conviction, and a lot of times I am wrong. When you are betting the ranch and the circumstances change, you have to change. That is how I have always managed money.", author: "Stan Druckenmiller" },
  { text: "The elements of good trading are: (1) cutting losses, (2) cutting losses, and (3) cutting losses.", author: "Ed Seykota" },
  { text: "If you cannot take a small loss, sooner or later you will take the mother of all losses.", author: "Ed Seykota" },
  { text: "Systems do not need to be changed. The trick is for a trader to develop a system with which he is compatible.", author: "Ed Seykota" },
  { text: "Win or lose, everybody gets what they want out of the market. Some people seem to like to lose, so they win by losing money.", author: "Ed Seykota" },
  { text: "The key to long-term survival and prosperity has a lot to do with the money management techniques incorporated into the technical system.", author: "Ed Seykota" },
  { text: "Undertrade, undertrade, undertrade is my second piece of advice. Whatever you think your position ought to be, cut it at least in half.", author: "Bruce Kovner" },
  { text: "When something happens to disturb my emotional equilibrium and my sense of what the world is like, I close out all positions related to that event.", author: "Bruce Kovner" },
  { text: "I have the ability to imagine configurations of the world different from today and really believe it can happen. I stay rational and disciplined under pressure.", author: "Bruce Kovner" },
  { text: "Almost anybody can make up a list of rules that are 80 percent as good as what we taught our people. What they could not do is give them the confidence to stick to those rules even when things are going bad.", author: "Richard Dennis" },
  { text: "On any individual trade it is almost all luck. But if you take something that has a 53 percent chance of working each time, over the long run there is a 100 percent chance of it working.", author: "Richard Dennis" },
  { text: "The hard, cold reality of trading is that every trade has an uncertain outcome.", author: "Mark Douglas" },
  { text: "The best traders not only take the risk, they have also learned to accept and embrace that risk.", author: "Mark Douglas" },
  { text: "I objectively identify my edges. I predefine the risk of every trade. I completely accept the risk or I am willing to let go of the trade. I act on my edges without reservation or hesitation.", author: "Mark Douglas" },
  { text: "Winning traders think in probabilities. They know any individual trade is just one of the next thousand.", author: "Mark Douglas" },
  { text: "A probabilistic mind-set pertaining to trading consists of five fundamental truths. First among them: anything can happen.", author: "Mark Douglas" },
  { text: "To win in the markets, we need to master three essential components of trading: sound psychology, a logical trading system, and an effective risk management plan.", author: "Alexander Elder" },
  { text: "Amateurs look for challenges; professionals look for easy trades. Losers get high from the action; the pros look for the best odds.", author: "Alexander Elder" },
  { text: "A good trader watches his capital as carefully as a professional scuba diver watches his air supply.", author: "Alexander Elder" },
  { text: "The markets are unforgiving, and emotional trading always results in losses.", author: "Alexander Elder" },
  { text: "Winners know they are responsible for their results; losers think they are not.", author: "Van K. Tharp" },
  { text: "Trading is 100 percent psychology — and that psychology includes your position sizing and your system development.", author: "Van K. Tharp" },
  { text: "The wisdom to know what to do, the skill to know how to do it, and the willingness to not do it when the timing is wrong — that is the complete trader.", author: "Van K. Tharp" },
  { text: "Frankly, I do not see markets; I see risks, rewards, and money.", author: "Larry Hite" },
  { text: "Throughout my financial career, I have continually witnessed examples of other people being ruined by a failure to respect risk. If you do not take a hard look at risk, it will take you.", author: "Larry Hite" },
  { text: "I have two basic rules about winning in trading as well as in life: if you do not bet, you cannot win. If you lose all your chips, you cannot bet.", author: "Larry Hite" },
  { text: "What seems too high and risky to the majority generally goes higher, and what seems low and cheap generally goes lower.", author: "William O'Neil" },
  { text: "Letting losses run is the most serious mistake made by most investors.", author: "William O'Neil" },
  { text: "I believe in analysis and not forecasting.", author: "Nicolas Darvas" },
  { text: "All you need is one pattern to make a living.", author: "Linda Raschke" },
  { text: "Good trading should be boring.", author: "Tom Basso" },
  { text: "Focus on the process and let the results take care of themselves.", author: "Tom Basso" },
  { text: "If you personalize losses, you cannot trade.", author: "Bruce Kovner" },
  // ── PATIENCE
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "No great thing is created suddenly, any more than a bunch of grapes or a fig. If you tell me that you desire a fig, I answer you that there must be time. Let it first blossom, then bear fruit, then ripen.", author: "Epictetus" },
  { text: "Nothing, Lucilius, is ours except time. We were entrusted by nature with the ownership of this single thing, so fleeting and slippery that anyone who will can oust us from possession.", author: "Seneca" },
  { text: "While we are postponing, life speeds by.", author: "Seneca" },
  { text: "Nothing is so wretched or foolish as to anticipate misfortunes. What madness it is in your expecting evil before it arrives.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "The present moment always will have been.", author: "Marcus Aurelius" },
  { text: "How much more grievous are the consequences of anger than the causes of it.", author: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present. You can endure any blow if you keep your reactions confined to what is happening right now.", author: "Marcus Aurelius" },
  { text: "In your actions, do not procrastinate. In your conversations, do not confuse. In your thoughts, do not wander.", author: "Marcus Aurelius" },
  { text: "All human errors are impatience, a premature breaking off of methodical procedure, an apparent fencing-in of what is apparently at issue.", author: "Franz Kafka" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Patience is not passive; on the contrary, it is concentrated strength.", author: "Bruce Lee" },
  { text: "If you are not willing to wait for something, you are not ready to receive it.", author: "Naval Ravikant" },
  { text: "I like to be very patient and then when I see something, go a little bit crazy.", author: "Warren Buffett" },
  { text: "We do not get paid for activity, just for being right. As to how long we will wait, we will wait indefinitely.", author: "Warren Buffett" },
  { text: "Lethargy bordering on sloth remains the cornerstone of our investment style.", author: "Warren Buffett" },
  { text: "Beware the investment activity that produces applause; the great moves are usually greeted by yawns.", author: "Warren Buffett" },
  { text: "The stock market is designed to transfer money from the Active to the Patient.", author: "Charlie Munger" },
  { text: "The idea that we should be doing something at all times is the enemy of doing the right thing.", author: "Ray Dalio" },
  { text: "To anticipate the market is to gamble. To be patient and react only when the market gives the signal is to speculate. The game is not in the buying and selling, but in the waiting.", author: "Jesse Livermore" },
  { text: "I was convinced whatever was wrong was wrong with me and not with the market. I waited. I observed.", author: "Jesse Livermore" },
  { text: "Being a little late in a trade is insurance that your opinion is correct. In other words, do not be an impatient trader.", author: "Jesse Livermore" },
  { text: "The most difficult part of trading is not the analysis but the waiting — waiting for the right setup, at the right price, in the right conditions.", author: "Alexander Elder" },
  { text: "Do not just do something. Stand there. Learn what the market is telling you before you act.", author: "Paul Tudor Jones" },
  { text: "Most investors want to do today what they should have done yesterday. The discipline of waiting for the right moment — and having the courage to act boldly then — separates the great from the merely good.", author: "Larry Hite" },
  { text: "You can know every concept in the playbook and still lose money if you cannot sit on your hands when conditions are not perfect. That patience is harder to learn than any setup, but it is the actual edge.", author: "Unknown (Trading Wisdom)" },
  { text: "Combining many markets and strategies gives you the best chance to succeed — but you have to be patient enough to let the process work.", author: "Tom Basso" },
  { text: "When you really want something, you have to be willing to pay the price — which is usually time, not money.", author: "Jordan Peterson" },
  { text: "A moment of patience in a moment of anger saves you a hundred moments of regret.", author: "Chinese Proverb" },
  { text: "There is a time for fishing and a time for drying nets.", author: "Vietnamese Proverb" },
  { text: "Patience is the companion of wisdom.", author: "Saint Augustine" },
  { text: "A disciplined mind leads to happiness, and an undisciplined mind leads to suffering.", author: "Dalai Lama" },
  { text: "Infinite patience brings immediate results.", author: "Wayne Dyer" },
  { text: "He that can have patience can have what he will.", author: "Benjamin Franklin" },
  { text: "In the stock market, the most important organ is the stomach. It is not the brain.", author: "Peter Lynch" },
  { text: "In my experience, the secret to profiting in the stock market is not to be right more often but to wait — with absolute certainty — for the rare moments when being right pays dramatically more than being wrong costs.", author: "Nicolas Darvas" },
  { text: "Good trading should be boring. If you are excited, you are probably doing something wrong.", author: "Tom Basso" },
  { text: "The ox is slow, but the earth is patient.", author: "Chinese Proverb" },
  { text: "Knowing trees, I understand the meaning of patience. Knowing grass, I can appreciate persistence.", author: "Hal Borland" },
  { text: "It is not enough to know your edge. You must also know when it is not present — and resist acting until it is.", author: "Mark Douglas" },
  { text: "I believe in analysis and not forecasting. The box tells you when the stock is ready to move. Until then, wait.", author: "Nicolas Darvas" },
  { text: "Good things come to those who wait, but only the things left by those who hustle.", author: "Abraham Lincoln" },
  { text: "Patience, persistence and perspiration make an unbeatable combination for success.", author: "Napoleon Hill" },
  { text: "Have patience with all things but, first of all, with yourself.", author: "Saint Francis de Sales" },
  { text: "Rivers know this: there is no hurry. We shall get there someday.", author: "A.A. Milne" },
  { text: "Never think that God's delays are God's denials. Hold on; hold fast; hold out. Patience is genius.", author: "Comte de Buffon" },
  { text: "Seek first to understand, then to be understood.", author: "Stephen Covey" },
];

function getDailyQuote() {
  // Cycles every 12 hours — new quote morning and evening
  const halfDayIndex = Math.floor(Date.now() / 43_200_000);
  return STOIC_QUOTES[halfDayIndex % STOIC_QUOTES.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'LATE NIGHT OPS';
  if (h < 12) return 'MORNING BRIEF';
  if (h < 17) return 'AFTERNOON SITREP';
  return 'EVENING DEBRIEF';
}

function useDailyCalories() {
  const [gymKcal,   setGymKcal]   = useState(0);
  const [stepKcal,  setStepKcal]  = useState(0);
  const [fastHours, setFastHours] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Steps calories: ~0.038 kcal/step for 57 kg
    try {
      const raw = localStorage.getItem('grid_steps');
      if (raw) {
        const all: Record<string, number> = JSON.parse(raw);
        setStepKcal(Math.round((all[today] || 0) * 0.038));
      }
    } catch {}

    // Gym calories: sum kcal of checked exercises today
    try {
      let total = 0;
      for (const day of GYM_DAYS) {
        for (const suffix of ['', '_alt']) {
          const key = `grid_gym_checks_${day.id}${suffix}_${today}`;
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const checks: Record<string, boolean> = JSON.parse(raw);
          const exercises = suffix === '_alt' ? (day.alt?.exercises || []) : day.exercises;
          for (const ex of exercises) {
            if (checks[ex.id] && ex.kcal) total += ex.kcal;
          }
        }
      }
      setGymKcal(total);
    } catch {}

    // Fasting hours
    try {
      const fs = localStorage.getItem('grid_fast_start');
      if (fs) setFastHours(Math.min((Date.now() - Number(fs)) / 3600000, 24));
    } catch {}
  }, []);

  // BMR burn during fast: ~58 kcal/hr (1396 kcal/day ÷ 24h for 57 kg woman, 22yo)
  const fastKcal = Math.round(fastHours * 58);
  const total = stepKcal + gymKcal + fastKcal;
  return { stepKcal, gymKcal, fastKcal, fastHours, total };
}

export default function Dashboard({ profile, habits, onNavigate, onCompleteHabit }: Props) {
  const [cycleStart, setCycleStart] = useState<string | null>(null);
  const cals = useDailyCalories();

  useEffect(() => {
    const sc = localStorage.getItem('grid_cycle_start');
    if (sc) setCycleStart(sc);
  }, []);

  const lvl        = getLevel(profile.xp);
  const quote      = getDailyQuote();
  const incomplete = habits.filter(h => !h.completedToday);
  const doneCount  = habits.filter(h => h.completedToday).length;
  const total      = habits.length;
  const lifeScore  = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone    = total > 0 && doneCount === total;

  const topStreak      = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const topStreakHabit = habits.find(h => h.streak === topStreak && h.streak > 0);

  const phase      = getCyclePhase(cycleStart);
  const dayOfCycle = getDayOfCycle(cycleStart);
  const phaseData  = phase ? CYCLE_PHASES[phase] : null;

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-4" style={{ borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <GridLogo variant="lockup" size={36} />
          <div className="text-right">
            <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-amber)', letterSpacing: '2px' }}>
              {profile.codename}
            </div>
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>
              {lvl.title} · LV{lvl.level} · {profile.xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: 'var(--ng-border)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${lvl.progress}%`, background: 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div className="px-4">

        {/* ── Daily quote — atmospheric, no box ──────────────── */}
        <div style={{ padding: '28px 4px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, color: 'rgba(255,184,0,0.12)', fontFamily: 'Georgia, serif', lineHeight: 0.7, userSelect: 'none', marginBottom: 10 }}>"</div>
          <div className="font-mono" style={{ fontSize: 13, color: 'rgba(232,232,240,0.8)', lineHeight: 1.9, fontStyle: 'italic' }}>
            {quote.text}
          </div>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '3px', marginTop: 14 }}>
            {quote.author}
          </div>
          <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-dimmer)', letterSpacing: '2px', marginTop: 4 }}>
            {getGreeting()}
          </div>
        </div>

        {/* ── Thin divider ───────────────────────────────────── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-border), transparent)', marginBottom: 24 }} />

        {/* ── Calories burned today ──────────────────────────── */}
        {(cals.total > 0) && (
          <div style={{ marginBottom: 24, padding: '16px', background: 'rgba(255,71,87,0.04)', border: '0.5px solid rgba(255,71,87,0.15)', borderRadius: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-red)', letterSpacing: '3px' }}>🔥 CALORIES BURNED TODAY</div>
              <div className="font-orbitron font-black" style={{ fontSize: 22, color: 'var(--ng-red)', lineHeight: 1, textShadow: '0 0 20px rgba(255,71,87,0.4)' }}>{cals.total.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cals.stepKcal > 0 && (
                <div className="flex items-center justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 12, background: 'var(--ng-cyan)', borderRadius: 1 }} />
                    <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>STEPS</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-cyan)' }}>{cals.stepKcal} kcal</span>
                </div>
              )}
              {cals.gymKcal > 0 && (
                <div className="flex items-center justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 12, background: 'var(--ng-amber)', borderRadius: 1 }} />
                    <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>GYM</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-amber)' }}>{cals.gymKcal} kcal</span>
                </div>
              )}
              {cals.fastKcal > 0 && (
                <div className="flex items-center justify-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 12, background: 'var(--ng-purple)', borderRadius: 1 }} />
                    <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>FAST ({Math.round(cals.fastHours)}h)</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-purple)' }}>{cals.fastKcal} kcal</span>
                </div>
              )}
            </div>
            <div style={{ height: 1, background: 'rgba(255,71,87,0.12)', margin: '10px 0 0' }} />
          </div>
        )}

        {/* ── Streak hero — ambient, no hard border ──────────── */}
        {topStreak > 0 ? (
          <div style={{ padding: '20px 16px 24px', marginBottom: 24, background: 'linear-gradient(135deg, rgba(255,184,0,0.07) 0%, rgba(255,184,0,0.02) 100%)', borderRadius: 16 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 8, opacity: 0.8 }}>ACTIVE STREAK</div>
                {topStreakHabit && (
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 10 }}>
                    {topStreakHabit.icon} {topStreakHabit.name}
                  </div>
                )}
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '2px', opacity: 0.7 }}>
                  DON'T BREAK IT
                </div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 64, color: 'var(--ng-amber)', lineHeight: 1, textShadow: '0 0 40px rgba(255,184,0,0.35)' }}>
                {topStreak}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 16px 24px', marginBottom: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '3px', marginBottom: 6 }}>NO ACTIVE STREAK</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)' }}>Complete a habit to start one</div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 64, color: 'rgba(42,42,58,0.8)', lineHeight: 1 }}>0</div>
            </div>
          </div>
        )}

        {/* ── ALL DONE celebration ───────────────────────────── */}
        {allDone && (
          <div style={{ padding: '28px 0', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-green), transparent)', marginBottom: 20 }} />
            <div className="font-orbitron font-black" style={{ fontSize: 12, color: 'var(--ng-green)', letterSpacing: '4px', marginBottom: 8 }}>
              ALL PROTOCOLS COMPLETE
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              {total} habits · {lifeScore}% today
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-green), transparent)', marginTop: 20 }} />
          </div>
        )}

        {/* ── Today's protocol — grouped container ──────────── */}
        {total === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 12 }}>NO PROTOCOL YET</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-dimmer)', lineHeight: 1.7, marginBottom: 20 }}>
              Build your daily habit stack<br />to start earning XP and streaks.
            </div>
            <button onClick={() => onNavigate('habits')} className="btn-green" style={{ fontSize: 9, padding: '8px 24px' }}>
              BUILD PROTOCOL →
            </button>
          </div>
        ) : !allDone && (
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '3px' }}>TODAY'S PROTOCOL</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{doneCount}/{total}</div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--ng-border)', marginBottom: 12, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lifeScore}%`, background: 'var(--ng-green)', transition: 'width 0.5s ease' }} />
            </div>

            {/* Grouped habit list — single container, dividers between items */}
            <div style={{ background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 12, overflow: 'hidden' }}>
              {incomplete.map((h, i) => {
                const color = CATEGORY_COLORS[h.category];
                return (
                  <button key={h.id} onClick={() => onCompleteHabit(h.id)}
                    className="w-full text-left"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px',
                      background: 'transparent',
                      borderBottom: i < incomplete.length - 1 ? '1px solid var(--ng-border)' : 'none',
                      borderLeft: `3px solid ${color}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      minHeight: 56,
                    }}>
                    <div style={{ width: 20, height: 20, border: `1.5px solid ${color}44`, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{h.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span className="font-orbitron" style={{ fontSize: 8, color, letterSpacing: '1px' }}>{h.category.toUpperCase()}</span>
                        <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{h.xpReward}xp</span>
                        {h.streak > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {h.streak}d</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {doneCount > 0 && (
              <div style={{ marginTop: 8, padding: '7px 12px', background: 'rgba(0,255,65,0.04)' }}>
                <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>
                  ✓ LOGGED: {doneCount} habit{doneCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button onClick={() => onNavigate('habits')} className="w-full font-orbitron"
              style={{ marginTop: 8, padding: '9px', fontSize: 8, letterSpacing: '2px', color: 'var(--ng-dimmer)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              MANAGE HABITS →
            </button>
          </div>
        )}

        {/* ── Phase context strip ────────────────────────────── */}
        {phaseData && (
          <button onClick={() => onNavigate('body')} className="w-full text-left"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: phaseData.bg, borderRadius: 12, cursor: 'pointer', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{phaseData.icon}</span>
              <div>
                <div className="font-orbitron" style={{ fontSize: 9, color: phaseData.color, letterSpacing: '2px' }}>
                  {phaseData.label} PHASE · DAY {dayOfCycle}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 2 }}>{phaseData.headline}</div>
              </div>
            </div>
            <span className="font-orbitron" style={{ fontSize: 8, color: phaseData.color, letterSpacing: '1px', flexShrink: 0 }}>VIEW →</span>
          </button>
        )}

      </div>
    </div>
  );
}
