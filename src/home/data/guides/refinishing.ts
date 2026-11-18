import type { Guide } from '../guides';
import { LEAD } from './common';

export const REFINISHING_GUIDES: Guide[] = [
  {
    id: 'strip-paint-wood', title: 'Strip paint from wood', areas: ['paint'], aliases: ['paint stripper', 'remove paint', 'strip furniture', 'heat gun', 'chemical stripper', 'refinish dresser'],
    kind: 'finish', difficulty: 2, minutes: [180, 480], savings: 'a professional strip runs $200+ per piece',
    tools: ['scraper', 'putty-knife', 'heat-gun', 'gloves', 'glasses', 'respirator', 'drop-cloth', 'hepa-vac', 'Brass brush and dental picks'],
    supplies: ['Lead test kit (EPA-recognized)', 'Paint stripper (citrus, soy or benzyl-alcohol based)', 'Plastic wrap', 'Mineral spirits or the cleaner the stripper label calls for', 'Sandpaper 120–220'],
    summary: 'Test for lead first. Then let a gel stripper do the work: brush it on thick, keep it wet under plastic, and scrape the softened paint off with the grain.',
    steps: [
      'Test for lead with an EPA-recognized kit if the piece could be older than 1978. If it\'s positive, skip the heat gun and power sanding (see the cautions).',
      'Work outside or with strong ventilation, on a drop cloth. Remove hardware and drawers.',
      'Brush on a thick coat of stripper in one direction, cover it with plastic wrap to keep it wet, and wait as the label says (often 30 minutes to a few hours).',
      'Scrape the softened paint off with a plastic scraper, going with the grain. Use a brass brush and picks in carvings.',
      'Repeat for stubborn layers. A heat gun on low with a scraper is fast on flat surfaces, but only on lead-free paint.',
      'Clean the residue off with mineral spirits or the cleaner the stripper specifies, and let the wood dry fully.',
      'Sand with 120, then 150 and 180 grit, following the grain.',
    ],
    cautions: [
      'Lead paint: don\'t dry-sand, power-plane, or use a heat gun over 1100°F or an open flame. Use chemical stripping or wet scraping, contain the dust with plastic, clean with a HEPA vacuum and wet wipes, and keep children and pregnant people away.',
      'Avoid methylene chloride strippers; they\'re banned for consumer sale in the US. Read the glove and ventilation requirements on your stripper\'s label.',
    ],
    links: [LEAD],
    query: 'how to strip paint from wood furniture chemical stripper heat gun', featured: true,
  },
  {
    id: 'refinish-wood', title: 'Stain and finish bare wood', areas: ['paint'], aliases: ['refinish furniture', 'stain', 'polyurethane', 'wipe on poly', 'oil finish', 'refinish'],
    kind: 'finish', difficulty: 2, minutes: [120, 300], savings: 'a professional refinish runs hundreds',
    tools: ['sander', 'sanding-sponge', 'brush', 'gloves', 'respirator', 'Lint-free rags'],
    supplies: ['Pre-stain conditioner (for pine, maple, birch, cherry)', 'Stain', 'Finish: wipe-on poly, brushing poly or hard-wax oil', '220 and 320 grit paper', 'Metal can with lid for oily rags'],
    summary: 'Sand evenly, condition blotchy woods, stain, then build thin coats of finish with a light sanding in between.',
    steps: [
      'Finish-sand to 180 or 220 grit and vacuum, then wipe with a tack cloth.',
      'On blotch-prone woods, apply pre-stain conditioner.',
      'Wipe stain on with a rag, let it sit a few minutes, and wipe off the excess with the grain. Test on the back first.',
      'Let it dry (as the can says), then apply a thin coat of finish.',
      'Sand lightly with 320 grit between coats and wipe clean. Three coats for tabletops.',
      'Let it cure before heavy use (often a week or more).',
    ],
    cautions: ['Oily rags can catch fire on their own. Lay them flat outside to dry, or put them in water in a sealed metal can.'],
    query: 'how to stain and finish wood furniture wipe on poly',
  },
  {
    id: 'sticking-drawer', title: 'Fix a sticking drawer', areas: ['paint'], aliases: ['drawer sticks', 'drawer slides', 'drawer runner', 'wax'],
    kind: 'fix', difficulty: 1, minutes: [15, 45], savings: 'free',
    tools: ['screwdriver', 'sanding-sponge'],
    supplies: ['Paraffin wax or a candle stub', 'Wood glue and clamps for loose joints'],
    summary: 'Wood runners stick from swelling and grime: clean and wax them. Metal slides stick from loose screws or bent tracks.',
    steps: [
      'Pull the drawer out and look for shiny rub marks on the runners and drawer bottom edges.',
      'Clean the runners and sand any high spots smooth.',
      'Rub paraffin wax along every wood-on-wood contact.',
      'Re-glue loose drawer corners and clamp until dry.',
      'For metal slides, tighten the screws and check both sides are at the same height.',
    ],
    query: 'how to fix a sticking wooden drawer wax',
  },
];
