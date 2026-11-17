# DIY

Fix it yourself. Interactive, comic-styled 3D workshops: click the part that's giving you trouble, follow the steps, and open how-to videos on YouTube.

| Workshop | Status |
|---|---|
| PC | Live in this repo (`/pc/`) |
| Garage | Lives at [diy-garage](https://github.com/Sea-Chels/diy-garage) for now, moving here |
| Home | Planned |
| Garden | Live in this repo (`/garden/`) |

Purely client-side: Vite + TypeScript + Three.js + Lucide, no backend, no database.

![The DIY hub with PC, Garage, Home and Garden workshops](docs/hub.jpg)

## PC workshop

A glass-sided PC on a desk beside a monitor. Click a glowing dot and the camera flies in, the side panel swings open, the cooler lifts off the CPU, the shroud folds down over the PSU and drives. Press the power button to watch it POST, enter the BIOS, run an OS installer and land on the desktop.

![Mid tower with an air cooler, RGB fans and the monitor showing a desktop](docs/overview.jpg)

| BIOS & OS setup | Custom loop, full tower |
|---|---|
| ![The monitor showing the BIOS with boot priority and XMP/EXPO](docs/bios.jpg) | ![Full tower with a pink custom water-cooling loop](docs/custom-loop.jpg) |

- **Your rig:** Mini-ITX, mid or full tower; air, AIO or custom loop; no, dual or triple-fan GPU; RGB off, solid or rainbow; case colour.
- **Guides:** troubleshooting (no power, no POST, overheating, crashes, missing drives), replacing parts (RAM, GPU, M.2, PSU, thermal paste, CPU, cooler, fans, motherboard, CMOS battery) and setup (first boot, BIOS, XMP/EXPO, BIOS updates, bootable USB, Windows and Linux installs, drivers).
- **Parts picker:** pick a CPU, board, RAM, GPU, cooler, case, PSU and drives from a curated list and get compatibility checks (socket, memory type, form factor, GPU length, cooler height, radiator size, PSU form factor and wattage, M.2 slots, missing graphics output). Every part links to PCPartPicker for prices; "Show this build in 3D" updates the model.

![Parts picker flagging a DDR4 kit on a DDR5 board, a GPU too long for the case and an undersized PSU](docs/parts-picker.jpg)

## Garden workshop

A lush comic garden: raised beds, a Three Sisters patch, a hoop tunnel, compost bays, a hydroponic tower, a herb spiral, fruit, a pollinator patch, an arbor and a shed pantry. Click a glowing dot and the camera flies in. The raised bed's front swings away to show what's inside, the shed doors open on the pantry shelves, the compost slats come off and the row cover rolls back.

![The garden with raised beds, a PVC hydroponic tower, an arbor, a herb spiral and a pollinator patch](docs/garden.jpg)

| Raised bed cutaway | Plant guide | Bed planner |
|---|---|---|
| ![Raised bed cut away to show logs, branches, cardboard, leaves, compost and topsoil](docs/garden-bed.jpg) | ![Plant care card for goji berry](docs/plant-guide.jpg) | ![Bed planner with a square-foot grid and companion checks](docs/bed-planner.jpg) |

- **Your garden:** season (spring, summer, fall), how the cutaway bed is filled (hugelkultur, lasagna layers or a soil mix) and the hydroponic system (PVC tower, NFT rack or deep-water tote).
- **Guides:** building beds, compost bins, rain barrels, drip lines, hydroponic systems, a herb spiral, a bee hotel and an arbor; growing (companion planting, Three Sisters, seed starting, pawpaws, blueberries, pruning); troubleshooting (blight, blossom-end rot, pests, compost problems, root rot); and preserving (water-bath and pressure canning, freezing, drying, sauerkraut, root cellaring). Canning guides follow USDA/NCHFP tested methods and link to them.
- **Plant guide:** care cards for over 100 plants, from tomatoes and kale to pawpaw, goji, haskap, marshmallow root, wasabi and saffron. Each card covers sun, water, zones, spacing, planting, care, harvest, problems and companions.
- **Bed planner:** pick plants for a 4×4, 3×6 or 4×8 ft bed and see them laid out square-foot style. It flags poor neighbours and sun, water and soil-pH clashes, and suggests good companions. The plan is saved in the browser.

## Run

```sh
pnpm install
pnpm dev        # http://localhost:5173, workshops at /pc/ and /garden/
pnpm build      # outputs dist/
```

## Data sources

| What | Where | Cost |
|---|---|---|
| Guides, steps, tools, cautions | `src/pc/data/guides.ts`, hand-written | Free |
| Parts list and specs for the picker | `src/pc/data/catalog.ts`, hand-curated and rounded | Free |
| Prices and full specs | Links to PCPartPicker search, opened in a new tab | Free |
| Videos | A YouTube search for the job (plus your picked part's name), opened in a new tab | Free |
| Garden guides and plant care | `src/garden/data/guides.ts` and `plants.ts`, hand-written; canning follows [NCHFP](https://nchfp.uga.edu/) tested methods | Free |

## Project layout

```
index.html               hub page
pc/index.html            PC workshop page
garden/index.html        Garden workshop page
src/
  shared/                toon shading + ink outlines, tweens, DOM helpers, icons, modal, base styles
  hub/                   hub script and styles
  pc/
    data/parts.ts        clickable parts (PartId) and which lids open for each
    data/guides.ts       the guide catalog; add guides here
    data/catalog.ts      parts for the picker
    data/compat.ts       compatibility checks and power estimate
    data/setup.ts        case size, cooling, GPU, RGB options
    scene/rig.ts         the stylized PC, monitor and keyboard
    scene/screen.ts      what the monitor shows (POST, BIOS, installer, desktop)
    scene/scene.ts       renderer, lights, picking, camera fly-to
    ui/*                 side panel, guide index, rig menu, parts picker
  garden/
    data/areas.ts        clickable areas (AreaId) and what opens for each
    data/guides.ts       garden guides
    data/plants.ts       plant care cards and companion pairs
    data/plan.ts         bed planner checks
    data/setup.ts        season, bed fill and hydroponics options
    scene/kit.ts         instancing, leaf shapes and canvas textures
    scene/plants.ts      the plant builders (tomato, corn, pawpaw, …)
    scene/rig.ts         the garden layout
    scene/scene.ts       renderer, lights, picking, camera fly-to
    ui/*                 side panel, guide index, plant guide, bed planner
```

Each workshop is its own Vite page (see `vite.config.ts`), so adding Home means a new folder with an `index.html` plus its `src/<name>/` code, reusing `src/shared/`.

### Adding a guide

Add an entry to `GUIDES` in `src/pc/data/guides.ts`. List the parts it belongs to in `parts`, add search words to `aliases`, set `cooling` if it only applies to AIOs or custom loops, and set `ctx` to a picker category so the video search names the user's part. Set `featured: true` to put it in the bar along the bottom.

### Adding a garden guide or plant

Add a guide to `GUIDES` in `src/garden/data/guides.ts`, with its areas in `areas` (the first is where it opens) and plant ids in `plants`. Add a plant to `PLANTS` in `src/garden/data/plants.ts`; `friends` and `avoid` take other plant ids, and setting `area` gives the card a "Show in garden" button.

### Adding a part to the picker

Add an entry to `CATALOG` in `src/pc/data/catalog.ts` with the fields its category needs. `checkBuild` in `src/pc/data/compat.ts` picks it up automatically.

## Deploy to GitHub Pages

1. In the repo, go to Settings, then Pages, and set Source to "GitHub Actions".
2. Run the "Deploy to GitHub Pages" workflow from the Actions tab. To deploy on every push instead, add a `push` trigger for `main` in `.github/workflows/deploy.yml`.

The workflow builds with the right base path and publishes `dist/`.
