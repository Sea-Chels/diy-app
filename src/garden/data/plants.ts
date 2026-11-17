/**
 * Plant care cards: common vegetables through to pawpaws, goji and
 * marshmallow root. Companion pairs follow traditional garden lore plus
 * extension-service advice; they're starting points, not laws. Spacing is in
 * inches (square-foot planting uses it), zones are USDA hardiness zones and
 * only matter for perennials.
 */
import type { AreaId } from './areas';

export type PlantType = 'veg' | 'fruit' | 'herb' | 'flower';
export type Sun = 'full' | 'part' | 'shade';
export type Water = 'low' | 'medium' | 'high';
export type Life = 'annual' | 'biennial' | 'perennial' | 'shrub' | 'tree' | 'vine';

export interface Plant {
  id: string;
  name: string;
  latin: string;
  type: PlantType;
  life: Life;
  sun: Sun;
  water: Water;
  /** Hardiness for perennials, shrubs and trees. */
  zones?: [number, number];
  /** Inches between plants. */
  spacing: number;
  /** Mature height, as text. */
  height: string;
  /** When and how to plant. */
  sow: string;
  /** Rough time to first harvest. */
  days: string;
  care: string[];
  harvest: string;
  problems: string[];
  friends: string[];
  avoid: string[];
  /** Soil pH preference when it's unusual. */
  ph?: string;
  /** Somewhere in the 3D garden this plant grows. */
  area?: AreaId;
  /** Unusual or exotic: gets a badge in the plant guide. */
  unusual?: boolean;
  note?: string;
}

export const TYPE_LABEL: Record<PlantType, string> = { veg: 'Vegetables', fruit: 'Fruit & berries', herb: 'Herbs', flower: 'Flowers' };
export const SUN_LABEL: Record<Sun, string> = { full: 'Full sun', part: 'Part sun', shade: 'Shade' };
export const WATER_LABEL: Record<Water, string> = { low: 'Low water', medium: 'Medium water', high: 'Thirsty' };
export const LIFE_LABEL: Record<Life, string> = { annual: 'Annual', biennial: 'Biennial', perennial: 'Perennial', shrub: 'Shrub', tree: 'Tree', vine: 'Perennial vine' };

const BRASSICAS = ['cabbage', 'kale', 'broccoli', 'cauliflower', 'brussels', 'bokchoy', 'kohlrabi', 'collards'];

export const PLANTS: Plant[] = [
  // ---------- fruiting vegetables ----------
  {
    id: 'tomato', name: 'Tomato', latin: 'Solanum lycopersicum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: '3–8 ft (indeterminate)',
    sow: 'Start indoors 6–8 weeks before your last frost. Plant out when nights stay above 50°F, burying the stem up to the top leaves.', days: '60–85 days from transplant',
    care: ['Cage or stake at planting time, before roots spread.', 'Water deeply and evenly, 1–2 inches a week; mulch to keep moisture steady.', 'On indeterminate types pinch the suckers below the first flower cluster.', 'Feed with compost at planting and a balanced fertilizer when fruit sets; too much nitrogen gives leaves, not fruit.'],
    harvest: 'Pick when fully coloured and slightly soft, or at first blush and let them finish on the counter. Never refrigerate ripe tomatoes for flavour.',
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
    harvest: 'Pick at any colour; heat and sweetness peak when fully ripe. Dry, freeze or ferment into hot sauce.',
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
  // ---------- legumes and corn ----------
  {
    id: 'beans', name: 'Pole beans', latin: 'Phaseolus vulgaris', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: 'Vines 6–10 ft',
    sow: 'Direct sow 1 inch deep after last frost when soil is 60°F. In a Three Sisters mound, sow when corn is 4–6 inches tall.', days: '60–70 days',
    care: ['Give them a pole, trellis or corn to climb.', 'Beans fix nitrogen with soil bacteria, so skip the nitrogen fertilizer.', 'Don\'t work among wet plants; it spreads disease.'],
    harvest: 'Pick snap beans before the seeds bulge, every 2–3 days. Leave some to dry on the vine for soup beans and next year\'s seed.',
    problems: ['Mexican bean beetle', 'Aphids', 'Rust'], friends: ['corn', 'pumpkin', 'zucchini', 'cucumber', 'carrot', 'potato', 'strawberry', 'marigold'], avoid: ['onion', 'garlic', 'leek', 'chives', 'fennel', 'beet'], area: 'sisters',
  },
  {
    id: 'bushbeans', name: 'Bush beans', latin: 'Phaseolus vulgaris', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 4, height: '1.5–2 ft',
    sow: 'Direct sow every 2–3 weeks from last frost to midsummer for a steady supply.', days: '50–60 days',
    care: ['No support needed. Mulch to keep pods off the soil.'], harvest: 'Most of the crop comes in one 2–3 week burst. Pick young.',
    problems: ['Mexican bean beetle', 'Rabbits'], friends: ['corn', 'cucumber', 'potato', 'strawberry', 'carrot', 'beet'], avoid: ['onion', 'garlic', 'chives', 'fennel'],
  },
  {
    id: 'peas', name: 'Peas', latin: 'Pisum sativum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 3, height: '2–6 ft',
    sow: 'Direct sow 4–6 weeks before last frost, as soon as soil can be worked. Sow again in late summer for fall.', days: '55–70 days',
    care: ['Give them netting or twiggy branches to climb.', 'Peas stall in heat over 80°F, so get them in early.'],
    harvest: 'Pick snap and snow peas while pods are crisp; shelling peas when pods are plump but still bright green.',
    problems: ['Powdery mildew in warm weather', 'Pea aphids', 'Birds pulling seedlings'], friends: ['carrot', 'radish', 'lettuce', 'spinach', 'turnip', 'cucumber'], avoid: ['onion', 'garlic', 'chives', 'leek'],
  },
  {
    id: 'corn', name: 'Sweet corn', latin: 'Zea mays', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '5–8 ft',
    sow: 'Direct sow after last frost when soil is 60°F. Plant in blocks of at least 4 rows (or Three Sisters mounds) so the wind pollinates every ear.', days: '65–90 days',
    care: ['Heavy feeder: work in compost and side-dress with nitrogen when knee high.', 'Keep sweet corn types apart from popcorn and field corn or they cross.'],
    harvest: 'Ready 18–24 days after silks appear, when silks are brown and a punctured kernel squirts milky juice. Cook or chill right away.',
    problems: ['Corn earworm', 'Raccoons', 'Poorly filled ears (pollination)'], friends: ['beans', 'pumpkin', 'zucchini', 'cucumber', 'melon', 'sunflower'], avoid: ['tomato'], area: 'sisters',
  },
  // ---------- roots and alliums ----------
  {
    id: 'potato', name: 'Potato', latin: 'Solanum tuberosum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '2–3 ft', ph: '5.0–6.0',
    sow: 'Plant chitted seed potatoes 4 inches deep 2–4 weeks before last frost.', days: '70–120 days',
    care: ['Hill soil or straw up the stems as they grow so tubers stay dark (green potatoes are toxic).', 'Grow bags or a tower save space.'],
    harvest: 'Dig new potatoes when plants flower; storage potatoes two weeks after the tops die. Cure 2 weeks at 50–60°F, then store dark at 38–40°F.',
    problems: ['Colorado potato beetle', 'Late blight', 'Scab in alkaline soil'], friends: ['beans', 'corn', 'cabbage', 'marigold', 'horseradish'], avoid: ['tomato', 'pumpkin', 'zucchini', 'cucumber', 'sunflower', 'raspberry'],
  },
  {
    id: 'sweetpotato', name: 'Sweet potato', latin: 'Ipomoea batatas', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: 'Vines to 6 ft',
    sow: 'Plant rooted slips 3–4 weeks after last frost, when soil is 65°F.', days: '90–120 days',
    care: ['Loose soil grows straight roots; raised beds are ideal.', 'Very drought tolerant once established.'],
    harvest: 'Dig before frost. Cure 7–10 days at 80–85°F with high humidity to turn starch to sugar, then store at 55–60°F (never in the fridge).',
    problems: ['Wireworms', 'Deer love the leaves'], friends: ['beans', 'thyme', 'oregano'], avoid: ['pumpkin'], note: 'The young leaves are edible cooked like spinach.',
  },
  {
    id: 'carrot', name: 'Carrot', latin: 'Daucus carota', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 3, height: '1 ft (tops)',
    sow: 'Direct sow ¼ inch deep from 3 weeks before last frost; keep the surface moist for the 2–3 weeks they take to sprout.', days: '60–80 days',
    care: ['Thin to 2–3 inches apart or roots stay skinny.', 'Rocks and clods make forked roots; raised beds help.', 'Cover shoulders with soil to stop green tops.'],
    harvest: 'Pull when shoulders are ¾–1 inch wide. Fall carrots get sweeter after a frost.',
    problems: ['Carrot rust fly', 'Forked roots', 'Poor germination (soil dried out)'], friends: ['onion', 'leek', 'chives', 'rosemary', 'sage', 'lettuce', 'tomato', 'peas', 'radish'], avoid: ['dill', 'parsnip'], area: 'bed',
  },
  {
    id: 'beet', name: 'Beet', latin: 'Beta vulgaris', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1 ft',
    sow: 'Direct sow ½ inch deep 2–4 weeks before last frost and again in late summer. Each "seed" is a cluster, so thin.', days: '50–70 days',
    care: ['Thin to 3–4 inches; eat the thinnings as greens.'], harvest: 'Pull at golf-ball to tennis-ball size. Twist off tops leaving an inch so they don\'t bleed.',
    problems: ['Leaf miners', 'Woody roots in heat'], friends: ['onion', 'garlic', 'lettuce', ...BRASSICAS, 'bushbeans'], avoid: ['beans'],
  },
  {
    id: 'radish', name: 'Radish', latin: 'Raphanus sativus', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 2, height: '6 in',
    sow: 'Direct sow ½ inch deep from 4 weeks before last frost; repeat every 10 days in cool weather.', days: '25–30 days',
    care: ['Fast and easy: great for marking rows of slow carrots.', 'They bolt and turn hot in summer heat.'], harvest: 'Pull as soon as roots size up; they go pithy quickly.',
    problems: ['Flea beetles', 'Root maggots'], friends: ['lettuce', 'carrot', 'cucumber', 'zucchini', 'peas', 'spinach'], avoid: [],
  },
  {
    id: 'turnip', name: 'Turnip', latin: 'Brassica rapa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1 ft',
    sow: 'Direct sow in early spring or, better, late summer for a fall crop.', days: '40–60 days',
    care: ['Grows best in cool weather. Greens are edible too.'], harvest: 'Pull at 2–3 inches across for tender roots.',
    problems: ['Flea beetles', 'Root maggots'], friends: ['peas', 'onion'], avoid: ['potato'],
  },
  {
    id: 'parsnip', name: 'Parsnip', latin: 'Pastinaca sativa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1.5 ft',
    sow: 'Direct sow fresh seed (it doesn\'t keep) in spring; slow to sprout, up to 3 weeks.', days: '110–130 days',
    care: ['Deep, loose soil for long roots.'], harvest: 'Leave in the ground until after a few frosts for sweetness; dig through winter.',
    problems: ['Carrot rust fly', 'Sap can burn skin in sunlight: wear gloves when weeding'], friends: ['onion', 'radish', 'peas'], avoid: ['carrot'],
  },
  {
    id: 'onion', name: 'Onion', latin: 'Allium cepa', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 4, height: '1.5 ft',
    sow: 'Plant sets or transplants 4–6 weeks before last frost. Choose short-, intermediate- or long-day types for your latitude.', days: '90–120 days',
    care: ['Shallow roots: weed carefully and water regularly.', 'Stop watering once tops start to flop.'],
    harvest: 'When most tops fall over, pull and cure 2–3 weeks somewhere airy and dry until necks are papery.',
    problems: ['Onion thrips', 'Bolting from cold stress', 'Neck rot in storage'], friends: ['carrot', 'beet', 'lettuce', 'tomato', 'pepper', ...BRASSICAS, 'strawberry'], avoid: ['beans', 'bushbeans', 'peas', 'asparagus'],
  },
  {
    id: 'garlic', name: 'Garlic', latin: 'Allium sativum', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: '2 ft',
    sow: 'Plant cloves pointy end up, 2 inches deep, in fall about 4–6 weeks before the ground freezes. Mulch over winter.', days: '8–9 months (overwinter)',
    care: ['Cut off hardneck scapes in early summer (and eat them).', 'Stop watering a couple of weeks before harvest.'],
    harvest: 'Dig when the lower third of leaves have browned. Cure 3–4 weeks hanging in shade, then store cool and dry.',
    problems: ['White rot', 'Small bulbs (planted late or crowded)'], friends: ['tomato', 'carrot', 'beet', 'lettuce', ...BRASSICAS, 'rose', 'strawberry'], avoid: ['beans', 'bushbeans', 'peas', 'asparagus'], area: 'pantry',
  },
  {
    id: 'leek', name: 'Leek', latin: 'Allium porrum', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 6, height: '2–3 ft',
    sow: 'Start indoors 10–12 weeks before last frost; transplant into 6-inch-deep holes and water in without backfilling.', days: '100–120 days',
    care: ['Hill soil around the shafts as they grow to blanch them white.'], harvest: 'Dig from late summer through winter; very cold hardy.',
    problems: ['Leek moth', 'Gritty shafts (rinse well)'], friends: ['carrot', 'celery', 'onion'], avoid: ['beans', 'peas'],
  },
  {
    id: 'asparagus', name: 'Asparagus', latin: 'Asparagus officinalis', type: 'veg', life: 'perennial', zones: [3, 8], sun: 'full', water: 'medium', spacing: 18, height: '4–6 ft (ferns)',
    sow: 'Plant 1-year crowns in early spring in a trench 6–8 inches deep, filling it in gradually as spears grow.', days: 'Light harvest year 2, full from year 3',
    care: ['A bed lasts 15–20 years, so prepare it well and weed it ruthlessly.', 'Leave ferns standing until they brown in fall; they feed the roots.'],
    harvest: 'Snap spears at 6–8 inches for 2 weeks in year 2, 6–8 weeks from year 3. Stop when spears go pencil-thin.',
    problems: ['Asparagus beetle', 'Weeds'], friends: ['tomato', 'parsley', 'basil'], avoid: ['onion', 'garlic', 'potato'],
  },
  {
    id: 'rhubarb', name: 'Rhubarb', latin: 'Rheum rhabarbarum', type: 'veg', life: 'perennial', zones: [3, 8], sun: 'full', water: 'medium', spacing: 36, height: '2–3 ft',
    sow: 'Plant crowns in early spring with buds 2 inches below the surface.', days: 'Light harvest year 2',
    care: ['Needs winter cold. Feed with compost each spring.', 'Cut off flower stalks as they appear.'],
    harvest: 'Pull (don\'t cut) stalks when 12–18 inches; take no more than a third of the plant.',
    problems: ['The leaves are poisonous (oxalic acid): eat stalks only'], friends: ['strawberry', ...BRASSICAS], avoid: [],
  },
  // ---------- greens and brassicas ----------
  {
    id: 'lettuce', name: 'Lettuce', latin: 'Lactuca sativa', type: 'veg', life: 'annual', sun: 'part', water: 'medium', spacing: 6, height: '6–12 in',
    sow: 'Direct sow ¼ inch deep from 4 weeks before last frost; sow a short row every 2 weeks. Seed needs light to germinate, so barely cover it.', days: '30–60 days',
    care: ['Afternoon shade and steady water slow bolting in summer.', 'Thrives in hydroponics.'],
    harvest: 'Cut outer leaves as needed, or the whole head in the morning while crisp.',
    problems: ['Bolting and bitterness in heat', 'Slugs', 'Aphids'], friends: ['carrot', 'radish', 'strawberry', 'onion', 'chives', 'cucumber', 'beet'], avoid: [], area: 'bed',
  },
  {
    id: 'spinach', name: 'Spinach', latin: 'Spinacia oleracea', type: 'veg', life: 'annual', sun: 'part', water: 'medium', spacing: 4, height: '6–12 in',
    sow: 'Direct sow 4–6 weeks before last frost and again in early fall. Bolts as days lengthen.', days: '40–50 days',
    care: ['Loves cool weather and nitrogen-rich soil.', 'Fall-sown spinach can overwinter under a row cover.'],
    harvest: 'Pick outer leaves, or cut the whole plant an inch above the crown for regrowth.',
    problems: ['Bolting', 'Leaf miners', 'Downy mildew'], friends: ['strawberry', 'peas', 'radish'], avoid: [],
  },
  {
    id: 'kale', name: 'Kale', latin: 'Brassica oleracea var. sabellica', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 18, height: '1.5–3 ft',
    sow: 'Start indoors 6 weeks before last frost or direct sow in spring; sow again midsummer for the sweetest fall crop.', days: '55–75 days',
    care: ['Frost turns starch to sugar, so fall kale is best.', 'Insect netting over hoops stops cabbage worms.'],
    harvest: 'Pick lower leaves, leaving the top rosette to keep growing.', problems: ['Cabbage worms', 'Aphids', 'Flea beetles'],
    friends: ['dill', 'onion', 'garlic', 'chamomile', 'nasturtium', 'rosemary', 'sage', 'thyme', 'beet', 'celery'], avoid: ['strawberry', 'tomato', 'beans'], area: 'bed',
  },
  {
    id: 'chard', name: 'Swiss chard', latin: 'Beta vulgaris var. cicla', type: 'veg', life: 'biennial', sun: 'part', water: 'medium', spacing: 12, height: '1.5–2 ft',
    sow: 'Direct sow from 2 weeks before last frost through midsummer.', days: '50–60 days',
    care: ['Shrugs off both heat and light frost; one planting lasts all season.'], harvest: 'Cut outer stalks an inch above the soil; it keeps coming.',
    problems: ['Leaf miners', 'Slugs'], friends: ['onion', ...BRASSICAS, 'lettuce'], avoid: ['beans'], area: 'bed',
  },
  {
    id: 'cabbage', name: 'Cabbage', latin: 'Brassica oleracea var. capitata', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 18, height: '1–1.5 ft',
    sow: 'Start indoors 6–8 weeks before last frost; transplant 2–4 weeks before last frost. Fall crops: start in midsummer.', days: '70–100 days from transplant',
    care: ['Heavy feeder; side-dress with compost.', 'Even watering prevents split heads.', 'Grow under insect netting to stop cabbage white butterflies laying eggs.'],
    harvest: 'Cut when heads are firm. Leave the stump and small side heads often follow.',
    problems: ['Cabbage worms and loopers', 'Split heads', 'Clubroot in acid soil'], friends: ['dill', 'onion', 'garlic', 'chamomile', 'nasturtium', 'rosemary', 'sage', 'thyme', 'beet', 'celery', 'potato'], avoid: ['strawberry', 'tomato', 'pepper', 'beans'], area: 'tunnel',
  },
  {
    id: 'broccoli', name: 'Broccoli', latin: 'Brassica oleracea var. italica', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '2–3 ft',
    sow: 'Start indoors 6–8 weeks before last frost, or midsummer for fall (fall broccoli is better).', days: '60–90 days from transplant',
    care: ['Heads bolt to yellow flowers in heat, so time it for cool weather.'], harvest: 'Cut the main head while buds are tight; side shoots follow for weeks.',
    problems: ['Cabbage worms', 'Aphids', 'Buttoning (tiny heads from transplant stress)'], friends: ['dill', 'onion', 'chamomile', 'nasturtium', 'rosemary', 'beet', 'celery'], avoid: ['strawberry', 'tomato', 'beans'],
  },
  {
    id: 'cauliflower', name: 'Cauliflower', latin: 'Brassica oleracea var. botrytis', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '1.5–2 ft',
    sow: 'Start indoors 6–8 weeks before last frost or midsummer for fall. The fussiest brassica: needs steady cool weather.', days: '55–80 days from transplant',
    care: ['When the curd is egg-sized, fold leaves over it to keep it white (or grow self-blanching or purple types).'], harvest: 'Cut when curds are full and tight, before they go grainy.',
    problems: ['Buttoning', 'Ricey or purple-tinged curds in heat', 'Cabbage worms'], friends: ['dill', 'onion', 'celery', 'nasturtium', 'beet'], avoid: ['strawberry', 'tomato', 'beans'],
  },
  {
    id: 'brussels', name: 'Brussels sprouts', latin: 'Brassica oleracea var. gemmifera', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: '2–3 ft',
    sow: 'Start indoors in late spring for a fall harvest; they need a long season.', days: '90–110 days from transplant',
    care: ['Stake tall plants in windy spots.', 'Snap off the top a month before harvest so sprouts size up together.'], harvest: 'Twist off sprouts from the bottom up after a few frosts.',
    problems: ['Aphids', 'Cabbage worms', 'Loose sprouts in heat'], friends: ['dill', 'onion', 'nasturtium', 'sage', 'thyme'], avoid: ['strawberry', 'tomato', 'beans'],
  },
  {
    id: 'bokchoy', name: 'Bok choy', latin: 'Brassica rapa subsp. chinensis', type: 'veg', life: 'annual', sun: 'part', water: 'medium', spacing: 8, height: '1 ft',
    sow: 'Direct sow in early spring or late summer. Bolts fast in long hot days.', days: '30–50 days',
    care: ['Great for hydroponics and the hoop tunnel.'], harvest: 'Cut whole heads, or baby leaves at 3 weeks.', problems: ['Flea beetles', 'Bolting'],
    friends: ['onion', 'dill', 'celery'], avoid: ['strawberry', 'tomato'],
  },
  {
    id: 'kohlrabi', name: 'Kohlrabi', latin: 'Brassica oleracea var. gongylodes', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 6, height: '1 ft',
    sow: 'Direct sow in spring and late summer.', days: '45–60 days',
    care: ['Quick and easy; the swollen stem tastes like sweet broccoli stalk.'], harvest: 'Pick when the bulb is 2–3 inches across, before it turns woody.',
    problems: ['Cabbage worms', 'Woody bulbs if left too long'], friends: ['onion', 'beet', 'cucumber'], avoid: ['pepper', 'tomato', 'strawberry'],
  },
  {
    id: 'collards', name: 'Collard greens', latin: 'Brassica oleracea var. viridis', type: 'veg', life: 'biennial', sun: 'full', water: 'medium', spacing: 18, height: '2–3 ft',
    sow: 'Direct sow in spring or, for the sweetest leaves, midsummer for fall.', days: '60–80 days',
    care: ['The most heat-tolerant of the cabbage family, and frost sweetens it.'], harvest: 'Pick lower leaves as needed; plants produce for months.',
    problems: ['Cabbage worms', 'Aphids'], friends: ['dill', 'onion', 'tomato'], avoid: ['strawberry'],
  },
  {
    id: 'arugula', name: 'Arugula', latin: 'Eruca vesicaria', type: 'veg', life: 'annual', sun: 'part', water: 'medium', spacing: 4, height: '8 in',
    sow: 'Direct sow from early spring every 2–3 weeks; again in fall.', days: '21–40 days',
    care: ['Grows like a weed in cool weather; heat makes it fiery and bolty.'], harvest: 'Cut young leaves; the white flowers are edible too.',
    problems: ['Flea beetles', 'Bolting'], friends: ['lettuce', 'spinach', 'onion'], avoid: ['strawberry'],
  },
  {
    id: 'celery', name: 'Celery', latin: 'Apium graveolens', type: 'veg', life: 'biennial', sun: 'full', water: 'high', spacing: 10, height: '1.5–2 ft',
    sow: 'Start indoors 10–12 weeks before last frost; seed is tiny and slow.', days: '100–120 days from transplant',
    care: ['Constant moisture or stalks turn stringy and bitter.', 'Rich soil and regular feeding.'], harvest: 'Cut individual outer stalks or the whole plant at the base.',
    problems: ['Bolting from cold snaps', 'Stringy stalks'], friends: [...BRASSICAS, 'leek', 'tomato', 'beans'], avoid: ['carrot', 'parsnip'],
  },
  {
    id: 'malabar', name: 'Malabar spinach', latin: 'Basella alba', type: 'veg', life: 'annual', sun: 'full', water: 'high', spacing: 12, height: 'Vines 6–10 ft',
    sow: 'Start indoors 6 weeks before last frost or direct sow in warm soil. Nick the seed coat to speed germination.', days: '70 days',
    care: ['A climbing summer "spinach" that loves the heat that makes real spinach bolt.', 'Give it a trellis or the arbor.'],
    harvest: 'Pinch tips and leaves all summer; slightly mucilaginous, great in stir-fries.', problems: ['Few; frost kills it'], friends: ['beans', 'cucumber'], avoid: [], unusual: true,
  },
  {
    id: 'ginger', name: 'Ginger', latin: 'Zingiber officinale', type: 'veg', life: 'perennial', zones: [9, 12], sun: 'part', water: 'medium', spacing: 8, height: '2–3 ft',
    sow: 'Pre-sprout organic grocery or seed ginger with visible buds in a warm spot in late winter; plant out (or in a big pot) after nights stay above 55°F.', days: '8–10 months',
    care: ['Grow in containers outside zone 9 and bring indoors before frost.', 'Dappled shade and rich, moist but well-drained soil.'],
    harvest: 'Dig young "baby ginger" from 4 months; mature rhizomes when leaves yellow in fall.', problems: ['Rot in cold wet soil'],
    friends: ['turmeric'], avoid: [], unusual: true,
  },
  {
    id: 'turmeric', name: 'Turmeric', latin: 'Curcuma longa', type: 'herb', life: 'perennial', zones: [8, 12], sun: 'part', water: 'medium', spacing: 12, height: '3 ft',
    sow: 'Pre-sprout rhizome pieces indoors in late winter; plant out after frost or keep in a large pot.', days: '8–10 months',
    care: ['Same care as ginger: warmth, part shade, steady moisture.'], harvest: 'Dig when leaves die back in fall. Wear gloves: it stains everything orange.',
    problems: ['Rot in cold soil'], friends: ['ginger'], avoid: [], unusual: true,
  },
  {
    id: 'yacon', name: 'Yacon', latin: 'Smallanthus sonchifolius', type: 'veg', life: 'perennial', zones: [8, 11], sun: 'full', water: 'medium', spacing: 36, height: '5–7 ft',
    sow: 'Plant crown divisions after last frost.', days: '6–7 months',
    care: ['Andean relative of the sunflower. Huge, handsome plants.', 'Save the knobbly crown in a cool place over winter to replant.'],
    harvest: 'Dig after the first frost blackens the tops. Sun the tubers a few days to sweeten; crisp like apple-jicama.', problems: ['Few'],
    friends: ['beans', 'pumpkin'], avoid: [], unusual: true,
  },
  {
    id: 'cucamelon', name: 'Cucamelon (mouse melon)', latin: 'Melothria scabra', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: 'Vines to 10 ft',
    sow: 'Start indoors 4–6 weeks before last frost; slow to start, then vigorous.', days: '65–75 days',
    care: ['Grape-sized fruit that look like tiny watermelons and taste like cucumber with lime.', 'Grow up a trellis; more drought tolerant than cucumbers.'],
    harvest: 'Pick when firm and grape-sized; soft ones are seedy.', problems: ['Few'], friends: ['beans', 'peas', 'nasturtium'], avoid: ['potato'], unusual: true,
  },
  {
    id: 'luffa', name: 'Luffa sponge gourd', latin: 'Luffa aegyptiaca', type: 'veg', life: 'annual', sun: 'full', water: 'medium', spacing: 24, height: 'Vines 15–30 ft',
    sow: 'Soak seed, then start indoors 4 weeks before last frost. Needs a long, hot season.', days: '150–200 days (sponges)',
    care: ['Give it a strong trellis or arbor.', 'Young fruit under 6 inches is edible like zucchini.'],
    harvest: 'For sponges, leave fruit until brown, light and rattling; peel, shake out seeds and dry.', problems: ['Too short a season', 'Cucumber beetles'],
    friends: ['beans', 'corn'], avoid: ['potato'], unusual: true,
  },
  // ---------- fruit ----------
  {
    id: 'strawberry', name: 'Strawberry', latin: 'Fragaria × ananassa', type: 'fruit', life: 'perennial', zones: [3, 9], sun: 'full', water: 'medium', spacing: 12, height: '8 in',
    sow: 'Plant crowns in early spring with the crown level with the soil: too deep rots, too high dries out.', days: 'June-bearers year 2; everbearers same summer',
    care: ['Pinch off first-year flowers on June-bearers for stronger plants.', 'Mulch with straw to keep berries clean (that\'s the name).', 'Renew beds every 3–4 years with rooted runners.'],
    harvest: 'Pick fully red berries in the cool of the morning, with the cap on.', problems: ['Slugs', 'Birds', 'Gray mold'],
    friends: ['borage', 'spinach', 'lettuce', 'bushbeans', 'thyme', 'onion'], avoid: [...BRASSICAS, 'fennel'], area: 'hydro',
  },
  {
    id: 'blueberry', name: 'Blueberry', latin: 'Vaccinium corymbosum and kin', type: 'fruit', life: 'shrub', zones: [3, 9], sun: 'full', water: 'medium', spacing: 48, height: '3–6 ft', ph: '4.5–5.5',
    sow: 'Plant 2–3 year old bushes in spring or fall. Grow two or more varieties for better pollination and bigger crops.', days: 'Light crop year 2–3, full by year 6',
    care: ['Needs acid soil: test, then lower pH with elemental sulfur and mix in peat or pine bark (or use a big container).', 'Water with rainwater if your tap water is hard.', 'Mulch with pine bark or needles; shallow roots.', 'Pick off flowers the first year.'],
    harvest: 'Wait a few days after berries turn blue: they sweeten on the bush. Ripe ones drop into your palm.',
    problems: ['Yellow leaves (soil not acid enough)', 'Birds', 'Mummy berry'], friends: ['strawberry', 'thyme'], avoid: [], area: 'fruit',
    note: 'Northern highbush suits zones 4–7, rabbiteye and southern highbush suit 7–9.',
  },
  {
    id: 'raspberry', name: 'Raspberry', latin: 'Rubus idaeus', type: 'fruit', life: 'shrub', zones: [3, 9], sun: 'full', water: 'medium', spacing: 24, height: '4–6 ft canes',
    sow: 'Plant bare-root canes in early spring along a trellis.', days: 'Fall-bearers fruit the first year',
    care: ['Summer-bearers fruit on 2nd-year canes: cut those to the ground after harvest.', 'Fall-bearers: simplest to mow every cane down in late winter.', 'Contain suckers with an edged bed.'],
    harvest: 'Ripe berries slip off the core with a gentle tug. Pick every 2–3 days.', problems: ['Spotted wing drosophila', 'Japanese beetles', 'Cane blight'],
    friends: ['garlic', 'chives', 'marigold'], avoid: ['potato', 'tomato'],
  },
  {
    id: 'blackberry', name: 'Blackberry', latin: 'Rubus spp.', type: 'fruit', life: 'shrub', zones: [5, 10], sun: 'full', water: 'medium', spacing: 48, height: '4–8 ft canes',
    sow: 'Plant in early spring. Thornless trailing types need a trellis; erect types are self-supporting.', days: 'Fruit in year 2',
    care: ['Cut fruited canes to the ground after harvest; tip new canes at 4 ft in summer to branch.'], harvest: 'Pick when fully black and dull, not shiny; shiny ones are still tart.',
    problems: ['Spotted wing drosophila', 'Orange rust (remove infected plants)'], friends: ['garlic', 'tansy'], avoid: ['potato', 'tomato'],
  },
  {
    id: 'goji', name: 'Goji berry', latin: 'Lycium barbarum', type: 'fruit', life: 'shrub', zones: [5, 9], sun: 'full', water: 'low', spacing: 48, height: '4–8 ft, arching',
    sow: 'Plant potted plants in spring in well-drained soil. Tolerates poor, even alkaline or salty soil.', days: 'First berries year 2, good crops year 3–4',
    care: ['Drought tolerant once established; overwatering and rich soil give leaves instead of fruit.', 'Prune in late winter to a few main stems and tip long canes to encourage fruiting side shoots.', 'Remove suckers that pop up around it.'],
    harvest: 'Pick bright red berries by hand or shake onto a sheet; they bruise easily. Eat fresh or dry them.',
    problems: ['Powdery mildew', 'Aphids', 'Birds'], friends: ['marigold', 'thyme'], avoid: [], area: 'fruit', unusual: true,
    note: 'A nightshade-family shrub, so don\'t eat the leaves or unripe green berries.',
  },
  {
    id: 'pawpaw', name: 'Pawpaw', latin: 'Asimina triloba', type: 'fruit', life: 'tree', zones: [5, 8], sun: 'full', water: 'medium', spacing: 180, height: '15–25 ft',
    sow: 'Plant small container trees in spring (long taproot: don\'t transplant later). Plant two genetically different trees for fruit.', days: 'Fruit in 4–7 years (grafted 3–4)',
    care: ['Seedlings need shade for the first year or two; a tree tube or shade cloth works.', 'Then give them full sun for the best crops.', 'Flowers are pollinated by flies and beetles; hand-pollinate with a small paintbrush for bigger crops.', 'Keep evenly moist and mulched.'],
    harvest: 'Late summer to early fall when fruit softens like a ripe peach and smells fruity. Custardy, mango-banana flavour; keeps only days at room temperature.',
    problems: ['Poor fruit set (one tree or one clone)', 'Sun scorch on young trees'], friends: ['comfrey'], avoid: ['walnut'], area: 'fruit', unusual: true,
    note: 'America\'s largest native fruit, and the only host plant of the zebra swallowtail butterfly.',
  },
  {
    id: 'fig', name: 'Fig', latin: 'Ficus carica', type: 'fruit', life: 'tree', zones: [7, 11], sun: 'full', water: 'medium', spacing: 120, height: '10–20 ft (or a pot)',
    sow: 'Plant in spring against a warm south wall. Cold-hardy varieties like Chicago Hardy survive zone 6 with protection.', days: 'Fruit in 1–3 years',
    care: ['Restricting roots (a pot or a buried slab) gives more fruit, less wood.', 'Wrap or move pots into a garage in hard winters.'],
    harvest: 'Pick when the fruit droops on its stalk and feels soft. Figs don\'t ripen after picking.',
    problems: ['Birds and wasps', 'Winter dieback'], friends: ['marigold', 'mint'], avoid: [],
  },
  {
    id: 'grape', name: 'Grape', latin: 'Vitis spp.', type: 'fruit', life: 'vine', zones: [4, 9], sun: 'full', water: 'low', spacing: 96, height: 'Vines 15–20 ft',
    sow: 'Plant dormant vines in early spring by a sturdy arbor or two-wire trellis.', days: 'Fruit in 3 years',
    care: ['Grapes fruit on one-year-old wood: prune hard each late winter, removing 80–90% of last year\'s growth.', 'Choose disease-resistant varieties for humid climates.'],
    harvest: 'Taste-test: color comes before sweetness. Cut whole clusters.', problems: ['Black rot', 'Japanese beetles', 'Birds'],
    friends: ['hyssop', 'chives', 'clover'], avoid: ['cabbage'], area: 'arbor',
  },
  {
    id: 'kiwi', name: 'Hardy kiwi (kiwiberry)', latin: 'Actinidia arguta', type: 'fruit', life: 'vine', zones: [4, 8], sun: 'full', water: 'medium', spacing: 120, height: 'Vines 20+ ft',
    sow: 'Plant female vines with one male for up to 8 females (or a self-fertile variety) on a strong pergola.', days: 'Fruit in 3–5 years',
    care: ['Very vigorous: prune in winter and twice in summer.', 'Shelter from late spring frosts that nip new shoots.'],
    harvest: 'Grape-sized smooth-skinned kiwis in early fall; pick when firm and ripen on the counter.', problems: ['Late frost damage', 'Cats chew young vines'],
    friends: [], avoid: [], unusual: true,
  },
  {
    id: 'apple', name: 'Apple', latin: 'Malus domestica', type: 'fruit', life: 'tree', zones: [3, 8], sun: 'full', water: 'medium', spacing: 144, height: '8–20 ft depending on rootstock',
    sow: 'Plant bare-root trees in early spring. Most need a different variety blooming at the same time nearby.', days: 'Fruit in 2–5 years',
    care: ['Pick a dwarfing rootstock for small gardens.', 'Prune in late winter to an open centre or central leader.', 'Thin fruitlets to one per cluster for bigger apples.'],
    harvest: 'Ripe when the apple lifts and twists off easily and seeds are brown.', problems: ['Codling moth', 'Apple scab', 'Fire blight'],
    friends: ['chives', 'nasturtium', 'comfrey', 'marigold'], avoid: ['walnut', 'potato'],
  },
  {
    id: 'peach', name: 'Peach', latin: 'Prunus persica', type: 'fruit', life: 'tree', zones: [5, 9], sun: 'full', water: 'medium', spacing: 180, height: '12–15 ft',
    sow: 'Plant bare-root in early spring in well-drained soil; most are self-fertile.', days: 'Fruit in 2–4 years',
    care: ['Prune to an open vase every late winter; peaches fruit on last year\'s wood.', 'Thin fruit to 6–8 inches apart.'],
    harvest: 'Pick when the green background colour turns yellow and the fruit gives slightly.', problems: ['Peach leaf curl (dormant copper spray)', 'Brown rot', 'Late frosts'],
    friends: ['garlic', 'chives', 'marigold'], avoid: ['potato', 'tomato'],
  },
  {
    id: 'elderberry', name: 'Elderberry', latin: 'Sambucus canadensis / nigra', type: 'fruit', life: 'shrub', zones: [3, 9], sun: 'full', water: 'high', spacing: 72, height: '6–12 ft',
    sow: 'Plant two varieties in spring; tolerates wet spots.', days: 'Fruit in year 2',
    care: ['Remove canes older than 3 years each winter.', 'Spreads by suckers.'],
    harvest: 'Cut whole clusters when all berries are dark purple. Strip berries with a fork; freeze to make it easier.',
    problems: ['Raw berries, stems and leaves can cause nausea: cook berries before eating', 'Birds'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'haskap', name: 'Haskap (honeyberry)', latin: 'Lonicera caerulea', type: 'fruit', life: 'shrub', zones: [2, 7], sun: 'full', water: 'medium', spacing: 48, height: '4–6 ft',
    sow: 'Plant two compatible varieties in spring or fall.', days: 'Fruit in 2–3 years',
    care: ['Extremely cold hardy; flowers survive frost.', 'Easy: little pruning for the first five years.'],
    harvest: 'The earliest fruit of the year, before strawberries. Wait until the flesh is purple all the way through.', problems: ['Birds', 'Powdery mildew in heat'],
    friends: [], avoid: [], unusual: true,
  },
  {
    id: 'aronia', name: 'Aronia (chokeberry)', latin: 'Aronia melanocarpa', type: 'fruit', life: 'shrub', zones: [3, 8], sun: 'full', water: 'medium', spacing: 48, height: '3–6 ft',
    sow: 'Plant in spring or fall; self-fertile and very adaptable.', days: 'Fruit in 2–3 years',
    care: ['Nearly pest free. Brilliant red fall colour.'], harvest: 'Pick in late summer; very astringent raw, so use in juice, jam or dried.',
    problems: ['Few'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'currant', name: 'Currant & gooseberry', latin: 'Ribes spp.', type: 'fruit', life: 'shrub', zones: [3, 7], sun: 'part', water: 'medium', spacing: 48, height: '3–5 ft',
    sow: 'Plant in fall or early spring; one of the few fruits happy in part shade.', days: 'Fruit in year 2–3',
    care: ['Prune out stems older than 3 years in late winter.', 'Some areas restrict Ribes because of white pine blister rust: check locally.'],
    harvest: 'Snip whole strigs (clusters) of currants; pick gooseberries green for cooking or soft for eating.', problems: ['Imported currantworm', 'Powdery mildew'],
    friends: [], avoid: [], unusual: true,
  },
  {
    id: 'maypop', name: 'Maypop (hardy passionfruit)', latin: 'Passiflora incarnata', type: 'fruit', life: 'vine', zones: [5, 9], sun: 'full', water: 'low', spacing: 48, height: 'Vines 6–20 ft',
    sow: 'Plant in spring; dies to the ground in winter and pops up in late spring (hence "maypop").', days: 'Fruit in year 2',
    care: ['Spreads underground; give it its own corner or a fence.', 'Two clones fruit better than one; carpenter bees pollinate.'],
    harvest: 'Ripe when the egg-sized fruit wrinkles slightly and drops. Eat the sweet-tart pulp around the seeds.', problems: ['Spreads aggressively'],
    friends: [], avoid: [], unusual: true, note: 'A native host plant of the gulf fritillary butterfly.',
  },
  {
    id: 'persimmon', name: 'American persimmon', latin: 'Diospyros virginiana', type: 'fruit', life: 'tree', zones: [4, 9], sun: 'full', water: 'low', spacing: 240, height: '20–35 ft',
    sow: 'Plant a young container tree; most need a male nearby, or pick a self-fertile variety like Meader.', days: 'Fruit in 4–7 years',
    care: ['Tough, native and drought tolerant once established.'], harvest: 'Wait until fruit is mushy-soft; underripe persimmons are mouth-puckeringly astringent.',
    problems: ['Few'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'jujube', name: 'Jujube', latin: 'Ziziphus jujuba', type: 'fruit', life: 'tree', zones: [5, 9], sun: 'full', water: 'low', spacing: 180, height: '15–25 ft',
    sow: 'Plant grafted trees in spring. Loves hot, dry summers.', days: 'Fruit in 1–3 years',
    care: ['Very drought tolerant; thorny suckers from the rootstock should be removed.'], harvest: 'Crisp like an apple when half brown; chewy and date-like when fully dried on the tree.',
    problems: ['Root suckers'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'mulberry', name: 'Mulberry', latin: 'Morus spp.', type: 'fruit', life: 'tree', zones: [5, 9], sun: 'full', water: 'medium', spacing: 240, height: '15–30 ft (dwarfs 6 ft)',
    sow: 'Plant in spring. Choose a fruiting variety; fruitless male trees are sold for shade.', days: 'Fruit in 2–3 years',
    care: ['Keep away from patios and cars: purple stains!', 'Dwarf everbearing types grow in large pots.'],
    harvest: 'Spread a sheet and shake the branches.', problems: ['Birds (they\'ll share)'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'lemon', name: 'Meyer lemon', latin: 'Citrus × meyeri', type: 'fruit', life: 'tree', zones: [9, 11], sun: 'full', water: 'medium', spacing: 120, height: '6–10 ft (pots 4–6 ft)',
    sow: 'Grow in a large pot with citrus mix outside zone 9; move indoors before frost to a bright, cool window.', days: 'Fruit in 2–3 years',
    care: ['Let the top inch of soil dry between waterings.', 'Feed with citrus fertilizer spring through summer.', 'Hand-pollinate indoor blossoms with a soft brush.'],
    harvest: 'Pick when fully yellow-orange and slightly soft; fruit holds on the tree for weeks.', problems: ['Scale and spider mites indoors', 'Leaf drop after moving'],
    friends: ['marigold', 'nasturtium'], avoid: [], unusual: true,
  },
  {
    id: 'seabuckthorn', name: 'Sea buckthorn', latin: 'Hippophae rhamnoides', type: 'fruit', life: 'shrub', zones: [3, 7], sun: 'full', water: 'low', spacing: 72, height: '6–12 ft, thorny',
    sow: 'Plant one male for up to 6–8 females in spring.', days: 'Fruit in 3–4 years',
    care: ['Fixes its own nitrogen; thrives in poor, sandy soil.', 'Thorny and suckering: site it carefully.'],
    harvest: 'Clip fruiting twigs and freeze them; the frozen orange berries knock off easily. Very tart, packed with vitamin C.', problems: ['Suckers'],
    friends: [], avoid: [], unusual: true,
  },
  // ---------- herbs ----------
  {
    id: 'basil', name: 'Basil', latin: 'Ocimum basilicum', type: 'herb', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '1–2 ft',
    sow: 'Start indoors 6 weeks before last frost or direct sow once nights stay above 50°F. Cold blackens it.', days: '50–75 days',
    care: ['Pinch the tips above a pair of leaves from 6 inches tall for a bushy plant.', 'Pinch off flower spikes to keep leaves coming.', 'Grows beautifully in hydroponics.'],
    harvest: 'Cut stems just above a leaf pair, taking up to a third at a time. Store bunches like flowers in water, not in the fridge.',
    problems: ['Downy mildew (dark spores under leaves)', 'Slugs', 'Japanese beetles'], friends: ['tomato', 'pepper', 'hotpepper', 'oregano', 'parsley', 'asparagus'], avoid: ['sage', 'rue'], area: 'kitchen',
  },
  {
    id: 'rosemary', name: 'Rosemary', latin: 'Salvia rosmarinus', type: 'herb', life: 'perennial', zones: [7, 10], sun: 'full', water: 'low', spacing: 24, height: '2–4 ft',
    sow: 'Buy plants or root cuttings; seed is slow and variable. Plant in sharp-draining soil: the top of a herb spiral is perfect.', days: 'Harvest once established',
    care: ['Hates wet feet more than cold; overwatering kills more rosemary than winter.', 'North of zone 7 grow \'Arp\' or \'Madeline Hill\', or keep it in a pot in a cool bright room over winter.'],
    harvest: 'Snip sprigs any time; prune lightly after flowering to keep it bushy.', problems: ['Root rot', 'Powdery mildew indoors'],
    friends: [...BRASSICAS, 'beans', 'carrot', 'sage'], avoid: ['basil'], area: 'herbs',
  },
  {
    id: 'thyme', name: 'Thyme', latin: 'Thymus vulgaris', type: 'herb', life: 'perennial', zones: [5, 9], sun: 'full', water: 'low', spacing: 12, height: '6–12 in',
    sow: 'Buy plants or divide an old clump in spring; well-drained, lean soil.', days: 'Harvest once established',
    care: ['Shear back by a third after flowering.', 'Replace every 3–4 years when it gets woody in the middle.'],
    harvest: 'Cut sprigs before flowering for the strongest flavour; dries very well.', problems: ['Root rot in wet soil'],
    friends: [...BRASSICAS, 'strawberry', 'tomato', 'eggplant', 'blueberry'], avoid: [], area: 'herbs',
  },
  {
    id: 'sage', name: 'Sage', latin: 'Salvia officinalis', type: 'herb', life: 'perennial', zones: [5, 9], sun: 'full', water: 'low', spacing: 24, height: '2 ft',
    sow: 'Plant nursery plants in spring after frost.', days: 'Harvest once established',
    care: ['Prune by a third in spring to stop it going leggy.', 'Bees adore the blue-purple flowers.'],
    harvest: 'Pick leaves any time; stop heavy picking in fall so it can harden off.', problems: ['Powdery mildew', 'Rot in wet winters'],
    friends: [...BRASSICAS, 'rosemary', 'carrot', 'strawberry', 'tomato'], avoid: ['cucumber', 'basil'], area: 'herbs',
  },
  {
    id: 'oregano', name: 'Oregano', latin: 'Origanum vulgare', type: 'herb', life: 'perennial', zones: [4, 9], sun: 'full', water: 'low', spacing: 12, height: '1–2 ft',
    sow: 'Plant nursery plants or divisions in spring; Greek oregano has the best flavour.', days: 'Harvest once established',
    care: ['Lean soil and sun concentrate the flavour.', 'Cut back after flowering.'], harvest: 'Harvest sprigs just before flowering for drying.',
    problems: ['Spreads; divide every few years'], friends: ['basil', 'pepper', 'tomato', 'sweetpotato'], avoid: [],
  },
  {
    id: 'mint', name: 'Mint', latin: 'Mentha spp.', type: 'herb', life: 'perennial', zones: [3, 9], sun: 'part', water: 'high', spacing: 18, height: '1–2 ft',
    sow: 'Plant a division or rooted cutting, in a pot. Planted in the open it will take over the bed.', days: 'Harvest within weeks',
    care: ['Sink a bottomless pot into the soil if you must plant it in the ground.', 'Cut hard after flowering for fresh leaves.'],
    harvest: 'Pinch tips constantly.', problems: ['Rust', 'Takes over everything'], friends: [...BRASSICAS, 'tomato', 'peas'], avoid: ['parsley', 'chamomile'],
  },
  {
    id: 'parsley', name: 'Parsley', latin: 'Petroselinum crispum', type: 'herb', life: 'biennial', sun: 'part', water: 'medium', spacing: 8, height: '1 ft',
    sow: 'Soak seed overnight and sow in early spring; it takes 2–4 weeks to sprout.', days: '70–90 days',
    care: ['Host plant for black swallowtail caterpillars: plant extra to share.', 'Flowers and dies in its second year.'], harvest: 'Cut outer stems at the base.',
    problems: ['Slow germination', 'Swallowtail caterpillars (welcome guests)'], friends: ['tomato', 'asparagus', 'basil', 'corn'], avoid: ['mint', 'lettuce'],
  },
  {
    id: 'cilantro', name: 'Cilantro (coriander)', latin: 'Coriandrum sativum', type: 'herb', life: 'annual', sun: 'part', water: 'medium', spacing: 6, height: '1–2 ft',
    sow: 'Direct sow every 3 weeks in spring and fall; it bolts in summer heat and resents transplanting.', days: '45–70 days',
    care: ['Let some bolt: the flowers feed beneficial insects and the seeds are coriander.'], harvest: 'Cut leaves young; collect seed heads when brown.',
    problems: ['Bolting'], friends: ['spinach', 'beans', 'tomato'], avoid: ['fennel'],
  },
  {
    id: 'dill', name: 'Dill', latin: 'Anethum graveolens', type: 'herb', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '2–4 ft',
    sow: 'Direct sow after last frost and every few weeks; it doesn\'t transplant well.', days: '40–60 days (leaves)',
    care: ['Flowers attract parasitic wasps and ladybugs.', 'Self-seeds freely.'], harvest: 'Snip leaves any time; cut flower heads for pickles as they open.',
    problems: ['Swallowtail caterpillars'], friends: [...BRASSICAS, 'cucumber', 'lettuce', 'onion'], avoid: ['carrot', 'tomato', 'fennel'],
  },
  {
    id: 'fennel', name: 'Fennel', latin: 'Foeniculum vulgare', type: 'herb', life: 'perennial', zones: [4, 9], sun: 'full', water: 'medium', spacing: 12, height: '3–5 ft',
    sow: 'Direct sow in spring or summer.', days: '60–90 days',
    care: ['Give it its own spot: it is said to stunt many neighbours.', 'Don\'t grow it near dill or they cross.'], harvest: 'Harvest bulbs (Florence fennel) at tennis-ball size; fronds and seeds any time.',
    problems: ['Bolting'], friends: [], avoid: ['tomato', 'beans', 'bushbeans', 'pepper', 'dill', 'cilantro', 'strawberry'],
  },
  {
    id: 'chives', name: 'Chives', latin: 'Allium schoenoprasum', type: 'herb', life: 'perennial', zones: [3, 9], sun: 'full', water: 'medium', spacing: 8, height: '1 ft',
    sow: 'Plant divisions any time, or sow seed in spring.', days: 'Harvest within 60 days',
    care: ['Divide clumps every 3 years.', 'Deadhead to stop it seeding everywhere.'], harvest: 'Cut leaves 2 inches above the ground; the purple flowers are edible.',
    problems: ['Few'], friends: ['carrot', 'tomato', 'rose', 'strawberry', 'apple'], avoid: ['beans', 'peas'], area: 'herbs',
  },
  {
    id: 'lavender', name: 'Lavender', latin: 'Lavandula angustifolia', type: 'herb', life: 'perennial', zones: [5, 9], sun: 'full', water: 'low', spacing: 24, height: '1–3 ft', ph: '6.5–7.5',
    sow: 'Plant in spring in very well-drained, lean, slightly alkaline soil. Gravel mulch suits it.', days: 'Flowers year 1–2',
    care: ['Prune by a third right after flowering, but never cut into bare old wood.', 'No fertilizer: rich soil makes it floppy and short-lived.'],
    harvest: 'Cut stems when the first flowers on the spike open; hang in bundles to dry.', problems: ['Root rot in clay or wet winters'],
    friends: ['rose', ...BRASSICAS], avoid: ['mint'], area: 'arbor',
  },
  {
    id: 'chamomile', name: 'German chamomile', latin: 'Matricaria chamomilla', type: 'herb', life: 'annual', sun: 'full', water: 'medium', spacing: 8, height: '1–2 ft',
    sow: 'Surface-sow (seed needs light) in early spring or fall; self-seeds.', days: '60 days',
    care: ['Easy and undemanding.', 'Said to help brassicas and onions; it draws hoverflies and wasps that eat aphids.'],
    harvest: 'Pinch off flower heads when fully open; dry them on a screen for tea.', problems: ['Aphids'],
    friends: [...BRASSICAS, 'onion', 'cucumber'], avoid: ['mint'], area: 'herbs', note: 'If you\'re allergic to ragweed you may react to chamomile too.',
  },
  {
    id: 'lemonbalm', name: 'Lemon balm', latin: 'Melissa officinalis', type: 'herb', life: 'perennial', zones: [4, 9], sun: 'part', water: 'medium', spacing: 18, height: '1–2 ft',
    sow: 'Plant nursery plants or divisions in spring.', days: 'Harvest within weeks',
    care: ['A mint relative that self-seeds freely; cut off flowers to keep it in check.'], harvest: 'Pick leaves for tea any time; best fresh.',
    problems: ['Self-seeds everywhere'], friends: [...BRASSICAS, 'tomato'], avoid: [],
  },
  {
    id: 'marshmallow', name: 'Marshmallow', latin: 'Althaea officinalis', type: 'herb', life: 'perennial', zones: [3, 9], sun: 'full', water: 'high', spacing: 24, height: '3–5 ft',
    sow: 'Cold-stratify seed in the fridge for 3–4 weeks, then sow indoors in early spring; or plant root divisions. It loves moist soil, like the foot of a herb spiral.', days: 'Roots ready in fall of year 2',
    care: ['Plant where it can stay damp: the edge of a pond, a rain garden, or the bottom of the spiral.', 'Velvety grey-green leaves and pale pink flowers in late summer; cut stems back in fall.', 'Divide every few years when you harvest.'],
    harvest: 'Dig roots in fall of the second year, after the tops die back. Scrub, chop while fresh (they get rock hard) and dry. Leaves and flowers can be picked in summer.',
    problems: ['Hollyhock rust', 'Japanese beetles'], friends: ['chamomile', 'mint'], avoid: [], area: 'herbs', unusual: true,
    note: 'The root\'s mucilage was the original marshmallow confection. It\'s traditionally used in cold infusions; it may slow the absorption of medicines, so take it separately and ask a pharmacist.',
  },
  {
    id: 'calendula', name: 'Calendula', latin: 'Calendula officinalis', type: 'herb', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '1–2 ft',
    sow: 'Direct sow in early spring; tolerates light frost. Sow again in late summer.', days: '45–60 days',
    care: ['Deadhead for months of flowers.', 'Sticky stems trap aphids (a handy trap crop).'], harvest: 'Pick fully open flowers in the morning; dry petals for salves and teas.',
    problems: ['Powdery mildew', 'Aphids'], friends: ['tomato', 'asparagus', 'carrot', ...BRASSICAS], avoid: [],
  },
  {
    id: 'echinacea', name: 'Echinacea (coneflower)', latin: 'Echinacea purpurea', type: 'herb', life: 'perennial', zones: [3, 9], sun: 'full', water: 'low', spacing: 18, height: '2–4 ft',
    sow: 'Plant nursery plants in spring, or cold-stratify seed over winter.', days: 'Flowers year 1–2',
    care: ['Drought tolerant native prairie plant.', 'Leave seed heads standing for goldfinches.'], harvest: 'Roots are dug from 3-year-old plants in fall; flowers and leaves in summer.',
    problems: ['Aster yellows (remove infected plants)'], friends: ['beebalm', 'yarrow'], avoid: [], area: 'pollinators',
  },
  {
    id: 'comfrey', name: 'Comfrey', latin: 'Symphytum × uplandicum', type: 'herb', life: 'perennial', zones: [4, 9], sun: 'part', water: 'medium', spacing: 36, height: '3–4 ft',
    sow: 'Plant root cuttings of sterile \'Bocking 14\' so it can\'t self-seed. Choose the spot carefully: any root left behind regrows.', days: 'Cut 4–5 times a season from year 2',
    care: ['Deep roots mine nutrients; chop the leaves and drop them as mulch or brew a stinky liquid fertilizer.', 'Great compost activator.'],
    harvest: 'Cut whole plants to 2 inches when 2 ft tall. Wear gloves: the hairs irritate.', problems: ['Impossible to remove once planted'],
    friends: ['apple', 'pawpaw', 'asparagus'], avoid: [], area: 'compost', note: 'Not for eating: it contains liver-damaging alkaloids.',
  },
  {
    id: 'stevia', name: 'Stevia', latin: 'Stevia rebaudiana', type: 'herb', life: 'perennial', zones: [9, 11], sun: 'full', water: 'medium', spacing: 18, height: '2 ft',
    sow: 'Buy plants (seed is unreliable); grow as an annual or pot it up for winter.', days: '60 days',
    care: ['Pinch tips for bushiness.'], harvest: 'Leaves are sweetest just before flowering in fall; dry and crumble.', problems: ['Root rot'],
    friends: [], avoid: [], unusual: true,
  },
  {
    id: 'lemongrass', name: 'Lemongrass', latin: 'Cymbopogon citratus', type: 'herb', life: 'perennial', zones: [9, 11], sun: 'full', water: 'medium', spacing: 24, height: '3–5 ft',
    sow: 'Root grocery-store stalks in a glass of water, then pot or plant after frost.', days: '75–100 days',
    care: ['Overwinter a division indoors in cold zones.'], harvest: 'Cut thick stalks at ground level once ½ inch wide.', problems: ['Sharp leaf edges'],
    friends: [], avoid: [], unusual: true,
  },
  {
    id: 'tarragon', name: 'French tarragon', latin: 'Artemisia dracunculus', type: 'herb', life: 'perennial', zones: [4, 8], sun: 'full', water: 'low', spacing: 24, height: '2 ft',
    sow: 'Buy plants: true French tarragon doesn\'t set seed (seed packets are flavourless Russian tarragon).', days: 'Harvest once established',
    care: ['Divide every 3 years to keep it vigorous.'], harvest: 'Snip sprigs through summer.', problems: ['Root rot'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'saffron', name: 'Saffron crocus', latin: 'Crocus sativus', type: 'herb', life: 'perennial', zones: [6, 9], sun: 'full', water: 'low', spacing: 4, height: '6 in',
    sow: 'Plant corms 4 inches deep in late summer in very well-drained soil.', days: 'Blooms 6–8 weeks after planting',
    care: ['Dry summer dormancy; corms multiply each year.'], harvest: 'Pluck the three red stigmas from each fall flower on the morning it opens; dry gently.',
    problems: ['Voles and squirrels eat corms', 'Rot in wet soil'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'wasabi', name: 'Wasabi', latin: 'Eutrema japonicum', type: 'veg', life: 'perennial', zones: [7, 9], sun: 'shade', water: 'high', spacing: 12, height: '1–2 ft',
    sow: 'Plant starts in deep shade with cool, constantly moist soil (or a stream bed).', days: '18–24 months (rhizome)',
    care: ['Hates heat over 80°F and direct sun. One of the trickiest crops in this guide.'], harvest: 'Leaves and stems in year 1; rhizomes after 18–24 months, grated fresh.',
    problems: ['Heat stress', 'Slugs', 'Soft rot'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'moringa', name: 'Moringa', latin: 'Moringa oleifera', type: 'herb', life: 'tree', zones: [9, 11], sun: 'full', water: 'low', spacing: 36, height: '10+ ft (coppice to 4–6 ft)',
    sow: 'Direct sow in warm soil or start in deep pots; grows astonishingly fast.', days: 'Leaves in 60 days',
    care: ['Grow as an annual or a cut-back container plant in cold zones.', 'Pinch the top to keep it bushy and reachable.'],
    harvest: 'Strip leaves from stems; young pods are eaten like green beans.', problems: ['Frost kills it'], friends: [], avoid: [], unusual: true,
  },
  {
    id: 'hops', name: 'Hops', latin: 'Humulus lupulus', type: 'herb', life: 'vine', zones: [3, 8], sun: 'full', water: 'medium', spacing: 36, height: 'Bines 15–25 ft',
    sow: 'Plant female rhizomes in spring and train 2–3 bines up strong twine or a tall arbor.', days: 'Cones late summer',
    care: ['Grows up to a foot a week in early summer.', 'Cut back to the ground each fall.'], harvest: 'Pick cones when papery and springy with yellow lupulin inside; dry quickly.',
    problems: ['Downy mildew', 'Spider mites'], friends: [], avoid: [], area: 'arbor', unusual: true, note: 'Hops are toxic to dogs.',
  },
  {
    id: 'ashwagandha', name: 'Ashwagandha', latin: 'Withania somnifera', type: 'herb', life: 'perennial', zones: [8, 11], sun: 'full', water: 'low', spacing: 18, height: '2–3 ft',
    sow: 'Start indoors 6–8 weeks before last frost; grow as an annual in cold zones.', days: '150–180 days (roots)',
    care: ['Likes heat and dry, lean soil. A nightshade relative.'], harvest: 'Dig roots in fall, wash and dry.',
    problems: ['Flea beetles'], friends: [], avoid: [], unusual: true, note: 'Traditionally used as a medicinal herb; check with a doctor if pregnant or on medication.',
  },
  // ---------- flowers ----------
  {
    id: 'marigold', name: 'French marigold', latin: 'Tagetes patula', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 8, height: '6–12 in',
    sow: 'Start indoors 6 weeks before last frost or direct sow after frost.', days: '50 days to flower',
    care: ['Deadhead for nonstop blooms.', 'French marigold roots release compounds that suppress some root-knot nematodes when grown densely for a season.'],
    harvest: 'Save seeds from dried heads for next year.', problems: ['Spider mites in drought', 'Slugs on seedlings'],
    friends: ['tomato', 'pepper', 'eggplant', 'pumpkin', 'zucchini', 'beans', 'potato', 'cucumber'], avoid: [], area: 'kitchen',
  },
  {
    id: 'nasturtium', name: 'Nasturtium', latin: 'Tropaeolum majus', type: 'flower', life: 'annual', sun: 'full', water: 'low', spacing: 12, height: '1 ft (trailing to 6 ft)',
    sow: 'Direct sow after last frost; soak the big seeds overnight.', days: '50 days to flower',
    care: ['Poor soil gives more flowers; rich soil gives more leaves.', 'A trap crop: aphids and flea beetles go for it instead of your veg.'],
    harvest: 'Leaves and flowers are edible and peppery; green seed pods make "poor man\'s capers".', problems: ['Black aphids (that\'s its job)'],
    friends: ['pumpkin', 'zucchini', 'cucumber', ...BRASSICAS, 'tomato', 'apple'], avoid: [], area: 'kitchen',
  },
  {
    id: 'sunflower', name: 'Sunflower', latin: 'Helianthus annuus', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '3–12 ft',
    sow: 'Direct sow 1 inch deep after last frost; protect seedlings from birds and slugs.', days: '70–100 days',
    care: ['Stake giant types in windy spots.', 'Young heads track the sun; mature heads face east.'],
    harvest: 'When the back of the head turns yellow-brown, cut with a foot of stem and hang to dry; cover with a paper bag to beat the birds.',
    problems: ['Birds and squirrels', 'Sunflower moth'], friends: ['corn', 'cucumber', 'pumpkin', 'zucchini'], avoid: ['potato', 'beans'], area: 'pollinators',
  },
  {
    id: 'zinnia', name: 'Zinnia', latin: 'Zinnia elegans', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 12, height: '1–4 ft',
    sow: 'Direct sow after last frost; they grow fast in warm soil.', days: '60–70 days to flower',
    care: ['The more you cut, the more they bloom.', 'Space well for airflow against mildew.'], harvest: 'Cut when stems are stiff just below the flower (the "wiggle test").',
    problems: ['Powdery mildew'], friends: ['tomato', 'beans', 'cucumber'], avoid: [], area: 'pollinators',
  },
  {
    id: 'cosmos', name: 'Cosmos', latin: 'Cosmos bipinnatus', type: 'flower', life: 'annual', sun: 'full', water: 'low', spacing: 12, height: '3–5 ft',
    sow: 'Direct sow after last frost; thrives in poor soil.', days: '60–90 days to flower',
    care: ['No fertilizer needed. Self-seeds.'], harvest: 'Cut when buds just open for long-lasting bouquets.',
    problems: ['Flops in rich soil'], friends: ['tomato', 'cucumber', 'beans'], avoid: [], area: 'pollinators',
  },
  {
    id: 'borage', name: 'Borage', latin: 'Borago officinalis', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 18, height: '2–3 ft',
    sow: 'Direct sow after last frost; self-seeds forever after.', days: '50 days to flower',
    care: ['One of the best bee plants there is.', 'Brittle stems: give it a sheltered spot.'], harvest: 'The star-shaped blue flowers are edible (cucumber flavour) in salads and ice cubes.',
    problems: ['Self-seeds widely'], friends: ['tomato', 'strawberry', 'pumpkin', 'zucchini', 'cucumber'], avoid: [],
  },
  {
    id: 'alyssum', name: 'Sweet alyssum', latin: 'Lobularia maritima', type: 'flower', life: 'annual', sun: 'full', water: 'medium', spacing: 6, height: '4–6 in',
    sow: 'Surface-sow in early spring; tolerates light frost.', days: '50 days to flower',
    care: ['Shear back in a summer slump and it reblooms.', 'Tiny flowers feed hoverflies whose larvae eat aphids.'], harvest: '—',
    problems: ['Heat slump'], friends: ['lettuce', ...BRASSICAS, 'potato'], avoid: [],
  },
  {
    id: 'beebalm', name: 'Bee balm', latin: 'Monarda didyma', type: 'flower', life: 'perennial', zones: [4, 9], sun: 'full', water: 'medium', spacing: 24, height: '2–4 ft',
    sow: 'Plant divisions in spring.', days: 'Flowers year 1',
    care: ['Divide every 3 years. Choose mildew-resistant varieties.'], harvest: 'Leaves and flowers make a minty tea.',
    problems: ['Powdery mildew', 'Spreads'], friends: ['tomato', 'echinacea'], avoid: [], area: 'pollinators',
  },
  {
    id: 'yarrow', name: 'Yarrow', latin: 'Achillea millefolium', type: 'flower', life: 'perennial', zones: [3, 9], sun: 'full', water: 'low', spacing: 18, height: '1–3 ft',
    sow: 'Plant in spring; thrives on neglect.', days: 'Flowers year 1',
    care: ['Flat flower heads are landing pads for predatory wasps and ladybugs.'], harvest: 'Cut flowers for drying when fully open.',
    problems: ['Floppy in rich soil'], friends: [...BRASSICAS, 'echinacea'], avoid: [],
  },
  {
    id: 'rose', name: 'Climbing rose', latin: 'Rosa spp.', type: 'flower', life: 'shrub', zones: [5, 9], sun: 'full', water: 'medium', spacing: 72, height: '8–15 ft',
    sow: 'Plant bare-root roses in early spring with the graft union at or just below the soil surface (deeper in cold zones).', days: 'Flowers year 1–2',
    care: ['Tie long canes sideways along the arbor: horizontal canes flower more.', 'Prune in late winter: remove dead wood and shorten side shoots to 2–3 buds.', 'Water at the base; wet leaves invite black spot.'],
    harvest: 'Leave the last flush of flowers to form hips for winter interest and rosehip tea.', problems: ['Black spot', 'Japanese beetles', 'Aphids'],
    friends: ['garlic', 'chives', 'lavender'], avoid: [], area: 'arbor',
  },
  {
    id: 'clematis', name: 'Clematis', latin: 'Clematis spp.', type: 'flower', life: 'vine', zones: [4, 9], sun: 'full', water: 'medium', spacing: 36, height: 'Vines 6–12 ft',
    sow: 'Plant in spring with the crown 2–3 inches deep; "head in the sun, feet in the shade" (mulch or low plants over the roots).', days: 'Flowers year 1–2',
    care: ['Pruning depends on its group (1, 2 or 3): check the label before you cut.'], harvest: '—',
    problems: ['Clematis wilt', 'Slugs on new shoots'], friends: ['rose'], avoid: [], area: 'tools',
  },
];

/** Plants that turn up in companion lore but don't have their own card. */
const EXTRA_NAMES: Record<string, string> = { walnut: 'black walnut', hyssop: 'hyssop', clover: 'clover', tansy: 'tansy', horseradish: 'horseradish', rue: 'rue' };

export const PLANT_BY_ID = new Map(PLANTS.map((p) => [p.id, p]));
export const plantName = (id: string) => PLANT_BY_ID.get(id)?.name ?? EXTRA_NAMES[id] ?? id;

/** Friendship works both ways: if either lists the other, they're companions. */
export function relation(a: string, b: string): 'friend' | 'avoid' | null {
  const pa = PLANT_BY_ID.get(a);
  const pb = PLANT_BY_ID.get(b);
  if (pa?.avoid.includes(b) || pb?.avoid.includes(a)) return 'avoid';
  if (pa?.friends.includes(b) || pb?.friends.includes(a)) return 'friend';
  return null;
}

/** Square-foot gardening: plants per square for small things, squares per plant for big ones. */
export function squares(p: Plant): { perSquare: number; squares: number } {
  if (p.spacing <= 3) return { perSquare: 16, squares: 1 };
  if (p.spacing <= 4) return { perSquare: 9, squares: 1 };
  if (p.spacing <= 6) return { perSquare: 4, squares: 1 };
  if (p.spacing <= 12) return { perSquare: 1, squares: 1 };
  return { perSquare: 1, squares: Math.ceil((p.spacing / 12) ** 2) };
}
