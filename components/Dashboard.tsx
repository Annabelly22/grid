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
  dailyPriorities: string[];
  onSetPriorities: (items: string[]) => void;
}

const STOIC_QUOTES: { text: string; author: string }[] = [
  // ── MINDSET (65)
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Ambition is tying your well-being to what other people say and do. Sanity is tying it to your own actions.", author: "Marcus Aurelius" },
  { text: "Such as are your habitual thoughts, such also will be the character of your mind.", author: "Marcus Aurelius" },
  { text: "Men are disturbed not by things, but by the opinions about things.", author: "Epictetus" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "Difficulties are things that show a person what they are.", author: "Epictetus" },
  { text: "It is impossible for a man to learn what he thinks he already knows.", author: "Epictetus" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "As long as you live, keep learning how to live.", author: "Seneca" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.", author: "Viktor Frankl" },
  { text: "Those who have a why to live can bear with almost any how.", author: "Viktor Frankl" },
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
  { text: "The most terrifying thing is to accept oneself completely.", author: "Carl Jung" },
  { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung" },
  { text: "I am not what happened to me. I am what I choose to become.", author: "Carl Jung" },
  { text: "One must still have chaos in oneself to be able to give birth to a dancing star.", author: "Friedrich Nietzsche" },
  { text: "Become who you are.", author: "Friedrich Nietzsche" },
  { text: "Your mind is the operating system. Everything else is just an app.", author: "Naval Ravikant" },
  { text: "Desire is a contract you make with yourself to be unhappy until you get what you want.", author: "Naval Ravikant" },
  { text: "The quality of your thinking determines the quality of your life.", author: "Naval Ravikant" },
  { text: "Ego is the enemy of what you want and of what you have.", author: "Ryan Holiday" },
  { text: "Most people want to be the noun without doing the verb. They want the title without the work.", author: "Ryan Holiday" },
  { text: "Can you imagine yourself in ten years if, instead of avoiding the things you know you should do, you actually did them every single day?", author: "Jordan Peterson" },
  { text: "You should never sacrifice what you could be for what you are.", author: "Jordan Peterson" },
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "We are living in a culture entirely hypnotized by the illusion of time.", author: "Alan Watts" },
  { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Success is the product of daily habits — not once-in-a-lifetime transformations.", author: "James Clear" },
  { text: "In a growth mindset, challenges are exciting rather than threatening.", author: "Carol Dweck" },
  { text: "Becoming is better than being. The fixed mindset does not allow people the luxury of becoming.", author: "Carol Dweck" },
  { text: "Absorb what is useful, discard what is not, add what is uniquely your own.", author: "Bruce Lee" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Bruce Lee" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "You cannot get out of a problem with the same thinking that got you into it.", author: "Albert Einstein" },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "We do not see things as they are, we see them as we are.", author: "Anais Nin" },
  { text: "The greatest prison people live in is the fear of what other people think.", author: "David Icke" },
  { text: "Without effort, your talent is nothing more than unmet potential.", author: "Angela Duckworth" },
  { text: "Enthusiasm is common. Endurance is rare.", author: "Angela Duckworth" },
  { text: "As much as talent counts, effort counts twice.", author: "Angela Duckworth" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Your life does not get better by chance. It gets better by change.", author: "Jim Rohn" },
  { text: "Do not accept the roles that society foists on you. Re-create yourself by forging a new identity.", author: "Robert Greene" },
  { text: "The greatest danger is that you will allow the past to define your future.", author: "Robert Greene" },
  { text: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.", author: "Arnold Schwarzenegger" },
  { text: "You are not the voice in your head. You are the awareness that hears it.", author: "Michael Singer" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "Pain plus reflection equals progress.", author: "Ray Dalio" },
  { text: "Forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "The distance between who I am and who I want to be is only separated by what I do.", author: "Unknown" },
  { text: "People don't decide their futures. They decide their habits and their habits decide their futures.", author: "F.M. Alexander" },
  { text: "The way we see the problem is the problem.", author: "Stephen Covey" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.", author: "Albert Einstein" },
  { text: "No valid plans for the future can be made by those who have no capacity for living now.", author: "Alan Watts" },
  { text: "History doesn't repeat itself, but it does rhyme.", author: "Mark Twain" },
  { text: "Do not confuse motion and progress. A rocking horse keeps moving but does not make any progress.", author: "Alfred A. Montapert" },
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" },
  { text: "Superior intelligence is the ability to hold two contradictory ideas in mind simultaneously and still retain the ability to function.", author: "F. Scott Fitzgerald" },
  // ── TRADING (62)
  { text: "To anticipate the market is to gamble. To be patient and react only when the market gives the signal is to speculate.", author: "Jesse Livermore" },
  { text: "A loss never bothers me after I take it. I forget it overnight. But being wrong — not taking the loss — that is what does damage to the pocketbook and to the soul.", author: "Jesse Livermore" },
  { text: "The game is not in the buying and selling, but in the waiting.", author: "Jesse Livermore" },
  { text: "What beat me was not having brains enough to stick to my own game.", author: "Jesse Livermore" },
  { text: "It never was my thinking that made the big money for me. It always was my sitting.", author: "Jesse Livermore" },
  { text: "The most important rule of trading is to play great defense, not great offense.", author: "Paul Tudor Jones" },
  { text: "Do not ever average losers. Decrease your trading volume when you are doing poorly, not increase it.", author: "Paul Tudor Jones" },
  { text: "I am always thinking about losing money as opposed to making money. Focus on protecting what you have.", author: "Paul Tudor Jones" },
  { text: "Where you want to be is always in control, never wishing, always trading, and always first and foremost protecting your ass.", author: "Paul Tudor Jones" },
  { text: "Do not just do something. Stand there. Learn what the market is telling you before you act.", author: "Paul Tudor Jones" },
  { text: "It is not whether you are right or wrong that is important, but how much money you make when you are right and how much you lose when you are wrong.", author: "George Soros" },
  { text: "Market prices are always wrong in the sense that they present a biased view of the future.", author: "George Soros" },
  { text: "The elements of good trading are: cutting losses, cutting losses, and cutting losses.", author: "Ed Seykota" },
  { text: "If you cannot take a small loss, sooner or later you will take the mother of all losses.", author: "Ed Seykota" },
  { text: "Win or lose, everybody gets what they want out of the market.", author: "Ed Seykota" },
  { text: "The trend is your friend except at the end where it bends.", author: "Ed Seykota" },
  { text: "Undertrade, undertrade, undertrade. Whatever you think your position ought to be, cut it at least in half.", author: "Bruce Kovner" },
  { text: "The first rule of trading: do not get caught in a situation in which you can lose a great deal of money for reasons you don't understand.", author: "Bruce Kovner" },
  { text: "If you personalize losses, you cannot trade.", author: "Bruce Kovner" },
  { text: "Most traders who fail have large egos and cannot admit they are wrong.", author: "Bruce Kovner" },
  { text: "The hard, cold reality of trading is that every trade has an uncertain outcome.", author: "Mark Douglas" },
  { text: "The best traders not only take the risk, they have also learned to accept and embrace that risk.", author: "Mark Douglas" },
  { text: "Winning traders think in probabilities. They know any individual trade is just one of the next thousand.", author: "Mark Douglas" },
  { text: "An edge is nothing more than an indication of a higher probability of one thing happening over another.", author: "Mark Douglas" },
  { text: "Learning to accept the risk is a trading skill — the most important skill you can learn.", author: "Mark Douglas" },
  { text: "Amateurs look for challenges; professionals look for easy trades. Losers get high from the action; the pros look for the best odds.", author: "Alexander Elder" },
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "A good trader watches his capital as carefully as a professional scuba diver watches his air supply.", author: "Alexander Elder" },
  { text: "When a beginner wins, he feels brilliant and invincible. Then he takes wild risk and loses everything.", author: "Alexander Elder" },
  { text: "Winners know they are responsible for their results; losers think they are not.", author: "Van K. Tharp" },
  { text: "Trading is 100 percent psychology — and that psychology includes your position sizing and your system development.", author: "Van K. Tharp" },
  { text: "The way to build superior long-term returns is through preservation of capital and home runs.", author: "Stan Druckenmiller" },
  { text: "Diversification is very overrated. If you have a great thesis, put all your eggs in one basket and watch the basket very closely.", author: "Stan Druckenmiller" },
  { text: "The most important thing in making money is not letting your losses get out of hand.", author: "Marty Schwartz" },
  { text: "I turned from a loser to a winner when I was able to separate my ego from my trading.", author: "Marty Schwartz" },
  { text: "Good trading should be boring. If you are excited, you are probably doing something wrong.", author: "Tom Basso" },
  { text: "Investment psychology is by far the most important element, followed by risk control, with entry and exit signals being least important.", author: "Tom Basso" },
  { text: "Almost anybody can make up a list of rules that are 80% as good as what we taught. What they cannot do is give them the confidence to stick to those rules when things are going bad.", author: "Richard Dennis" },
  { text: "I always say you could publish rules in a newspaper and no one would follow them. The key is consistency and discipline.", author: "Richard Dennis" },
  { text: "The market does not care how you feel. It will not prop up your ego or console you when you are down.", author: "Richard Dennis" },
  { text: "Markets can remain irrational longer than you can remain solvent.", author: "John Maynard Keynes" },
  { text: "In trading, the exits are more important than the entries.", author: "Jack Schwager" },
  { text: "There is no single market secret to discover, no single correct way to trade the markets.", author: "Jack Schwager" },
  { text: "The best trades are the ones in which you have all three things going for you: fundamentals, technicals, and market tone.", author: "Michael Marcus" },
  { text: "The most important is discipline. Second, patience — if you have a good trade on, you have to be able to stay with it.", author: "Michael Marcus" },
  { text: "Frankly, I do not see markets; I see risks, rewards, and money.", author: "Larry Hite" },
  { text: "If you do not bet, you cannot win. If you lose all your chips, you cannot bet.", author: "Larry Hite" },
  { text: "Cut your losses at 7 to 8 percent below your cost. This is the most important rule for every investor.", author: "William O'Neil" },
  { text: "Letting losses run is the most serious mistake made by most investors.", author: "William O'Neil" },
  { text: "Discipline is the number one factor in trading success: follow your plan, take losses, and let winners run.", author: "William O'Neil" },
  { text: "All you need is one pattern to make a living.", author: "Linda Bradford Raschke" },
  { text: "Good trading is a matter of knowing when to be aggressive and when to be patient.", author: "Linda Bradford Raschke" },
  { text: "Only look for low-risk/high-reward trades or high-probability setups. When you don't have any signals, don't trade.", author: "Linda Bradford Raschke" },
  { text: "Don't try to make a profit on a bad trade. Just try to find the best place to get out.", author: "Linda Bradford Raschke" },
  { text: "In this business, if you are good, you are right six times out of ten. You are never going to be right nine times out of ten.", author: "Peter Lynch" },
  { text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", author: "Philip Fisher" },
  { text: "The four most dangerous words in investing are: this time it is different.", author: "John Templeton" },
  { text: "The time of maximum pessimism is the best time to buy, and the time of maximum optimism is the best time to sell.", author: "John Templeton" },
  { text: "In the stock market, the most important organ is the stomach.", author: "Peter Lynch" },
  { text: "The stock market is a device for transferring money from the active to the patient.", author: "Warren Buffett" },
  { text: "If investing is entertaining, if you're having fun, you're probably not making money. Good investing is boring.", author: "George Soros" },
  { text: "You can know every concept in the playbook and still lose money if you cannot sit on your hands when conditions are not perfect.", author: "Unknown" },
  // ── STOICISM (62)
  { text: "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.", author: "Marcus Aurelius" },
  { text: "Seek not the good in external things; seek it in yourself.", author: "Epictetus" },
  { text: "The whole future lies in uncertainty: live immediately.", author: "Seneca" },
  { text: "Wealth is the slave of a wise man. The master of a fool.", author: "Seneca" },
  { text: "Be tolerant with others and strict with yourself.", author: "Marcus Aurelius" },
  { text: "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius" },
  { text: "Nowhere can man find a quieter or more untroubled retreat than in his own soul.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love.", author: "Marcus Aurelius" },
  { text: "In your actions, do not procrastinate. In your conversations, do not confuse. In your thoughts, do not wander.", author: "Marcus Aurelius" },
  { text: "How much more grievous are the consequences of anger than the causes of it.", author: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "It is not enough to talk the talk. Those who truly have wisdom, they act it out.", author: "Epictetus" },
  { text: "Practice yourself in little things; and thence proceed to greater.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "No great thing is created suddenly, any more than a bunch of grapes or a fig.", author: "Epictetus" },
  { text: "You may be unconquerable if you enter into no contest that is not in your power to win.", author: "Epictetus" },
  { text: "Nothing, Lucilius, is ours except time.", author: "Seneca" },
  { text: "While we are postponing, life speeds by.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Nothing is so wretched or foolish as to anticipate misfortunes before they arrive.", author: "Seneca" },
  { text: "To be everywhere is to be nowhere.", author: "Seneca" },
  { text: "If you have a garden and a library, you have everything you need.", author: "Cicero" },
  { text: "To be content with what we possess is the greatest and most secure of riches.", author: "Cicero" },
  { text: "More is lost by indecision than by wrong decision.", author: "Cicero" },
  { text: "Well-being is realized by small steps, but is truly no small thing.", author: "Zeno of Citium" },
  { text: "We have two ears and one mouth, so we should listen more than we speak.", author: "Zeno of Citium" },
  { text: "Every good is gained by toil.", author: "Musonius Rufus" },
  { text: "If one accomplishes some good with toil, the toil passes, but the good remains.", author: "Musonius Rufus" },
  { text: "Virtue is not simply theoretical knowledge, but it is practical application as well.", author: "Musonius Rufus" },
  { text: "He will win who knows when to fight and when not to fight.", author: "Sun Tzu" },
  { text: "Supreme excellence consists in breaking the enemy's resistance without fighting.", author: "Sun Tzu" },
  { text: "Opportunities multiply as they are seized.", author: "Sun Tzu" },
  { text: "Know your enemy and know yourself and you can fight a hundred battles without disaster.", author: "Sun Tzu" },
  { text: "A Stoic is someone who transforms fear into prudence, pain into transformation, mistakes into initiation, and desire into undertaking.", author: "Nassim Taleb" },
  { text: "The present moment always will have been.", author: "Marcus Aurelius" },
  { text: "A man who has not passed through the inferno of his passions has never overcome them.", author: "Carl Jung" },
  { text: "A rational person can find peace by cultivating indifference to things outside their control.", author: "Naval Ravikant" },
  { text: "Confidence came not from a perfect family or God-given talent. It came from personal accountability.", author: "David Goggins" },
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", author: "David Goggins" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "It is not what you preach, it is what you tolerate.", author: "Jocko Willink" },
  { text: "Ego clouds and disrupts everything: planning, accepting advice, and constructive criticism.", author: "Jocko Willink" },
  { text: "We do not rise to the level of our expectations; we fall to the level of our training.", author: "Archilochus" },
  { text: "Mastery requires endurance. Those who last are those who show up again and again.", author: "Robert Greene" },
  { text: "Self-discipline is the master virtue. Without it, no other virtue is possible.", author: "Brian Tracy" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "The quality of a person's life is in direct proportion to their commitment to excellence.", author: "Vince Lombardi" },
  { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
  { text: "Silence is the sleep that nourishes wisdom.", author: "Francis Bacon" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Act without expectation.", author: "Lao Tzu" },
  { text: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Self-control is the chief element in self-respect, and self-respect is the chief element in courage.", author: "Thucydides" },
  { text: "Lead me, Zeus, and you too, Destiny, wherever you have assigned me; I will follow. If I refuse, I'll be dragged.", author: "Cleanthes" },
  { text: "The measure of a man is what he does with power.", author: "Pittacus of Mytilene" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  // ── PEACE OF MIND (58)
  { text: "All negativity is caused by an accumulation of psychological time and denial of the present.", author: "Eckhart Tolle" },
  { text: "The primary cause of unhappiness is never the situation but your thoughts about it.", author: "Eckhart Tolle" },
  { text: "Realize deeply that the present moment is all you will ever have.", author: "Eckhart Tolle" },
  { text: "Most people treat the present moment as if it were an obstacle to overcome.", author: "Eckhart Tolle" },
  { text: "What you resist, persists. What you look at disappears.", author: "Eckhart Tolle" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "People sacrifice the present for the future. But life is available only in the present.", author: "Thich Nhat Hanh" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Walk as if you are kissing the Earth with your feet.", author: "Thich Nhat Hanh" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "Letting go gives us freedom, and freedom is the only condition for happiness.", author: "Thich Nhat Hanh" },
  { text: "When you do things from your soul, you feel a river moving in you, a joy.", author: "Rumi" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "Patience is not sitting and waiting, it is foreseeing. It is looking at the thorn and seeing the rose, looking at the night and seeing the day.", author: "Rumi" },
  { text: "When I run after what I think I want, my days are a furnace of distress and anxiety. If I sit in my own place of patience, what I need flows to me.", author: "Rumi" },
  { text: "Lovers are patient and know that the moon needs time to become full.", author: "Rumi" },
  { text: "Your pain is the breaking of the shell that encloses your understanding.", author: "Khalil Gibran" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Khalil Gibran" },
  { text: "The deeper that sorrow carves into your being, the more joy you can contain.", author: "Khalil Gibran" },
  { text: "I have learned silence from the talkative, toleration from the intolerant, and kindness from the unkind.", author: "Khalil Gibran" },
  { text: "A person who thinks all the time has nothing to think about except thoughts. So he loses touch with reality.", author: "Alan Watts" },
  { text: "Through our eyes, the universe is perceiving itself. Through our ears, the universe is listening to its harmonies.", author: "Alan Watts" },
  { text: "Trying to define yourself is like trying to bite your own teeth.", author: "Alan Watts" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Your work is to discover your work, and then with all your heart to give yourself to it.", author: "Buddha" },
  { text: "A disciplined mind leads to happiness, and an undisciplined mind leads to suffering.", author: "Dalai Lama" },
  { text: "Tolerance and patience rooted in deep wisdom are the antidote to anger.", author: "Dalai Lama" },
  { text: "Do not let the behavior of others destroy your inner peace.", author: "Dalai Lama" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { text: "You are the sky. Everything else is just the weather.", author: "Pema Chodron" },
  { text: "Inner peace begins the moment you choose not to allow another person or event to control your emotions.", author: "Pema Chodron" },
  { text: "Be here now.", author: "Ram Dass" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { text: "If you correct your mind, the rest of your life will fall into place.", author: "Lao Tzu" },
  { text: "Life is a series of natural and spontaneous changes. Do not resist them.", author: "Lao Tzu" },
  { text: "Simplicity, patience, compassion. These three are your greatest treasures.", author: "Lao Tzu" },
  { text: "When you realize nothing is lacking, the whole world belongs to you.", author: "Lao Tzu" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "Calmness is the cradle of power.", author: "Josiah Gilbert Holland" },
  { text: "It is not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "Worry never robs tomorrow of its sorrow. It only saps today of its joy.", author: "Leo Buscaglia" },
  { text: "Silence is not empty. It is full of answers.", author: "Unknown" },
  { text: "You can have the mind of a warrior and the heart of a monk.", author: "Unknown" },
  { text: "Stop the glorification of busy. Rest is productive.", author: "Unknown" },
  { text: "Never respond to an angry person with a fiery comeback. Silence is the most powerful scream.", author: "Unknown" },
  { text: "Peace of mind is not the absence of conflict from life, but the ability to cope with it.", author: "Unknown" },
  { text: "When you can't control what's happening, challenge yourself to control the way you respond. That's where your power is.", author: "Unknown" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson" },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
  { text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.", author: "Joyce Meyer" },
  { text: "Dripping water hollows out stone not through force but through persistence.", author: "Ovid" },
  { text: "All things are difficult before they are easy.", author: "Thomas Fuller" },
  { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A.A. Milne" },
  { text: "Wait. Be patient. The storm will pass. The spring will come.", author: "Robert H. Schuller" },
  { text: "Have patience with all things, but first of all with yourself.", author: "Saint Francis de Sales" },
  { text: "You cannot control the results, only your actions.", author: "Alan Lokos" },
  { text: "Patience is the calm acceptance that things can happen in a different order than the one you have in mind.", author: "David G. Allen" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
  { text: "Inner peace is the new success.", author: "Unknown" },
  // ── FINANCIAL SUCCESS (58)
  { text: "Rule No.1: Never lose money. Rule No.2: Never forget Rule No.1.", author: "Warren Buffett" },
  { text: "Someone is sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "The first rule of compounding: never interrupt it unnecessarily.", author: "Charlie Munger" },
  { text: "It is remarkable how much long-term advantage we have gotten by trying to be consistently not stupid, instead of trying to be very intelligent.", author: "Charlie Munger" },
  { text: "Spend each day trying to be a little wiser than you were when you woke up.", author: "Charlie Munger" },
  { text: "Invert, always invert: turn a situation or problem upside down. Look at it backwards.", author: "Charlie Munger" },
  { text: "The highest form of wealth is the ability to wake up every morning and say: I can do whatever I want today.", author: "Morgan Housel" },
  { text: "Wealth is hidden. It is income not spent. Wealth is an option not yet taken to buy something later.", author: "Morgan Housel" },
  { text: "Saving money is the gap between your ego and your income.", author: "Morgan Housel" },
  { text: "Controlling your time is the highest dividend money pays.", author: "Morgan Housel" },
  { text: "Wealth is what you don't see. It's the cars not bought, the watches not worn, the clothes forgone.", author: "Morgan Housel" },
  { text: "Progress happens too slowly to notice, but setbacks happen too quickly to ignore.", author: "Morgan Housel" },
  { text: "Risk is what's left over when you think you've thought of everything.", author: "Morgan Housel" },
  { text: "Money's greatest intrinsic value is its ability to give you control over your time.", author: "Morgan Housel" },
  { text: "If you are not aggressive, you are not going to make money, and if you are not defensive, you are not going to keep money.", author: "Ray Dalio" },
  { text: "The most valuable habit I have acquired is using pain to trigger quality reflections.", author: "Ray Dalio" },
  { text: "You will get rich by giving society what it wants but does not yet know how to get.", author: "Naval Ravikant" },
  { text: "Specific knowledge is knowledge that you cannot be trained for. If society can train you, it can train someone else and replace you.", author: "Naval Ravikant" },
  { text: "Apply specific knowledge, with leverage, and eventually you will get what you deserve.", author: "Naval Ravikant" },
  { text: "The philosophy of the rich and the poor is this: the rich invest their money and spend what is left. The poor spend their money and invest what is left.", author: "Robert Kiyosaki" },
  { text: "An asset puts money in your pocket. A liability takes money out of your pocket.", author: "Robert Kiyosaki" },
  { text: "The poor and the middle class work for money. The rich have money work for them.", author: "Robert Kiyosaki" },
  { text: "The man who acquires the ability to take full possession of his own mind may take possession of anything else to which he is justly entitled.", author: "Andrew Carnegie" },
  { text: "If you want to be rich, think of saving as earning.", author: "Andrew Carnegie" },
  { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who does not, pays it.", author: "Albert Einstein" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "Rich people have small TVs and big libraries, and poor people have small libraries and big TVs.", author: "Zig Ziglar" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "Ideas don't make you rich. The correct execution of ideas does.", author: "Felix Dennis" },
  { text: "To become rich you must be an owner — you must strive to own and retain control of as near to 100% as you can.", author: "Felix Dennis" },
  { text: "Fear of failing in the eyes of the world is the single biggest impediment to amassing wealth.", author: "Felix Dennis" },
  { text: "Wealth eludes most people because they focus on events while disregarding process.", author: "MJ DeMarco" },
  { text: "Time is the substance of life. When anyone asks for your time, they're asking for a chunk of your life.", author: "MJ DeMarco" },
  { text: "Instead of digging for gold, sell shovels. Instead of taking a class, offer a class.", author: "MJ DeMarco" },
  { text: "If millions seek you, you will be paid millions.", author: "MJ DeMarco" },
  { text: "Wealth is more often the result of a lifestyle of hard work, perseverance, planning, and self-discipline.", author: "Thomas J. Stanley" },
  { text: "Money should never change one's values. Making money is only a report card.", author: "Thomas J. Stanley" },
  { text: "The foundation stone of wealth accumulation is defense, anchored by budgeting and planning.", author: "Thomas J. Stanley" },
  { text: "The three most harmful addictions are heroin, carbohydrates, and a monthly salary.", author: "Nassim Taleb" },
  { text: "They will envy you for your success, your wealth, for your intelligence — but rarely for your wisdom.", author: "Nassim Taleb" },
  { text: "Bull markets are born on pessimism, grown on skepticism, mature on optimism, and die on euphoria.", author: "John Templeton" },
  { text: "Be great because nothing else pays.", author: "Grant Cardone" },
  { text: "There's no shortage of money, only of people thinking big enough.", author: "Grant Cardone" },
  { text: "Formal education will make you a living. Self-education will make you a fortune.", author: "Jim Rohn" },
  { text: "Your income is determined by how many people you serve and how well you serve them.", author: "Jim Rohn" },
  { text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham" },
  { text: "In the short run, the market is a voting machine. In the long run, it is a weighing machine.", author: "Benjamin Graham" },
  { text: "The riskiest thing in the world is the belief that there's no risk.", author: "Howard Marks" },
  { text: "There is only one form of intelligent investing: figuring out what something is worth and buying it for that price or less.", author: "Howard Marks" },
  { text: "What the wise man does in the beginning, the fool does in the end.", author: "Howard Marks" },
  { text: "The quality of your thinking determines the quality of your outcomes.", author: "Keith Cunningham" },
  { text: "The key to making money is avoiding mistakes. The biggest mistakes all involve trying to make money too fast.", author: "Keith Cunningham" },
  { text: "Wealth is a byproduct of building something that delivers exceptional value.", author: "Keith Cunningham" },
  { text: "Time in the market beats timing the market.", author: "Ken Fisher" },
  { text: "The real measure of your wealth is how much you would be worth if you lost all your money.", author: "Unknown" },
  // ── WELLNESS (60)
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" },
  { text: "To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
  { text: "A healthy outside starts from the inside.", author: "Robert Urich" },
  { text: "He who has health has hope, and he who has hope has everything.", author: "Thomas Carlyle" },
  { text: "The first wealth is health.", author: "Ralph Waldo Emerson" },
  { text: "It is health that is real wealth and not pieces of gold and silver.", author: "Mahatma Gandhi" },
  { text: "A good laugh and a long sleep are the best cures in the doctor's book.", author: "Irish Proverb" },
  { text: "Movement is medicine for creating change in a person's physical, emotional, and mental states.", author: "Carol Welch" },
  { text: "Lack of activity destroys the good condition of every human being, while movement and methodical physical exercise save it and preserve it.", author: "Plato" },
  { text: "An early morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { text: "Take care of your body with steadfast fidelity. The soul must see through these eyes alone.", author: "Goethe" },
  { text: "Investing in your health is the best investment you can make. Everything else in your life depends on it.", author: "Unknown" },
  { text: "Sleep is the best meditation.", author: "Dalai Lama" },
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston" },
  { text: "The food you eat can be either the safest and most powerful form of medicine or the slowest form of poison.", author: "Ann Wigmore" },
  { text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates" },
  { text: "Exercise is a celebration of what your body can do, not a punishment for what you ate.", author: "Unknown" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "Physical fitness is the first requisite of happiness.", author: "Joseph Pilates" },
  { text: "A strong body makes the mind strong.", author: "Thomas Jefferson" },
  { text: "Recovery is where champions are made.", author: "Unknown" },
  { text: "We do not stop exercising because we grow old — we grow old because we stop exercising.", author: "Kenneth Cooper" },
  { text: "Your body is your first instrument. Learn to play it well.", author: "Unknown" },
  { text: "Nourish your body, ignite your mind, free your soul.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Your health is an investment, not an expense.", author: "Unknown" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "The greatest form of self-love is taking care of the vessel that carries your soul.", author: "Unknown" },
  { text: "Chronic stress is the enemy of the high performer. Protect your recovery as fiercely as you protect your training.", author: "Unknown" },
  { text: "Sleep, sunlight, movement, and stillness — the four pillars of a high-performing body.", author: "Unknown" },
  { text: "Every workout is a deposit in the bank of your future self.", author: "Unknown" },
  { text: "You can't out-train a bad diet. Fuel matters.", author: "Unknown" },
  { text: "Hydration is the simplest performance hack you're probably ignoring.", author: "Unknown" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "Champions are not born; they are built — one rep, one day, one decision at a time.", author: "Unknown" },
  { text: "You are one workout away from a better mood.", author: "Unknown" },
  { text: "Consistency beats intensity. Show up every day.", author: "Unknown" },
  { text: "True wellness is alignment: mind, body, and purpose moving together.", author: "Unknown" },
  { text: "Protect your energy like it's currency. Because it is.", author: "Unknown" },
  { text: "What you do every day matters more than what you do every once in a while.", author: "Gretchen Rubin" },
  { text: "Rest is not idleness. It is the foundation of all productive effort.", author: "Unknown" },
  { text: "Be the architect of your own health. No one else will build it for you.", author: "Unknown" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Professionals stick to the schedule; amateurs let life get in the way.", author: "James Clear" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
  { text: "All big things come from small beginnings. The seed of every habit is a single, tiny decision.", author: "James Clear" },
  { text: "The only way to become excellent is to be endlessly fascinated by doing the same thing over and over.", author: "James Clear" },
  { text: "Show me your habits, and I'll show you your future.", author: "Samuel Smiles" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Health is not valued until sickness comes.", author: "Thomas Fuller" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is nothing more than a few simple disciplines practiced every day.", author: "Jim Rohn" },
  { text: "Your future self is watching you right now through your memories. Act accordingly.", author: "Aubrey Marcus" },
  { text: "A fasted mind is a sharper mind. Clarity is a competitive advantage.", author: "Unknown" },
  { text: "Your immune system is your armor. Fortify it daily.", author: "Unknown" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "Without standardization, there can be no improvement.", author: "Taiichi Ohno" },
  { text: "Long-term consistency beats short-term intensity.", author: "Bruce Lee" },
];

function getDailyQuote() {
  // One unique quote per calendar day — cycles through all 365
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
  const dayNumber = Math.floor(new Date(y, mo, d).getTime() / 86_400_000);
  return STOIC_QUOTES[dayNumber % STOIC_QUOTES.length];
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

export default function Dashboard({ profile, habits, onNavigate, onCompleteHabit, dailyPriorities, onSetPriorities }: Props) {
  const [cycleStart, setCycleStart] = useState<string | null>(null);
  const [priorityInputs, setPriorityInputs] = useState<string[]>(['']);
  const [priorityStruck, setPriorityStruck] = useState<boolean[]>(() => dailyPriorities.map(() => false));
  const [habitsView, setHabitsView] = useState<'protocol' | 'favorites'>('protocol');
  const cals = useDailyCalories();

  useEffect(() => {
    const sc = localStorage.getItem('grid_cycle_start');
    if (sc) setCycleStart(sc);
    // Restore struck state for current priorities
    if (dailyPriorities.length > 0) {
      try {
        const saved = JSON.parse(localStorage.getItem('grid_priority_struck') || '[]') as boolean[];
        if (saved.length === dailyPriorities.length) setPriorityStruck(saved);
      } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStruck = (i: number) => {
    setPriorityStruck(prev => {
      const n = [...prev]; n[i] = !n[i];
      try { localStorage.setItem('grid_priority_struck', JSON.stringify(n)); } catch {}
      return n;
    });
  };

  const lvl        = getLevel(profile.xp);
  const quote      = getDailyQuote();
  const incomplete = habits.filter(h => !h.completedToday);
  const favorites  = habits.filter(h => h.favorited);
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
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-border), transparent)', marginBottom: 20 }} />

        {/* ── TODAY'S GRIND priorities ───────────────────────── */}
        <div className="card mb-5" style={{ borderColor: 'rgba(0,212,255,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>◆ TODAY&apos;S GRIND</div>
            {dailyPriorities.length > 0 && (
              <button onClick={() => { onSetPriorities([]); setPriorityStruck([]); setPriorityInputs(['']); try { localStorage.removeItem('grid_priority_struck'); } catch {} }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--ng-dimmer)', fontFamily: 'inherit' }}>RESET</button>
            )}
          </div>
          {dailyPriorities.length > 0 ? (
            <div>
              {dailyPriorities.map((p, i) => (
                <button key={i} onClick={() => toggleStruck(i)}
                  className="w-full text-left flex items-center gap-3 mb-2 p-2"
                  style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 8 }}>
                  <div style={{ width: 18, height: 18, border: `1.5px solid ${(priorityStruck[i] ?? false) ? 'var(--ng-green)' : 'var(--ng-border)'}`, borderRadius: 4, background: (priorityStruck[i] ?? false) ? 'var(--ng-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(priorityStruck[i] ?? false) && <span style={{ color: '#000', fontWeight: 900, fontSize: 11 }}>✓</span>}
                  </div>
                  <span className="font-mono" style={{ fontSize: 12, color: (priorityStruck[i] ?? false) ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: (priorityStruck[i] ?? false) ? 'line-through' : 'none', flex: 1 }}>{p}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {priorityInputs.map((val, i) => (
                <input key={i} className="ng-input w-full mb-2" style={{ fontSize: 12 }} placeholder={`Priority ${i + 1}...`} value={val}
                  onChange={e => setPriorityInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
              ))}
              {/* Add more priority button */}
              <button onClick={() => setPriorityInputs(prev => [...prev, ''])}
                style={{ background: 'none', border: '0.5px dashed var(--ng-border)', borderRadius: 8, width: '100%', padding: '7px', cursor: 'pointer', fontSize: 10, color: 'var(--ng-dimmer)', fontFamily: 'inherit', marginBottom: 10, letterSpacing: '1px' }}>
                + ADD PRIORITY
              </button>
              {/* Habit quick-fill chips — all habits */}
              <div className="flex gap-1 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
                {habits.filter(h => !h.completedToday).map(h => (
                  <button key={h.id} onClick={() => {
                    const emptyIdx = priorityInputs.findIndex(p => !p.trim());
                    if (emptyIdx !== -1) {
                      setPriorityInputs(prev => { const n = [...prev]; n[emptyIdx] = h.name; return n; });
                    } else {
                      setPriorityInputs(prev => [...prev, h.name]);
                    }
                  }} className="font-mono flex-shrink-0"
                    style={{ fontSize: 10, padding: '4px 8px', border: '0.5px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'var(--ng-surface)', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {h.icon} {h.name}
                  </button>
                ))}
              </div>
              <button onClick={() => { const filled = priorityInputs.filter(p => p.trim()); if (filled.length > 0) { onSetPriorities(filled); const initial = filled.map(() => false); setPriorityStruck(initial); try { localStorage.setItem('grid_priority_struck', JSON.stringify(initial)); } catch {} } }} disabled={!priorityInputs.some(p => p.trim())} className="btn-green-solid w-full" style={{ opacity: priorityInputs.some(p => p.trim()) ? 1 : 0.4 }}>
                LOCK IN
              </button>
            </div>
          )}
        </div>

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
                  DON&apos;T BREAK IT
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

        {/* ── Today's protocol + Favorites tabs ─────────────── */}
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
            {/* Tab toggle */}
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <button onClick={() => setHabitsView('protocol')}
                className="font-orbitron"
                style={{ fontSize: 8, letterSpacing: '2px', padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: habitsView === 'protocol' ? 'var(--ng-green)' : 'transparent',
                  color: habitsView === 'protocol' ? '#000' : 'var(--ng-muted)' }}>
                TODAY&apos;S PROTOCOL
              </button>
              <button onClick={() => setHabitsView('favorites')}
                className="font-orbitron"
                style={{ fontSize: 8, letterSpacing: '2px', padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: habitsView === 'favorites' ? 'var(--ng-amber)' : 'transparent',
                  color: habitsView === 'favorites' ? '#000' : 'var(--ng-muted)' }}>
                ★ FAVORITES
              </button>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginLeft: 'auto' }}>{doneCount}/{total}</div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--ng-border)', marginBottom: 12, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lifeScore}%`, background: 'var(--ng-green)', transition: 'width 0.5s ease' }} />
            </div>

            {habitsView === 'protocol' ? (
              <>
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
              </>
            ) : (
              <>
                {favorites.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center' }}>
                    <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 8 }}>NO FAVORITES YET</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', lineHeight: 1.7 }}>
                      Star habits in the HABITS tab<br />to pin them here.
                    </div>
                    <button onClick={() => onNavigate('habits')} className="font-orbitron"
                      style={{ marginTop: 12, fontSize: 8, letterSpacing: '2px', color: 'var(--ng-amber)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      GO TO HABITS →
                    </button>
                  </div>
                ) : (
                  <div style={{ background: 'var(--ng-surface)', border: '0.5px solid rgba(255,184,0,0.2)', borderRadius: 12, overflow: 'hidden' }}>
                    {favorites.map((h, i) => {
                      const color = CATEGORY_COLORS[h.category];
                      const done = h.completedToday;
                      return (
                        <button key={h.id} onClick={() => !done && onCompleteHabit(h.id)}
                          className="w-full text-left"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px',
                            background: done ? 'rgba(0,255,65,0.03)' : 'transparent',
                            borderBottom: i < favorites.length - 1 ? '1px solid var(--ng-border)' : 'none',
                            borderLeft: `3px solid ${done ? 'var(--ng-green)' : 'rgba(255,184,0,0.5)'}`,
                            cursor: done ? 'default' : 'pointer',
                            opacity: done ? 0.6 : 1,
                            minHeight: 56,
                          }}>
                          <div style={{ width: 20, height: 20, border: `1.5px solid ${done ? 'var(--ng-green)' : 'rgba(255,184,0,0.4)'}`, borderRadius: 2, background: done ? 'var(--ng-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done && <span style={{ color: '#000', fontWeight: 900, fontSize: 10 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div className="font-mono" style={{ fontSize: 12, color: done ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: done ? 'line-through' : 'none' }}>{h.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                              <span className="font-orbitron" style={{ fontSize: 8, color, letterSpacing: '1px' }}>{h.category.toUpperCase()}</span>
                              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{h.xpReward}xp</span>
                              {h.streak > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {h.streak}d</span>}
                              <span style={{ fontSize: 9, color: 'var(--ng-amber)' }}>★</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
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
