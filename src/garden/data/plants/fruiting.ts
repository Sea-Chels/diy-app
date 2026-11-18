import type { Plant } from '../plants';
import { BRASSICAS } from './common';

export const FRUITING_PLANTS: Plant[] = [
  {
    id: 'tomato', name: 'Tomato', latin: 'Solanum lycopersicum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: '3–8 ft (indeterminate)',
    sow: 'Start indoors 6–8 weeks before your last frost. Plant out when nights stay above 50°F, burying the stem up to the top leaves.', days: '60–85 days from transplant',
    care: ['Cage or stake at planting time, before roots spread.', 'Water deeply and evenly, 1–2 inches a week; mulch to keep moisture steady.', 'On indeterminate types pinch the suckers below the first flower cluster.', 'Feed with compost at planting and a balanced fertilizer when fruit sets; too much nitrogen gives leaves, not fruit.'],
    harvest: 'Pick when fully colored and slightly soft, or at first blush and let them finish on the counter. Never refrigerate ripe tomatoes for flavor.',
    problems: ['Blossom-end rot (uneven watering)', 'Early blight and septoria leaf spot', 'Hornworms', 'Cracking after heavy rain'],
    friends: ['basil', 'marigold', 'carrot', 'onion', 'garlic', 'chives', 'parsley', 'nasturtium', 'borage', 'lettuce'], avoid: ['fennel', 'potato', 'corn', ...BRASSICAS, 'dill', 'walnut'], area: 'kitchen',
  },
  {
    id: 'pepper', name: 'Sweet pepper', latin: 'Capsicum annuum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '1.5–3 ft',
    sow: 'Start indoors 8–10 weeks before last frost on a heat mat (80°F). Transplant once soil is warm, around two weeks after tomatoes.', days: '60–90 days from transplant',
    care: ['Peppers sulk in cold soil; black plastic or a row cover gives them a head start.', 'Stake heavy-fruiting plants.', 'Keep moisture steady; mulch.'],
    harvest: 'Cut (don\'t pull) green peppers when full size, or leave them to turn red, yellow or orange for sweeter fruit.',
    problems: ['Blossom drop in heat over 90°F', 'Blossom-end rot', 'Aphids', 'Sunscald'], friends: ['basil', 'onion', 'tomato', 'carrot', 'marigold'], avoid: ['fennel', 'kohlrabi'],
  },
  {
    id: 'hotpepper', name: 'Hot pepper', latin: 'Capsicum annuum / chinense', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '1.5–4 ft',
    sow: 'Start indoors 8–12 weeks before last frost; habaneros and superhots are slow, so start them first.', days: '70–120 days from transplant',
    care: ['Same care as sweet peppers. A little water stress late in the season makes them hotter.', 'Wear gloves when handling superhots and wash before touching your face.'],
    harvest: 'Pick at any color; heat and sweetness peak when fully ripe. Dry, freeze or ferment into hot sauce.',
    problems: ['Slow germination (keep warm)', 'Aphids', 'Blossom drop'], friends: ['basil', 'onion', 'tomato', 'carrot'], avoid: ['fennel'],
  },
  {
    id: 'eggplant', name: 'Eggplant', latin: 'Solanum melongena', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: '2–3 ft',
    sow: 'Start indoors 8–10 weeks before last frost. Transplant into warm soil after nights stay above 55°F.', days: '65–80 days from transplant',
    care: ['Loves heat; a row cover early on keeps flea beetles off.', 'Stake plants carrying several fruit.'],
    harvest: 'Pick while the skin is glossy and springs back when pressed. Dull skin means seedy and bitter.',
    problems: ['Flea beetles (shot-hole leaves)', 'Colorado potato beetle', 'Verticillium wilt'], friends: ['beans', 'marigold', 'basil', 'pepper'], avoid: ['fennel'],
  },
  {
    id: 'tomatillo', name: 'Tomatillo', latin: 'Physalis philadelphica', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 36, height: '3–4 ft, sprawling',
    sow: 'Start indoors 6–8 weeks before last frost, like tomatoes. Plant at least two: they won\'t set fruit alone.', days: '75–100 days from transplant',
    care: ['Cage or let sprawl. Very forgiving of heat.'], harvest: 'Pick when the fruit fills and splits the papery husk. Base of salsa verde.',
    problems: ['Empty husks (needs a second plant to pollinate)'], friends: ['basil', 'marigold', 'onion'], avoid: ['fennel'],
  },
  {
    id: 'groundcherry', name: 'Ground cherry', latin: 'Physalis pruinosa', type: 'fruit', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: '1.5–2 ft, sprawling',
    sow: 'Start indoors 6–8 weeks before last frost, like tomatoes.', days: '70 days from transplant',
    care: ['Sprawls widely; give it room or a low cage.', 'Self-seeds generously, so expect volunteers.'],
    harvest: 'Ripe fruit drops to the ground in its papery husk, so gather from under the plant. Tastes like pineapple-vanilla tomato.',
    problems: ['Flea beetles', 'Unripe fruit is toxic: eat only golden fruit'], friends: ['basil', 'marigold'], avoid: ['fennel'], unusual: true,
  },
  {
    id: 'cucumber', name: 'Cucumber', latin: 'Cucumis sativus', type: 'veg', life: 'annual', sun: 'full', water: 'high', spacing: 12, height: 'Vines to 6 ft',
    sow: 'Direct sow 1 inch deep once soil is 65°F, about 2 weeks after last frost.', days: '50–70 days',
    care: ['Grow up a trellis for straight fruit and fewer diseases.', 'Water consistently; bitterness comes from stress.', 'Pick often to keep vines producing.'],
    harvest: 'Pick slicers at 6–8 inches, picklers at 2–4 inches. Over-ripe yellow cukes stop the vine.',
    problems: ['Cucumber beetles and bacterial wilt', 'Powdery mildew', 'Poor pollination (misshapen fruit)'], friends: ['beans', 'peas', 'dill', 'nasturtium', 'radish', 'sunflower', 'lettuce', 'marigold'], avoid: ['potato', 'sage'], area: 'arbor',
  },
  {
    id: 'zucchini', name: 'Zucchini (summer squash)', latin: 'Cucurbita pepo', type: 'veg', life: 'annual', sun: 'full', water: 'high', spacing: 36, height: '2–3 ft bush, 4 ft wide',
    sow: 'Direct sow 2–3 seeds per hill after last frost when soil is warm; thin to the strongest.', days: '45–55 days',
    care: ['One or two plants feed a family.', 'Water at the base to keep powdery mildew down.', 'Watch the base of stems for squash vine borer frass.'],
    harvest: 'Pick at 6–8 inches, every day or two in midsummer. Flowers are edible too.',
    problems: ['Squash vine borer', 'Squash bugs', 'Powdery mildew', 'Blossom-end rot on early fruit'], friends: ['corn', 'beans', 'nasturtium', 'marigold', 'borage', 'radish'], avoid: ['potato'],
  },
  {
    id: 'pumpkin', name: 'Winter squash & pumpkin', latin: 'Cucurbita maxima / pepo / moschata', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 48, height: 'Vines 10–20 ft',
    sow: 'Direct sow after last frost when soil is 70°F, or start in pots 3 weeks ahead. The third sister: plant about a week after the beans.', days: '85–120 days',
    care: ['Give vines room or train them up a sturdy trellis (small varieties).', 'Butternut (moschata) shrugs off vine borers better than pumpkins.', 'Slip a board under fruit to stop rot.'],
    harvest: 'Harvest when the rind resists a thumbnail and the stem dries. Cure 10 days at 80–85°F, then store cool (50–55°F).',
    problems: ['Squash vine borer', 'Squash bugs', 'Powdery mildew'], friends: ['corn', 'beans', 'nasturtium', 'marigold', 'borage', 'radish'], avoid: ['potato'], area: 'sisters',
  },
  {
    id: 'melon', name: 'Melon (cantaloupe)', latin: 'Cucumis melo', type: 'fruit', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: 'Vines to 6 ft',
    sow: 'Direct sow when soil is 70°F, or start in pots 3–4 weeks ahead (they hate root disturbance).', days: '75–90 days',
    care: ['Black plastic mulch warms the soil.', 'Cut back water as fruit ripens for sweeter melons.'],
    harvest: 'Cantaloupe is ripe at "full slip": it comes off the vine with a light push and smells sweet.',
    problems: ['Cucumber beetles', 'Powdery mildew', 'Bland fruit from overwatering'], friends: ['corn', 'nasturtium', 'radish', 'marigold'], avoid: ['potato'],
  },
  {
    id: 'watermelon', name: 'Watermelon', latin: 'Citrullus lanatus', type: 'fruit', life: 'annual', sun: 'full', water: 'medium', spacing: 48, height: 'Vines 10–15 ft',
    sow: 'Direct sow in warm soil (70°F+) after last frost, or start in pots 3–4 weeks ahead.', days: '80–100 days',
    care: ['Needs a long, hot season; icebox varieties suit short summers.', 'Ease off water in the last two weeks.'],
    harvest: 'Ripe when the tendril nearest the fruit dries brown and the ground spot turns creamy yellow.',
    problems: ['Fusarium wilt', 'Cucumber beetles', 'Aphids'], friends: ['corn', 'nasturtium', 'radish'], avoid: ['potato'],
  },
  {
    id: 'okra', name: 'Okra', latin: 'Abelmoschus esculentus', type: 'veg', life: 'annual', sun: 'full', water: 'low', spacing: 18, height: '3–6 ft',
    sow: 'Soak seed overnight, then direct sow 2–3 weeks after last frost in warm soil.', days: '50–65 days',
    care: ['Thrives in heat and tolerates drought once established.', 'Wear gloves: some varieties have itchy spines.'],
    harvest: 'Pick pods at 2–4 inches every day or two; they turn woody fast.', problems: ['Aphids', 'Stink bugs', 'Slow growth in cool weather'],
    friends: ['pepper', 'eggplant', 'basil', 'melon'], avoid: [], note: 'Its hibiscus-like flowers are a pollinator magnet.',
  },
];
