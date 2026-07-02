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
  { text: "There is no light without shadow and no psychic wholeness without imperfection.", author: "Carl Jung" },
  { text: "That which you most need will be found where you least want to look.", author: "Carl Jung" },
  { text: "Who looks outside, dreams; who looks inside, awakes.", author: "Carl Jung" },
  { text: "I am not what happened to me. I am what I choose to become.", author: "Carl Jung" },
  { text: "We are living in a culture entirely hypnotized by the illusion of time.", author: "Alan Watts" },
  { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts" },
  { text: "Trying to define yourself is like trying to bite your own teeth.", author: "Alan Watts" },
  { text: "No valid plans for the future can be made by those who have no capacity for living now.", author: "Alan Watts" },
  { text: "Through our eyes, the universe is perceiving itself. Through our ears, the universe is listening to its harmonies.", author: "Alan Watts" },
  { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "You should be far more concerned with your current trajectory than with your current results.", author: "James Clear" },
  { text: "Success is the product of daily habits—not once-in-a-lifetime transformations.", author: "James Clear" },
  { text: "Be the designer of your world and not merely the consumer of it.", author: "James Clear" },
  { text: "Goals are good for setting a direction, but systems are best for making progress.", author: "James Clear" },
  { text: "When you can't win by being better, you can win by being different.", author: "James Clear" },
  { text: "The view from inside a fixed mindset is that effort is what you resort to when talent fails you.", author: "Carol Dweck" },
  { text: "In a growth mindset, challenges are exciting rather than threatening.", author: "Carol Dweck" },
  { text: "Becoming is better than being. The fixed mindset does not allow people the luxury of becoming.", author: "Carol Dweck" },
  { text: "The passion for stretching yourself and sticking to it, even when it's not going well, is the hallmark of the growth mindset.", author: "Carol Dweck" },
  { text: "Test scores and measurements are not measures of potential. They are snapshots of where you are now.", author: "Carol Dweck" },
  { text: "Vulnerability is not weakness. It is our greatest measure of courage.", author: "Brene Brown" },
  { text: "You either walk inside your story and own it, or you stand outside your story and hustle for your worthiness.", author: "Brene Brown" },
  { text: "Owning our story can be hard but not nearly as difficult as spending our lives running from it.", author: "Brene Brown" },
  { text: "Courage starts with showing up and letting ourselves be seen.", author: "Brene Brown" },
  { text: "Do not be afraid of the shadow. It only means there is a light shining somewhere nearby.", author: "Brene Brown" },
  { text: "Know your enemy and know yourself and you can fight a hundred battles without disaster.", author: "Sun Tzu" },
  { text: "All negativity is caused by an accumulation of psychological time and denial of the present.", author: "Eckhart Tolle" },
  { text: "The primary cause of unhappiness is never the situation but your thoughts about it.", author: "Eckhart Tolle" },
  { text: "Realize deeply that the present moment is all you will ever have.", author: "Eckhart Tolle" },
  { text: "Most people treat the present moment as if it were an obstacle to overcome.", author: "Eckhart Tolle" },
  { text: "What you resist, persists. What you look at disappears.", author: "Eckhart Tolle" },
  { text: "Do not look for your enemy to be somewhere else. He is inside of you.", author: "Robert Greene" },
  { text: "The greatest danger is that you will allow the past to define your future.", author: "Robert Greene" },
  { text: "Do not accept the roles that society foists on you. Re-create yourself by forging a new identity.", author: "Robert Greene" },
  { text: "If you are unsure of a course of action, do not attempt it. Your doubts and hesitations will infect your execution.", author: "Robert Greene" },
  { text: "The mind must be given landscapes and adventures so that it can continue to expand and develop.", author: "Robert Greene" },
  { text: "Such as are your habitual thoughts, such also will be the character of your mind.", author: "Marcus Aurelius" },
  { text: "The world is the mirror of myself growing.", author: "Henry Miller" },
  { text: "The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.", author: "Arnold Schwarzenegger" },
  { text: "To be everywhere is to be nowhere.", author: "Seneca" },
  { text: "It is not that I'm so smart. But I stay with the questions much longer.", author: "Albert Einstein" },
  { text: "The mind is not a vessel to be filled but a fire to be kindled.", author: "Plutarch" },
  { text: "Everything can be taken from a man but one thing: the last of the human freedoms—to choose one's attitude.", author: "Viktor Frankl" },
  { text: "You cannot swim for new horizons until you have courage to lose sight of the shore.", author: "William Faulkner" },
  { text: "Happiness cannot be pursued; it must ensue.", author: "Viktor Frankl" },
  { text: "People don't decide their futures. They decide their habits and their habits decide their futures.", author: "F.M. Alexander" },
  { text: "The way we see the problem is the problem.", author: "Stephen Covey" },
  { text: "You are not the voice in your head. You are the awareness that hears it.", author: "Michael Singer" },
  { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "Absorb what is useful, discard what is not, add what is uniquely your own.", author: "Bruce Lee" },
  { text: "The key to immortality is first living a life worth remembering.", author: "Bruce Lee" },
  { text: "Using no way as way, having no limitation as limitation.", author: "Bruce Lee" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Bruce Lee" },
  { text: "If you always put limits on everything you do, physical or anything else, it will spread into your work and into your life.", author: "Bruce Lee" },
  { text: "Superior intelligence is the ability to hold two contradictory ideas in mind simultaneously and still retain the ability to function.", author: "F. Scott Fitzgerald" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "It is our attitude at the beginning of a difficult task which, more than anything else, will affect its successful outcome.", author: "William James" },
  { text: "Nothing in the world is worth having or worth doing unless it means effort, pain, and difficulty.", author: "Theodore Roosevelt" },
  { text: "Resilience is knowing that you are the only one that has the power and the responsibility to pick yourself up.", author: "Mary Holloway" },
  { text: "The obstacle in the path becomes the path. Never forget, within every obstacle is an opportunity to improve our condition.", author: "Ryan Holiday" },
  { text: "Confidence is the freedom from the need to be confident. It is the willingness to act without guarantee.", author: "Ryan Holiday" },
  { text: "Ego is the enemy of what you want and of what you have.", author: "Ryan Holiday" },
  { text: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven.", author: "John Milton" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "It is impossible for a man to learn what he thinks he already knows.", author: "Epictetus" },
  { text: "The universe is under no obligation to make sense to you.", author: "Neil deGrasse Tyson" },
  { text: "We do not see things as they are, we see them as we are.", author: "Anais Nin" },
  { text: "The snake which cannot cast its skin has to die.", author: "Friedrich Nietzsche" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The quality of a person's life is in direct proportion to their commitment to excellence.", author: "Vince Lombardi" },
  { text: "Not what we have, but what we enjoy, constitutes our abundance.", author: "Epicurus" },
  { text: "What we fear doing most is usually what we most need to do.", author: "Tim Ferriss" },
  { text: "A person who thinks all the time has nothing to think about except thoughts. So he loses touch with reality.", author: "Alan Watts" },
  { text: "Worry is interest paid on a debt you may not owe.", author: "Mark Twain" },
  { text: "The greatest prison people live in is the fear of what other people think.", author: "David Icke" },
  { text: "The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.", author: "Albert Einstein" },
  { text: "Without effort, your talent is nothing more than unmet potential.", author: "Angela Duckworth" },
  { text: "Grit is sticking with your future, day in, day out. Not just for the week, not just for the month, but for years.", author: "Angela Duckworth" },
  { text: "Enthusiasm is common. Endurance is rare.", author: "Angela Duckworth" },
  { text: "Grit depends on a different kind of hope—it rests on the expectation that our own efforts can improve our future.", author: "Angela Duckworth" },
  { text: "As much as talent counts, effort counts twice.", author: "Angela Duckworth" },
  { text: "The distance between who I am and who I want to be is only separated by what I do.", author: "Unknown" },
  { text: "Your life does not get better by chance. It gets better by change.", author: "Jim Rohn" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "You are the average of the five people you spend the most time with.", author: "Jim Rohn" },
  { text: "If you don't like how things are, change it. You're not a tree.", author: "Jim Rohn" },
  { text: "Don't wish it were easier; wish you were better. Don't wish for fewer problems; wish for more skills.", author: "Jim Rohn" },
  { text: "The struggle you're in today is developing the strength you need for tomorrow.", author: "Robert Tew" },
  { text: "Your work is to discover your work, and then with all your heart to give yourself to it.", author: "Buddha" },
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
  { text: "Money's greatest intrinsic value is its ability to give you control over your time.", author: "Morgan Housel" },
  { text: "Spending money to show people how much money you have is the fastest way to have less money.", author: "Morgan Housel" },
  { text: "Saving is the gap between your ego and your income.", author: "Morgan Housel" },
  { text: "Wealth is what you don't see. It's the cars not bought, the watches not worn, the clothes forgone.", author: "Morgan Housel" },
  { text: "Good investing is not necessarily about making good decisions. It's about consistently not screwing up.", author: "Morgan Housel" },
  { text: "Risk is what's left over when you think you've thought of everything.", author: "Morgan Housel" },
  { text: "Nothing is as good or as bad as it seems.", author: "Morgan Housel" },
  { text: "Progress happens too slowly to notice, but setbacks happen too quickly to ignore.", author: "Morgan Housel" },
  { text: "Controlling your time is the highest dividend money pays.", author: "Morgan Housel" },
  { text: "Things that have never happened before happen all the time.", author: "Morgan Housel" },
  { text: "Ideas don't make you rich. The correct execution of ideas does.", author: "Felix Dennis" },
  { text: "There is absolutely nothing more likely to dampen the prospects of becoming rich than a nice, fat salary.", author: "Felix Dennis" },
  { text: "To become rich you must be an owner—you must strive to own and retain control of as near to 100% as you can.", author: "Felix Dennis" },
  { text: "Fear of failing in the eyes of the world is the single biggest impediment to amassing wealth.", author: "Felix Dennis" },
  { text: "Never retreat. Never explain. Get it done and let them howl.", author: "Felix Dennis" },
  { text: "The follow-through, the execution, is a thousand times more important than a great idea.", author: "Felix Dennis" },
  { text: "Anyone not busy learning is busy dying.", author: "Felix Dennis" },
  { text: "There's a profound difference between interest and commitment. Interest reads a book; commitment applies it 50 times.", author: "MJ DeMarco" },
  { text: "Time is the substance of life. When anyone asks for your time, they're asking for a chunk of your life.", author: "MJ DeMarco" },
  { text: "Instead of digging for gold, sell shovels. Instead of taking a class, offer a class.", author: "MJ DeMarco" },
  { text: "Wealth eludes most people because they focus on events while disregarding process.", author: "MJ DeMarco" },
  { text: "All events of wealth are precluded by process—a backstory of trial, risk, hard work, and sacrifice.", author: "MJ DeMarco" },
  { text: "Change creates millionaires. Those who observe and take advantage of change will be the new millionaires.", author: "MJ DeMarco" },
  { text: "If your past defines your existence, it will be impossible to become the person you need to be.", author: "MJ DeMarco" },
  { text: "Whatever your income, always live below your means.", author: "Thomas J. Stanley" },
  { text: "Wealth is not the same as income. If you make a good income each year and spend it all, you are not getting wealthier.", author: "Thomas J. Stanley" },
  { text: "Wealth is more often the result of a lifestyle of hard work, perseverance, planning, and, most of all, self-discipline.", author: "Thomas J. Stanley" },
  { text: "I am not impressed with what people own. But I'm impressed with what they achieve.", author: "Thomas J. Stanley" },
  { text: "It's easier to accumulate wealth if you don't live in a high-status neighborhood.", author: "Thomas J. Stanley" },
  { text: "The foundation stone of wealth accumulation is defense, and this defense should be anchored by budgeting and planning.", author: "Thomas J. Stanley" },
  { text: "Money should never change one's values. Making money is only a report card.", author: "Thomas J. Stanley" },
  { text: "The three most harmful addictions are heroin, carbohydrates, and a monthly salary.", author: "Nassim Taleb" },
  { text: "Difficulty is what wakes up the genius.", author: "Nassim Taleb" },
  { text: "A Stoic is someone who transforms fear into prudence, pain into transformation, mistakes into initiation, and desire into undertaking.", author: "Nassim Taleb" },
  { text: "They will envy you for your success, your wealth, for your intelligence—but rarely for your wisdom.", author: "Nassim Taleb" },
  { text: "If you do not take risks for your opinion, you're nothing.", author: "Nassim Taleb" },
  { text: "If you have a garden and a library, you have everything you need.", author: "Cicero" },
  { text: "To be content with what we possess is the greatest and most secure of riches.", author: "Cicero" },
  { text: "Bull markets are born on pessimism, grown on skepticism, mature on optimism, and die on euphoria.", author: "John Templeton" },
  { text: "To buy when others are despondently selling and to sell when others are greedily buying requires the greatest fortitude.", author: "John Templeton" },
  { text: "If you want to have better performance than the crowd, you must do things differently from the crowd.", author: "John Templeton" },
  { text: "The time of maximum pessimism is the best time to buy, and the time of maximum optimism is the best time to sell.", author: "John Templeton" },
  { text: "Value investing by its very nature is contrarian. Out-of-favor securities may be undervalued; popular securities almost never are.", author: "Seth Klarman" },
  { text: "Consistency and patience are crucial. Most investors are their own worst enemies. Endurance enables compounding.", author: "Seth Klarman" },
  { text: "Risk is not inherent in an investment; it is always relative to the price paid.", author: "Seth Klarman" },
  { text: "The first and foremost responsibility of every investor is preservation of capital.", author: "Seth Klarman" },
  { text: "Successful investors tend to be unemotional, allowing the greed and fear of others to play into their hands.", author: "Seth Klarman" },
  { text: "Emotional investors and speculators inevitably lose money.", author: "Seth Klarman" },
  { text: "Being very early and being wrong look exactly the same 99% of the time.", author: "Seth Klarman" },
  { text: "Value investing is, at its core, the marriage of a contrarian streak and a calculator.", author: "Seth Klarman" },
  { text: "Your own psychology can be your worst enemy as an investor.", author: "Seth Klarman" },
  { text: "Holding cash in the absence of opportunity makes sense.", author: "Seth Klarman" },
  { text: "What the wise man does in the beginning, the fool does in the end.", author: "Howard Marks" },
  { text: "The riskiest thing in the world is the belief that there's no risk.", author: "Howard Marks" },
  { text: "Risk is high when investors feel risk is low.", author: "Howard Marks" },
  { text: "Skepticism and pessimism aren't synonymous. Skepticism calls for pessimism when optimism is excessive.", author: "Howard Marks" },
  { text: "In investing, there is nothing that always works, since the environment is always changing.", author: "Howard Marks" },
  { text: "There's only one form of intelligent investing: figuring out what something's worth and buying it for that price or less.", author: "Howard Marks" },
  { text: "No asset is so good that it can't be bid up to the point where it's overpriced and thus dangerous.", author: "Howard Marks" },
  { text: "Being too far ahead of your time is indistinguishable from being wrong.", author: "Howard Marks" },
  { text: "The superior investor is mature, rational, analytical, objective, and unemotional.", author: "Howard Marks" },
  { text: "Stocks aren't lottery tickets. Behind every stock is a company.", author: "Peter Lynch" },
  { text: "In the stock market, the most important organ is the stomach.", author: "Peter Lynch" },
  { text: "Far more money has been lost by investors preparing for corrections than has been lost in corrections themselves.", author: "Peter Lynch" },
  { text: "You only need one or two good stocks a decade.", author: "Peter Lynch" },
  { text: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.", author: "Peter Lynch" },
  { text: "Personal opinions, feelings, hopes, and beliefs about the stock market are usually wrong and often dangerous.", author: "William O'Neil" },
  { text: "It is one of the great paradoxes of the stock market that what seems too high usually goes higher.", author: "William O'Neil" },
  { text: "90% of the people in the stock market, professionals and amateurs alike, simply haven't done enough homework.", author: "William O'Neil" },
  { text: "There is no shame in losing money on a stock. Everybody does it. What is shameful is to hold on to a stock when the fundamentals are deteriorating.", author: "William O'Neil" },
  { text: "Wealth is not authored by material possessions, money, or stuff, but by family, fitness, and freedom.", author: "MJ DeMarco" },
  { text: "Pain plus reflection equals progress.", author: "Ray Dalio" },
  { text: "If millions seek you, you will be paid millions.", author: "MJ DeMarco" },
  { text: "More is lost by indecision than by wrong decision.", author: "Cicero" },
  { text: "Time in the market beats timing the market.", author: "Ken Fisher" },
  { text: "The stock market is the only market where things go on sale and all the customers run out of the store.", author: "Cullen Roche" },
  { text: "Be great because nothing else pays.", author: "Grant Cardone" },
  { text: "There's no shortage of money, only of people thinking big enough.", author: "Grant Cardone" },
  { text: "Wealthy people work for freedom. They're not working for comfort items or a weekend.", author: "Grant Cardone" },
  { text: "The poor borrow to consume. The rich borrow to acquire income-producing assets.", author: "Grant Cardone" },
  { text: "Your income is determined by how many people you serve and how well you serve them.", author: "Jim Rohn" },
  { text: "Formal education will make you a living. Self-education will make you a fortune.", author: "Jim Rohn" },
  { text: "If you are not willing to own a stock for ten years, do not even think about owning it for ten minutes.", author: "Warren Buffett" },
  { text: "The rich get richer not because they work harder, but because they put their money to work for them.", author: "Robert Kiyosaki" },
  { text: "Spend each day trying to be a little wiser than you were when you woke up.", author: "Charlie Munger" },
  { text: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein" },
  { text: "Invert, always invert: turn a situation or problem upside down. Look at it backwards.", author: "Charlie Munger" },
  { text: "An economist is someone who didn't have enough personality to become an accountant.", author: "Unknown" },
  { text: "All I want to know is where I'm going to die, so I'll never go there.", author: "Charlie Munger" },
  { text: "The quality of your thinking determines the quality of your outcomes.", author: "Keith Cunningham" },
  { text: "The key to making money is avoiding mistakes. The biggest mistakes all involve trying to make money too fast.", author: "Keith Cunningham" },
  { text: "Businesses fail for only two reasons: not enough revenue and too many costs. Everything else is a symptom.", author: "Keith Cunningham" },
  { text: "Wealth is a byproduct of building something that delivers exceptional value.", author: "Keith Cunningham" },
  { text: "Never stop learning—anyone not busy learning is busy dying.", author: "Keith Cunningham" },
  { text: "The road to wealth is paved with failed ideas executed brilliantly and brilliant ideas executed poorly.", author: "Keith Cunningham" },
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
  { text: "Discipline is the pathway to freedom.", author: "Jocko Willink" },
  { text: "It's not what you preach, it's what you tolerate.", author: "Jocko Willink" },
  { text: "There are no bad teams, only bad leaders.", author: "Jocko Willink" },
  { text: "Extreme Ownership. Leaders must own everything in their world. There is no one else to blame.", author: "Jocko Willink" },
  { text: "Waiting for the 100 percent right and certain solution leads to delay, indecision, and inability to execute.", author: "Jocko Willink" },
  { text: "Instead of letting the situation dictate our decisions, we must dictate to the situation.", author: "Jocko Willink" },
  { text: "Ego clouds and disrupts everything: planning, accepting advice, and constructive criticism.", author: "Jocko Willink" },
  { text: "A good leader has nothing to prove, but everything to prove.", author: "Jocko Willink" },
  { text: "The biggest war you ever go through is right between your own ears.", author: "David Goggins" },
  { text: "The only way you gain mental toughness is to do things you're not happy doing.", author: "David Goggins" },
  { text: "The groundwork of all happiness is health.", author: "Leigh Hunt" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Professionals stick to the schedule; amateurs let life get in the way.", author: "James Clear" },
  { text: "The only way to become excellent is to be endlessly fascinated by doing the same thing over and over.", author: "James Clear" },
  { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
  { text: "All big things come from small beginnings. The seed of every habit is a single, tiny decision.", author: "James Clear" },
  { text: "Relax. Look around. Make a call.", author: "Jocko Willink" },
  { text: "Discipline is the soul of an army. It makes small numbers formidable; procures success to the weak.", author: "George Washington" },
  { text: "The more you sweat in peace, the less you bleed in war.", author: "Norman Schwarzkopf" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Never, never, never give in—except to convictions of honour and good sense.", author: "Winston Churchill" },
  { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
  { text: "Mamba mentality is about 4 a.m. workouts, doing more than the next guy, and trusting in the work when it's time to perform.", author: "Kobe Bryant" },
  { text: "If you really want to be great at something, you have to truly care about it. You have to obsess over it.", author: "Kobe Bryant" },
  { text: "You have to work hard in the dark to shine in the light.", author: "Kobe Bryant" },
  { text: "I hated every minute of training, but I said: don't quit. Suffer now and live the rest of your life as a champion.", author: "Muhammad Ali" },
  { text: "Champions aren't made in gyms. They are made from something deep inside them—a desire, a dream, a vision.", author: "Muhammad Ali" },
  { text: "Inside of a ring or out, ain't nothing wrong with going down. It's staying down that's wrong.", author: "Muhammad Ali" },
  { text: "I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan" },
  { text: "Talent wins games, but teamwork and intelligence win championships.", author: "Michael Jordan" },
  { text: "You must do what others won't in order to achieve what others don't.", author: "Michael Jordan" },
  { text: "Mastery requires endurance. Those who last are those who show up again and again.", author: "Robert Greene" },
  { text: "To handle yourself, use your head. To handle others, use your heart. To lead yourself, use both.", author: "Donald Laird" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb" },
  { text: "You may be unconquerable if you enter into no contest that is not in your power to win.", author: "Epictetus" },
  { text: "The best time to plant a tree was twenty years ago. The second-best time is now.", author: "Chinese Proverb" },
  { text: "Anger is a signal, and one worth listening to—but acting on it is always a choice.", author: "Harriet Lerner" },
  { text: "When a man doesn't know what harbour he's making for, no wind is the right wind.", author: "Seneca" },
  { text: "Every good is gained by toil.", author: "Musonius Rufus" },
  { text: "If one accomplishes some good with toil, the toil passes, but the good remains; if one does something dishonorable with pleasure, the pleasure passes, but the dishonor remains.", author: "Musonius Rufus" },
  { text: "Virtue is not simply theoretical knowledge, but it is practical application as well.", author: "Musonius Rufus" },
  { text: "Lead me, Zeus, and you too, Destiny, wherever you have assigned me; I will follow. If I refuse, I'll be dragged.", author: "Cleanthes" },
  { text: "Well-being is realized by small steps, but is truly no small thing.", author: "Zeno of Citium" },
  { text: "We have two ears and one mouth, so we should listen more than we speak.", author: "Zeno of Citium" },
  { text: "Order is not pressure which is imposed on society from without, but an equilibrium which is set up from within.", author: "Jose Ortega y Gasset" },
  { text: "A man who has not passed through the inferno of his passions has never overcome them.", author: "Carl Jung" },
  { text: "Do not confuse motion and progress. A rocking horse keeps moving but does not make any progress.", author: "Alfred A. Montapert" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "Patience, persistence, and perspiration make an unbeatable combination for success.", author: "Napoleon Hill" },
  { text: "A man can get used to anything if he has to.", author: "Gotthold Ephraim Lessing" },
  { text: "The true soldier fights not because he hates what is in front of him, but because he loves what is behind him.", author: "G.K. Chesterton" },
  { text: "Soldiers must be treated in the first instance with humanity, but kept under control by means of iron discipline.", author: "Sun Tzu" },
  { text: "He will win who knows when to fight and when not to fight.", author: "Sun Tzu" },
  { text: "Supreme excellence consists in breaking the enemy's resistance without fighting.", author: "Sun Tzu" },
  { text: "Opportunities multiply as they are seized.", author: "Sun Tzu" },
  { text: "Move swift as the Wind and closely-formed as the Wood. Attack like the Fire and be still as the Mountain.", author: "Sun Tzu" },
  { text: "You can't cheat the grind. It knows how much you've invested.", author: "David Goggins" },
  { text: "A good leader does not get bogged down in the minutia at the expense of strategic success.", author: "Jocko Willink" },
  { text: "Don't run from hard things. Get comfortable being uncomfortable.", author: "Jocko Willink" },
  { text: "Without standardization, there can be no improvement.", author: "Taiichi Ohno" },
  { text: "An ounce of prevention is worth a pound of cure.", author: "Benjamin Franklin" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Set your intent for the day, hour by hour. Control your mind before your mind controls you.", author: "Jocko Willink" },
  { text: "Work hard in silence. Let success make the noise.", author: "Frank Ocean" },
  { text: "Show me your habits, and I'll show you your future.", author: "Samuel Smiles" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "I do not pray for an easy life. I pray for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "If you always put limits on everything you do, it will spread into your work and into your life.", author: "Bruce Lee" },
  { text: "To know what you know and what you do not know—that is true knowledge.", author: "Confucius" },
  { text: "When you are content to be simply yourself and don't compare or compete, everyone will respect you.", author: "Lao Tzu" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "He who controls others may be powerful, but he who has mastered himself is mightier still.", author: "Lao Tzu" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Self-discipline is the master virtue. Without it, no other virtue is possible.", author: "Brian Tracy" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou" },
  { text: "Success is stumbling from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive—to breathe, to think, to enjoy, to love.", author: "Marcus Aurelius" },
  { text: "Make haste slowly.", author: "Augustus Caesar" },
  { text: "What is to give light must endure burning.", author: "Viktor Frankl" },
  { text: "Every successful person finds that great success lies just beyond the point when they gave up.", author: "Napoleon Hill" },
  { text: "Discipline is the number one factor in trading success. Discipline to follow your plan, discipline to take losses, and discipline to let winners run.", author: "William O'Neil" },
  { text: "The secret of discipline is motivation. When a man is sufficiently motivated, discipline will take care of itself.", author: "Alexander Paterson" },
  { text: "You don't have to be extreme, but you do have to be consistent.", author: "Unknown" },
  { text: "The enemy of great is good. Settle for good enough and you will never achieve what you are capable of.", author: "Jim Collins" },
  { text: "I will not let anyone walk through my mind with their dirty feet.", author: "Mahatma Gandhi" },
  { text: "The truth is that there are no shortcuts to any place worth going.", author: "Beverly Sills" },
  { text: "The only discipline that lasts is self-discipline.", author: "Bum Phillips" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "If you cannot do great things, do small things in a great way.", author: "Napoleon Hill" },
  { text: "The measure of a man is what he does with power.", author: "Pittacus of Mytilene" },
  { text: "To handle yourself, use your head. To handle others, use your heart.", author: "Eleanor Roosevelt" },
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
  { text: "It never was my thinking that made the big money for me. It always was my sitting.", author: "Jesse Livermore" },
  { text: "A loss never bothers me after I take it. I forget it overnight. But being wrong—not taking the loss—that is what does the damage.", author: "Jesse Livermore" },
  { text: "The hardest thing about trading is sitting on your hands when there is nothing to do.", author: "Richard Dennis" },
  { text: "The market will always take your money if you are emotional about it.", author: "Larry Williams" },
  { text: "A trader who is not willing to be wrong has no business in the markets.", author: "Linda Bradford Raschke" },
  { text: "The best traders are not the most intelligent. They are the most disciplined.", author: "Jack Schwager" },
  { text: "There is nothing new in Wall Street. Whatever happens in the stock market today has happened before and will happen again.", author: "Jesse Livermore" },
  { text: "Trading is not about being right. It is about surviving long enough to be right when it counts.", author: "Victor Sperandeo" },
  { text: "Markets can remain irrational longer than you can remain solvent.", author: "John Maynard Keynes" },
  { text: "An investor who has all the answers doesn't even understand all the questions.", author: "John Templeton" },
  { text: "The key is not to predict the future but to be prepared for it.", author: "Pericles" },
  { text: "I always say you could publish rules in a newspaper and no one would follow them. The key is consistency and discipline.", author: "Richard Dennis" },
  { text: "To follow the good principles and not let fear, greed, and hope interfere with your trading is tough.", author: "Richard Dennis" },
  { text: "Trading has taught me not to take the conventional wisdom for granted. The majority is wrong a lot of the time.", author: "Richard Dennis" },
  { text: "The market does not care how you feel. It will not prop up your ego or console you when you are down.", author: "Richard Dennis" },
  { text: "Almost anybody can make up a list of rules that are 80% as good as what we taught our turtles. What they couldn't do is give them the confidence to stick with those rules.", author: "Richard Dennis" },
  { text: "Make sure you have an edge. Know what your edge is. Have rigid risk control rules.", author: "Monroe Trout" },
  { text: "The better I'm doing, the bigger I play, and the worse I'm doing, the smaller I play.", author: "Monroe Trout" },
  { text: "If we lose more than 1.5 percent of our total equity on a given trade, we get out.", author: "Monroe Trout" },
  { text: "Find some systems that work. Develop some simple risk management rules.", author: "Monroe Trout" },
  { text: "At the beginning of each month, I determine the maximum position size I'm willing to take, and I don't exceed that limit regardless of how bullish or bearish I get.", author: "Monroe Trout" },
  { text: "The best trades are the ones in which you have all three things going for you: fundamentals, technicals, and market tone.", author: "Michael Marcus" },
  { text: "You need courage to go into the market, and courage comes from adequate capitalization.", author: "Michael Marcus" },
  { text: "I didn't just use a price stop. I also used a time stop—if the market doesn't do what I expect, I get out.", author: "Michael Marcus" },
  { text: "You must have a willingness to lose and a strong desire to win. Both are needed.", author: "Michael Marcus" },
  { text: "The most important thing in making money is not letting your losses get out of hand.", author: "Marty Schwartz" },
  { text: "You're really playing against yourself. You have to stop trying to will things to happen in order to prove you're right.", author: "Marty Schwartz" },
  { text: "The sole objective of trading is not to prove you're right, but to hear the cash register ring.", author: "Marty Schwartz" },
  { text: "I turned from a loser to a winner when I was able to separate my ego from my trading.", author: "Marty Schwartz" },
  { text: "Learn to take losses. The most important thing in making money is not letting your losses get out of hand.", author: "Marty Schwartz" },
  { text: "Investment psychology is by far the most important element, followed by risk control, with entry and exit signals being least important.", author: "Tom Basso" },
  { text: "I realized that every time I had a loss, I needed to learn something from it and view it as tuition at the College of Trading.", author: "Tom Basso" },
  { text: "Investing is a mental game more than it is having the perfect indicator or the perfect position sizing.", author: "Tom Basso" },
  { text: "Losses were part of the process. Wins were expected, but not celebrated. Consistency over time was more important than any single trade.", author: "Tom Basso" },
  { text: "I can go into any marketplace, with any amount of money, and make a living. That confidence took years to build.", author: "Tom Basso" },
  { text: "An astute trader aims to enter during quiet times and take profits during wild times.", author: "Alexander Elder" },
  { text: "Draw a line between a businessman's risk and a loss. Never take losses greater than a predetermined risk.", author: "Alexander Elder" },
  { text: "Practice defensive money management. Watch your capital as carefully as a scuba diver watches air supply.", author: "Alexander Elder" },
  { text: "It is hard enough to know what the market will do; if you don't know what you'll do, you've lost.", author: "Alexander Elder" },
  { text: "Markets are actually set up so that most traders must lose money.", author: "Alexander Elder" },
  { text: "When a beginner wins, he feels brilliant and invincible. Then he takes wild risk and loses everything.", author: "Alexander Elder" },
  { text: "To win in markets, master three essentials: sound psychology, a logical trading system, and risk management.", author: "Alexander Elder" },
  { text: "No guru will make you rich in the long run. You must work on success yourself.", author: "Alexander Elder" },
  { text: "Learning to accept the risk is a trading skill—the most important skill you can learn.", author: "Mark Douglas" },
  { text: "Good trading is a matter of knowing when to be aggressive and when to be patient.", author: "Linda Bradford Raschke" },
  { text: "In trading, the exits are more important than the entries.", author: "Jack Schwager" },
  { text: "An edge is nothing more than an indication of a higher probability of one thing happening over another.", author: "Mark Douglas" },
  { text: "The most successful traders are those who admit their mistakes early and correct them.", author: "Michael Marcus" },
  { text: "I discovered that you can't train people how to trade by just imparting knowledge. The key to trading success is emotional discipline.", author: "Jack Schwager" },
  { text: "In trading, 80 percent of your profits come from 20 percent of your ideas.", author: "Jack Schwager" },
  { text: "The idea that trading success is tied to finding some specific ideal approach is misguided.", author: "Jack Schwager" },
  { text: "Even a poor trading system could make money with good money management.", author: "Jack Schwager" },
  { text: "There is no single market secret to discover, no single correct way to trade the markets.", author: "Jack Schwager" },
  { text: "If the market is moving against you and you don't know why, take in half.", author: "Steve Cohen" },
  { text: "They trade too much. They don't pick their spots selectively enough.", author: "Tom Baldwin" },
  { text: "If I try to teach you what I do, you will fail because you are not me. Find your own method.", author: "Colm O'Shea" },
  { text: "Don't try to make a profit on a bad trade. Just try to find the best place to get out.", author: "Linda Bradford Raschke" },
  { text: "Beware of large positions that can control your emotions. Treat the market gently by allowing your equity to grow steadily.", author: "Linda Bradford Raschke" },
  { text: "The ideal trade lasts ten days, but I approach every trade as if I'm only going to hold it two or three days.", author: "Linda Bradford Raschke" },
  { text: "Only look for low-risk/high-reward trades or high-probability setups. When you don't have any signals, don't trade.", author: "Linda Bradford Raschke" },
  { text: "When you buy a stock that breaks from a box on strong volume, the move is real. No volume, no conviction.", author: "Nicolas Darvas" },
  { text: "Stocks don't know you own them.", author: "Adam Smith" },
  { text: "Cut your losses at 7 to 8 percent below your cost. This is the most important rule for every investor.", author: "William O'Neil" },
  { text: "Undertrade, undertrade, undertrade. Cut your position at least in half.", author: "Bruce Kovner" },
  { text: "Place your stops at a point that indicates the trade is wrong, not by maximum dollar loss.", author: "Bruce Kovner" },
  { text: "I am always thinking about losing money as opposed to making money.", author: "Paul Tudor Jones" },
  { text: "Whenever I enter a position, I have a predetermined stop. That's the only way I can sleep.", author: "Paul Tudor Jones" },
  { text: "The first rule of trading—there are probably many first rules—is don't get caught in a situation in which you can lose a great deal of money for reasons you don't understand.", author: "Bruce Kovner" },
  { text: "What I've learned is that bet small, catch big trends, and manage your money, not be a cowboy.", author: "Larry Williams" },
  { text: "If you don't have discipline in trading, get a day job. They're not going to last.", author: "Larry Williams" },
  { text: "You want to be in the markets that have the best fundamentals and the best technicals.", author: "Larry Williams" },
  { text: "The stock market is a device for transferring money from the active to the patient.", author: "Fred Schwed" },
  { text: "It's not whether you're right or wrong, it's how much you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
  { text: "Market prices are always wrong in the sense that they present a biased view of the future.", author: "George Soros" },
  { text: "If investing is entertaining, if you're having fun, you're probably not making money. Good investing is boring.", author: "George Soros" },
  { text: "The most important rule is to play great defense, not great offense. Every day I assume every position I have is wrong.", author: "Paul Tudor Jones" },
  { text: "Don't fight the tape. The market knows more than you do.", author: "Martin Zweig" },
  { text: "The trend is your friend until the bend at the end.", author: "Martin Pring" },
  { text: "Trading rule number one: do not use judgment. If you are not sure, stay out.", author: "Nicolas Darvas" },
  { text: "Losing a position is aggravating, whereas losing your nerve is devastating.", author: "Ed Seykota" },
  { text: "The trend is your friend except at the end where it bends.", author: "Ed Seykota" },
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "In trading, it is not about how much you make on your winners. It is about how little you lose on your losers.", author: "Tom Baldwin" },
  { text: "You must be willing to be the dumbest person in the room sometimes.", author: "Ray Dalio" },
  { text: "The elements of good trading are cutting losses, riding winners, and keeping bets small. These are also the hardest things to do.", author: "Ed Seykota" },
  { text: "Position sizing is the answer to the question—how much?—and it is the most important question you ask in trading.", author: "Van Tharp" },
  { text: "Most people overestimate what they can do in a day, and underestimate what they can do in a month.", author: "Matt Mullenweg" },
  { text: "When the facts change, I change my mind. What do you do?", author: "John Maynard Keynes" },
  { text: "The market is a brutal teacher. It teaches through pain.", author: "Martin Schwartz" },
  { text: "Every trade you make, ask yourself: am I doing this because my system tells me to, or because of emotion?", author: "Alexander Elder" },
  { text: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { text: "The best traders I know use markets to teach themselves who they are.", author: "Jack Schwager" },
  { text: "Every time you enter a trade, write down your reason for being in that trade and your stop level.", author: "Jack Schwager" },
  { text: "Most traders who fail have large egos and can't admit they are wrong.", author: "Bruce Kovner" },
  { text: "Your trading system must fit your personality. A system you can't follow is no system at all.", author: "Van Tharp" },
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
  { text: "The most important is discipline. Second, you have to have patience; if you have a good trade on, you have to be able to stay with it.", author: "Michael Marcus" },
  { text: "I buy on the assumption that they could close the market the next day and not reopen it for five years.", author: "Warren Buffett" },
  { text: "The secret to success in stocks is not to be scared out of them.", author: "Peter Lynch" },
  { text: "The typical big winner in the Lynch portfolio generally takes three to ten years to play out.", author: "Peter Lynch" },
  { text: "Patience is not sitting and waiting, it is foreseeing. It is looking at the thorn and seeing the rose, looking at the night and seeing the day.", author: "Rumi" },
  { text: "When I run after what I think I want, my days are a furnace of distress and anxiety. If I sit in my own place of patience, what I need flows to me.", author: "Rumi" },
  { text: "Patience with small details makes perfect a large work, like the universe.", author: "Rumi" },
  { text: "Practice patience; it is the essence of praise. Have patience, for that is true worship.", author: "Rumi" },
  { text: "If the door is shut right in your face, keep waiting with patience. Seeing your patience, your love will soon summon you.", author: "Rumi" },
  { text: "When you do things from your soul, you feel a river moving in you, a joy.", author: "Rumi" },
  { text: "Lovers are patient and know that the moon needs time to become full.", author: "Rumi" },
  { text: "Do you have the patience to wait until your mud settles and the water is clear?", author: "Lao Tzu" },
  { text: "Nothing in the world is as soft and yielding as water. Yet for dissolving the hard and inflexible, nothing can surpass it.", author: "Lao Tzu" },
  { text: "Simplicity, patience, compassion. These three are your greatest treasures.", author: "Lao Tzu" },
  { text: "Knowing how to yield is strength.", author: "Lao Tzu" },
  { text: "Act without expectation.", author: "Lao Tzu" },
  { text: "To the mind that is still, the whole universe surrenders.", author: "Lao Tzu" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "People sacrifice the present for the future. But life is available only in the present.", author: "Thich Nhat Hanh" },
  { text: "Patience is the mark of true love. If you truly love someone, you will be more patient with that person.", author: "Thich Nhat Hanh" },
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "Walk as if you are kissing the Earth with your feet.", author: "Thich Nhat Hanh" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The deeper that sorrow carves into your being, the more joy you can contain.", author: "Khalil Gibran" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Khalil Gibran" },
  { text: "Your pain is the breaking of the shell that encloses your understanding.", author: "Khalil Gibran" },
  { text: "The teacher who is indeed wise does not bid you to enter the house of his wisdom but rather leads you to the threshold of your mind.", author: "Khalil Gibran" },
  { text: "For time is the field in which all grow, and if one does not yield to time, one withers.", author: "Khalil Gibran" },
  { text: "Consistency and patience are crucial. Most investors are their own worst enemies; endurance enables compounding.", author: "Seth Klarman" },
  { text: "Volatility is not risk. And historic volatility does not necessarily project future volatility.", author: "Seth Klarman" },
  { text: "Unprecedented events occur with some regularity, so be prepared.", author: "Seth Klarman" },
  { text: "I think in all likelihood, you will not get rich working for someone else.", author: "Felix Dennis" },
  { text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", author: "Philip Fisher" },
  { text: "The market is a pendulum that forever swings between unsustainable optimism and unjustified pessimism.", author: "Benjamin Graham" },
  { text: "In the short run, the market is a voting machine. In the long run, it is a weighing machine.", author: "Benjamin Graham" },
  { text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham" },
  { text: "The individual investor should act consistently as an investor and not as a speculator.", author: "Benjamin Graham" },
  { text: "A man is not finished when he is defeated. He is finished when he quits.", author: "Richard Nixon" },
  { text: "It is not the critic who counts; not the man who points out how the strong man stumbles.", author: "Theodore Roosevelt" },
  { text: "All the adversity I've had in my life, all my troubles and obstacles, have strengthened me.", author: "Walt Disney" },
  { text: "How poor are they that have not patience! What wound did ever heal but by degrees?", author: "William Shakespeare" },
  { text: "I have learned silence from the talkative, toleration from the intolerant, and kindness from the unkind.", author: "Khalil Gibran" },
  { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A.A. Milne" },
  { text: "The two hardest tests on the spiritual road are the patience to wait for the right moment and the courage not to be disappointed with what we encounter.", author: "Paulo Coelho" },
  { text: "One moment of patience may ward off great disaster. One moment of impatience may ruin a whole life.", author: "Chinese Proverb" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Jean-Jacques Rousseau" },
  { text: "The keys to patience are acceptance and faith. Accept things as they are, and look realistically at the world around you.", author: "Ralph Marston" },
  { text: "To lose patience is to lose the battle.", author: "Mahatma Gandhi" },
  { text: "Only those who have the patience to do simple things perfectly will acquire the skill to do difficult things easily.", author: "Friedrich Schiller" },
  { text: "Tolerance and patience rooted in deep wisdom are the antidote to anger.", author: "Dalai Lama" },
  { text: "Everything comes to him who hustles while he waits.", author: "Thomas Edison" },
  { text: "It takes remarkable patience to hold on to a stock in a company that excites you, but which everybody else seems to ignore.", author: "Peter Lynch" },
  { text: "You can't predict the economy. You can, however, position yourself to endure whatever comes.", author: "Peter Lynch" },
  { text: "Everybody in the world is a long-term investor until the market goes down.", author: "Peter Lynch" },
  { text: "Outperforming the majority of investors requires doing what they are not doing.", author: "John Templeton" },
  { text: "If you want to have a better performance than the crowd, you must do things differently from the crowd.", author: "John Templeton" },
  { text: "The time of maximum pessimism is the best time to buy.", author: "John Templeton" },
  { text: "Patience and fortitude conquer all things.", author: "Ralph Waldo Emerson" },
  { text: "An investment in knowledge pays the best interest over time.", author: "Benjamin Franklin" },
  { text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.", author: "Joyce Meyer" },
  { text: "History doesn't repeat itself, but it does rhyme.", author: "Mark Twain" },
  { text: "Dripping water hollows out stone not through force but through persistence.", author: "Ovid" },
  { text: "Wisest is he who knows he does not know.", author: "Socrates" },
  { text: "The flower that blooms in adversity is the rarest and most beautiful of all.", author: "Mulan" },
  { text: "All things are difficult before they are easy.", author: "Thomas Fuller" },
  { text: "An oak is not felled with one blow.", author: "German Proverb" },
  { text: "Things may come to those who wait, but only the things left by those who hustle.", author: "Abraham Lincoln" },
  { text: "We must learn to reawaken and keep ourselves awake, not by mechanical aid, but by an infinite expectation of the dawn.", author: "Henry David Thoreau" },
  { text: "I am a slow walker, but I never walk back.", author: "Abraham Lincoln" },
  { text: "Great works are performed not by strength but by perseverance.", author: "Samuel Johnson" },
  { text: "The strongest of all warriors are these two—Time and Patience.", author: "Leo Tolstoy" },
  { text: "Waiting patiently in expectation is the foundation of the spiritual life.", author: "Simone Weil" },
  { text: "A garden requires patient labor and attention. Plants do not grow merely to satisfy ambitions or to fulfill good intentions.", author: "Liberty Hyde Bailey" },
  { text: "Silence is the sleep that nourishes wisdom.", author: "Francis Bacon" },
  { text: "Do not be in a hurry to succeed. What would you have to live for afterwards? Better make the horizon your goal; it will always be ahead of you.", author: "William Makepeace Thackeray" },
  { text: "All great achievements require time.", author: "Maya Angelou" },
  { text: "Blessed is he who has learned to admire but not envy, to follow but not imitate, to praise but not flatter.", author: "William Arthur Ward" },
  { text: "Be still and know.", author: "Psalm 46:10" },
  { text: "Wait. Be patient. The storm will pass. The spring will come.", author: "Robert H. Schuller" },
  { text: "You cannot control the results, only your actions.", author: "Alan Lokos" },
  { text: "Patience is the calm acceptance that things can happen in a different order than the one you have in mind.", author: "David G. Allen" },
  { text: "When you are going through hell, keep going.", author: "Winston Churchill" },
  { text: "The art of life lies in a constant readjustment to our surroundings.", author: "Okakura Kakuzo" },
  { text: "With time and patience the mulberry leaf becomes a silk gown.", author: "Chinese Proverb" },
  { text: "Even the darkest night will end and the sun will rise.", author: "Victor Hugo" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What you seek is seeking you.", author: "Rumi" },
  { text: "The comeback is always greater than the setback.", author: "Unknown" },
  { text: "He who hurries cannot walk with dignity.", author: "Chinese Proverb" },
  { text: "Trust the process. The dots will connect.", author: "Steve Jobs" },
  { text: "The more you train your mind for patience, the better you become at exercising patience when you need it.", author: "Roy T. Bennett" },
];

function getDailyQuote() {
  // Cycles every 12 hours at local midnight and local noon
  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth(), d = now.getDate();
  const dayNumber = Math.floor(new Date(y, mo, d).getTime() / 86_400_000);
  const halfDayIdx = dayNumber * 2 + (now.getHours() >= 12 ? 1 : 0);
  return STOIC_QUOTES[halfDayIdx % STOIC_QUOTES.length];
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
  const [quoteVersion, setQuoteVersion] = useState(0);
  const [priorityInputs, setPriorityInputs] = useState(['', '', '']);
  const [priorityStruck, setPriorityStruck] = useState<boolean[]>([false, false, false]);
  const cals = useDailyCalories();

  useEffect(() => {
    const sc = localStorage.getItem('grid_cycle_start');
    if (sc) setCycleStart(sc);
  }, []);

  // Schedule re-render at next local noon to refresh quote
  useEffect(() => {
    const now = new Date();
    const h = now.getHours(), min = now.getMinutes(), sec = now.getSeconds();
    const msUntilNext = h < 12
      ? (12 - h) * 3_600_000 - min * 60_000 - sec * 1000
      : (36 - h) * 3_600_000 - min * 60_000 - sec * 1000;
    const timer = setTimeout(() => setQuoteVersion(v => v + 1), msUntilNext);
    return () => clearTimeout(timer);
  }, [quoteVersion]);

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
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-border), transparent)', marginBottom: 20 }} />

        {/* ── TODAY'S 3 priorities ───────────────────────────── */}
        <div className="card mb-5" style={{ borderColor: 'rgba(0,212,255,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>◆ TODAY&apos;S 3</div>
            {dailyPriorities.length > 0 && (
              <button onClick={() => { onSetPriorities([]); setPriorityStruck([false, false, false]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: 'var(--ng-dimmer)', fontFamily: 'inherit' }}>RESET</button>
            )}
          </div>
          {dailyPriorities.length > 0 ? (
            <div>
              {dailyPriorities.map((p, i) => (
                <button key={i} onClick={() => setPriorityStruck(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                  className="w-full text-left flex items-center gap-3 mb-2 p-2"
                  style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 8 }}>
                  <div style={{ width: 18, height: 18, border: `1.5px solid ${priorityStruck[i] ? 'var(--ng-green)' : 'var(--ng-border)'}`, borderRadius: 4, background: priorityStruck[i] ? 'var(--ng-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {priorityStruck[i] && <span style={{ color: '#000', fontWeight: 900, fontSize: 11 }}>✓</span>}
                  </div>
                  <span className="font-mono" style={{ fontSize: 12, color: priorityStruck[i] ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: priorityStruck[i] ? 'line-through' : 'none', flex: 1 }}>{p}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              {[0, 1, 2].map(i => (
                <input key={i} className="ng-input w-full mb-2" style={{ fontSize: 12 }} placeholder={`Priority ${i + 1}...`} value={priorityInputs[i]} onChange={e => setPriorityInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n; })} />
              ))}
              {/* Habit quick-fill chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
                {habits.filter(h => !h.completedToday).slice(0, 8).map(h => (
                  <button key={h.id} onClick={() => { const empty = priorityInputs.findIndex(p => !p.trim()); if (empty !== -1) setPriorityInputs(prev => { const n = [...prev]; n[empty] = h.name; return n; }); }} className="font-mono flex-shrink-0"
                    style={{ fontSize: 10, padding: '4px 8px', border: '0.5px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'var(--ng-surface)', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {h.icon} {h.name}
                  </button>
                ))}
              </div>
              <button onClick={() => { const filled = priorityInputs.filter(p => p.trim()); if (filled.length > 0) onSetPriorities(filled.slice(0, 3)); }} disabled={!priorityInputs.some(p => p.trim())} className="btn-green-solid w-full" style={{ opacity: priorityInputs.some(p => p.trim()) ? 1 : 0.4 }}>
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
