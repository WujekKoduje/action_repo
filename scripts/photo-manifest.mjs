/**
 * Single source of truth for every photo on the site.
 *
 * `scripts/optimize-images.mjs` reads this to produce the web-sized WebP
 * derivatives in `public/images/` AND to emit `src/gallery-data.js` (the data
 * the portfolio + gallery pages import). Keep ordering here identical to the
 * Claude Design handoff's `gallery-data.js`.
 *
 * Per item:
 *   file     – source filename inside the handoff `uploads/` folder
 *   slug     – output basename (`<slug>.webp` + `<slug>-full.webp`)
 *   alt      – accessible description
 *   camera   – EXIF line 1 (automotive only)   e.g. "FUJIFILM X-T3 · XF56mm F1.2"
 *   settings – EXIF line 2 (automotive only)   e.g. "56mm · f/4 · 1/240s · ISO 160"
 *   caption  – italic hover caption (portraits / cars & people)
 */

/** @typedef {{file:string, slug:string, alt:string, camera?:string, settings?:string, caption?:string}} Photo */

/** @type {Record<string, { title: string, navLabel: string, items: Photo[] }>} */
export const SECTIONS = {
  automotive: {
    title: 'Automotive',
    navLabel: '01 AUTOMOTIVE',
    items: [
      { file: 'photos-1787779904041-6lbn.jpg', slug: 'automotive-1', alt: 'White Audi RS5 rear, warehouse', camera: 'FUJIFILM X-T3 · XF16-55mm F2.8', settings: '16mm · f/4 · 1/250s · ISO 1600' },
      { file: 'photos-1787779939849-jwso.jpg', slug: 'automotive-2', alt: 'Green Audi RS5, rusty fence', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/4 · 1/240s · ISO 160' },
      { file: 'photos-1787780007208-panh.jpg', slug: 'automotive-3', alt: 'Range Rover at dusk', camera: 'FUJIFILM X-T20 · XF18-55mm F2.8-4', settings: '55mm · f/4 · 1/250s · ISO 400' },
      { file: 'photos-1787780139200-x8s1.jpg', slug: 'automotive-4', alt: 'Black BMW E32 in dark garage', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/1.4 · 1/160s · ISO 800' },
      { file: 'photos-1787779910064-h07n.jpg', slug: 'automotive-5', alt: 'White Audi RS5 front, warehouse', camera: 'FUJIFILM X-T3 · XF16-55mm F2.8', settings: '16mm · f/4 · 1/250s · ISO 1600' },
      { file: '20240824-DSCF6239-Edytuj.jpg', slug: 'automotive-6', alt: 'Neon yellow widebody BMW M3 outside modern office building', camera: 'FUJIFILM X-T3 · XF35mm F1.4', settings: '35mm · f/2 · 1/250s · ISO 640' },
      { file: '20260419-DSCF2866.jpg', slug: 'automotive-7', alt: 'Black BMW 7 Series E32 outside industrial warehouse', camera: 'FUJIFILM X-T3 · XF16-55mm F2.8', settings: '16mm · f/4 · 1/250s · ISO 1600' },
      { file: '20230730-DSCF4365.jpg', slug: 'automotive-8', alt: 'Grey Mercedes-AMG A45 outside modern office building', camera: 'FUJIFILM X-T3 · XF35mm F1.4', settings: '35mm · f/1.4 · 1/1600s · ISO 160' },
      { file: '20260308-DSCF1213-Edytuj.jpg', slug: 'automotive-9', alt: 'White Ford Focus RS by industrial bridge at sunset', camera: 'FUJIFILM X-T3 · XF35mm F1.4', settings: '35mm · f/4 · 1/1100s · ISO 640' },
      { file: '54317588748_6c38544a34_o.jpg', slug: 'automotive-10', alt: 'Blue Audi RS3 Sportback parked at night by K2 building', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/2 · 1/1400s · ISO 640' },
      { file: '54289084444_d93d9a06c8_o.JPG', slug: 'automotive-11', alt: 'Black and white shot of Porsche Cayman GT4 RS on forest road', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/1.4 · 1/500s · ISO 640' },
      { file: '20260216-DSCF0464.JPG', slug: 'automotive-12', alt: 'Pink and black liveried Toyota GR Yaris in the snow by a castle', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/2 · 1/1100s · ISO 640' },
      { file: '20250826-DSCF9617.JPG', slug: 'automotive-13', alt: 'Stanced black Seat Leon in a parking garage', camera: 'FUJIFILM X-T3 · XF56mm F1.2', settings: '56mm · f/2.8 · 1.2s · ISO 800' },
      { file: '20251223-L1000951.JPG', slug: 'automotive-14', alt: 'Black Subaru WRX STI inside an industrial workshop', camera: 'LEICA Q2 · SUMMILUX 28mm F1.7', settings: '28mm · f/1.7 · 1/1000s · ISO 100' },
    ],
  },

  portraits: {
    title: 'Portraits',
    navLabel: '02 PORTRAITS',
    items: [
      { file: 'photos-1787780218754-i1us.jpg', slug: 'portrait-1', alt: 'Portrait, woman on stone stairs in white corset', caption: 'On the steps, quiet composure in white.' },
      { file: 'photos-1787780336071-mvna.jpg', slug: 'portrait-2', alt: 'Portrait with off-shoulder white shirt', caption: 'Off-shoulder white, soft natural light.' },
      { file: 'photos-1787780269681-6lxs.jpg', slug: 'portrait-3', alt: 'Close-up portrait against teal wall', caption: 'Close study against teal, editorial mood.' },
      { file: 'photos-1787780382813-x7am.jpg', slug: 'portrait-4', alt: 'Portrait in metallic dress by fence', caption: 'Metallic dress against a weathered fence.' },
      { file: 'photos-1787780204983-fbq3.jpg', slug: 'portrait-5', alt: 'Portrait, dramatic shadow across face', caption: 'Dramatic shadow play across the face.' },
      { file: 'photos-1787780325563-aeoi.jpg', slug: 'portrait-6', alt: 'Portrait sitting on wooden floor in white shirt', caption: 'Seated in natural light, relaxed portrait.' },
      // NB: the design handoff shuffled the alt/caption pairs for #7-17 — they
      // did not match the images. Re-paired here against the actual photos.
      { file: 'photos-1787780015524-50br.jpg', slug: 'portrait-7', alt: 'Portrait, woman in a red dress leaning on a black car at dusk', caption: 'Red dress, dusk light on the hood.' },
      { file: '20260613-DSCF4919.jpeg', slug: 'portrait-8', alt: 'Portrait inside a car, seatbelt across the frame', caption: 'In the car, candid and unposed.' },
      { file: '20260613-DSCF5057.jpeg', slug: 'portrait-9', alt: 'Portrait in a white lace top inside a garage', caption: 'White lace, workshop backdrop.' },
      { file: '20260704-DSCF6010.jpeg', slug: 'portrait-10', alt: 'Portrait in a trench coat against a garage door', caption: 'Trench coat, evening light on steel.' },
      { file: '20260704-DSCF6067.jpeg', slug: 'portrait-11', alt: 'Black and white portrait in a pleated skirt outdoors', caption: 'Monochrome, open field at dusk.' },
      { file: '20260708-DSCF6304.jpeg', slug: 'portrait-12', alt: 'Portrait in a silver dress against a garden backdrop', caption: 'Silver dress, soft green backdrop.' },
      { file: '20260708-DSCF6347.jpeg', slug: 'portrait-13', alt: 'Portrait against greenery, hand in her hair', caption: 'Green backdrop, quiet upward gaze.' },
      { file: '20260708-DSCF6490.jpeg', slug: 'portrait-14', alt: 'Portrait with arms raised, fountain sculpture behind', caption: 'Arms raised, tattoo detail in soft light.' },
      { file: '20260708-DSCF6523.jpeg', slug: 'portrait-15', alt: 'Kinetic water sculpture with the model out of focus', caption: 'Kinetic fountain, layered depth of field.' },
      { file: '20260708-DSCF6544-3.jpeg', slug: 'portrait-16', alt: 'Portrait in a metallic dress beside a water sculpture', caption: 'Metallic dress, industrial fountain backdrop.' },
      { file: '20260708-DSCF6555.jpeg', slug: 'portrait-17', alt: 'Portrait leaning against a wire-mesh wall', caption: 'Leaning into the frame, wire-mesh texture.' },
    ],
  },

  'automotive-portraits': {
    title: 'Cars & People',
    navLabel: '03 CARS & PEOPLE',
    items: [
      { file: 'photos-1787779976063-y6kn.jpg', slug: 'cars-1', alt: 'Blue BMW M2 drifting through smoke on a forest road', caption: 'Blue M2, sideways through the smoke.' },
      { file: 'photos-1787780287260-mq7k.jpg', slug: 'cars-2', alt: 'Portrait in pink tracksuit with green Audi RS5', caption: 'Pink tracksuit against a green RS5.' },
      { file: 'photos-1787780248177-52ls.jpg', slug: 'cars-3', alt: 'Portrait with green Audi RS5', caption: 'Studio-style portrait beside the green RS5.' },
      { file: '20260613-DSCF5403.JPG', slug: 'cars-4', alt: 'Woman leaning against green Audi RS5 by rusty gate', caption: 'Wide jeans, weathered gate, green RS5.' },
      { file: '20260523-DSCF4774.jpg', slug: 'cars-5', alt: 'Woman kneeling in smoke beside red Audi S3 in studio', caption: 'Studio smoke, red Audi S3.' },
      { file: '20260512-DSCF3525.jpg', slug: 'cars-6', alt: 'Woman sitting against black BMW in a warehouse', caption: 'Seated against the E32, warehouse light.' },
      { file: '20260308-DSCF1233-Edytuj.JPG', slug: 'cars-7', alt: 'Woman watching a black Seat Leon with hood open', caption: 'Engine bay reveal, Seat Leon.' },
      { file: '20260222-DSCF0794.jpg', slug: 'cars-8', alt: 'Woman in red fur coat, black car in background', caption: 'Red fur, city parking lot.' },
      { file: '20260222-DSCF0617.jpg', slug: 'cars-9', alt: 'Woman in red fur coat leaning on black car', caption: 'Leaning on the spoiler, bold red fur.' },
      { file: '20260216-DSCF0414.JPG', slug: 'cars-10', alt: 'Woman in pink hat watching pink Toyota GR Yaris in snow', caption: 'Snow day, pink GR Yaris.' },
      { file: '20250826-DSCF9661.JPG', slug: 'cars-11', alt: 'Man leaning against a booth beside a blue Audi RS3 at night', caption: 'Night shift, blue Audi RS3.' },
      { file: '20240706-DSCF5728.jpg', slug: 'cars-12', alt: 'Legs in red heels stepping out of a classic car', caption: 'Red heels, open door detail.' },
      { file: '20230820-DSCF4849-Enhanced-NR.jpg', slug: 'cars-13', alt: 'Black and white portrait, woman in tulle dress against Mercedes', caption: 'Monochrome, tulle against the Mercedes.' },
      { file: '20230701-DSCF0306-Enhanced-NR.jpg', slug: 'cars-14', alt: "Woman in Let's Save V8 shirt beside a green BMW M3", caption: "Let's Save V8, green M3 headlight glow." },
      { file: '20230701-DSCF0289-Enhanced-NR.jpg', slug: 'cars-15', alt: 'Woman leaning on green BMW M3 hood, neon garage ceiling', caption: 'Leaning on the hood, honeycomb light.' },
    ],
  },

  products: {
    title: 'Products',
    navLabel: '04 PRODUCTS',
    items: [
      { file: '20260714-DSCF6895-a4c0d101.jpeg', slug: 'product-1', alt: 'Aluminum profile close-up on BYLD production line' },
      { file: '20260714-DSCF6838-3cd498ae.jpeg', slug: 'product-2', alt: 'BYLD press tooling detail' },
      { file: '20260714-DSCF6851-5c3167ea.jpeg', slug: 'product-3', alt: 'BYLD facility corridor with signage' },
      { file: '20260714-DSCF6843.jpeg', slug: 'product-4', alt: 'BYLD WALLE machine control panel' },
      { file: '20260714-DSCF6855-002171b7.jpeg', slug: 'product-5', alt: 'BYLD production hall entrance' },
      { file: '20260122-DSCF0264.JPG', slug: 'product-6', alt: 'Black folding knife, blade open against dark wood background' },
      { file: '20260122-DSCF0214.JPG', slug: 'product-7', alt: 'Black folding knife closed, dark moody lighting' },
      { file: '20251209-DSCF9901.JPG', slug: 'product-8', alt: 'Leica camera resting in its box, overhead view' },
      { file: '20251209-DSCF9879.JPG', slug: 'product-9', alt: 'Leica lens macro detail, aperture and focus rings' },
      { file: '20251209-DSCF9866.JPG', slug: 'product-10', alt: 'Leica camera and lens packed in presentation box' },
      { file: '20250927-DSCF9852.JPG', slug: 'product-11', alt: 'Gold ring with black onyx stone on textured fabric' },
      { file: '20250927-DSCF9830.JPG', slug: 'product-12', alt: 'Gold and onyx ring held close, shallow depth of field' },
      { file: '20250823-DSCF9563.JPG', slug: 'product-13', alt: 'White BMW 1 Series, front wheel and splitter detail' },
      { file: '20250823-DSCF9435.JPG', slug: 'product-14', alt: 'White BMW 1 Series rear wheel close-up, brick backdrop' },
      { file: '20240720-DSCF5892.jpg', slug: 'product-15', alt: 'Hands breaking open a blueberry pastry' },
    ],
  },

  pets: {
    title: 'Pets',
    navLabel: '05 PETS',
    items: [
      { file: '20240928-DSCF6302-Enhanced-NR.JPG', slug: 'pets-1', alt: 'Cream British Shorthair cat resting paws on white shelf, Rebel poster behind' },
      { file: '20240928-DSCF6310-Enhanced-NR.JPG', slug: 'pets-2', alt: 'Cream cat looking up from white shelf, overhead view' },
      { file: '20240928-DSCF6325-Enhanced-NR.JPG', slug: 'pets-3', alt: 'Cream cat with grumpy expression on shelf' },
      { file: '20260716-DSCF7332.jpg', slug: 'pets-4', alt: 'Black cocker spaniel looking up at golden hour, tongue out' },
      { file: '20260716-DSCF7562.JPG', slug: 'pets-5', alt: 'Black cocker spaniel meeting another dog through a fence' },
      { file: '20260716-DSCF7655.JPG', slug: 'pets-6', alt: 'Black cocker spaniel close-up portrait in a field, tongue out' },
      { file: '20260815-DSCF7615.JPG', slug: 'pets-7', alt: 'Cream cat resting head on paws, low angle indoors' },
      { file: '20260815-DSCF7633.JPG', slug: 'pets-8', alt: 'Cream cat looking up from the floor, overhead view' },
    ],
  },
};

/** Ordered section keys (also the nav order). */
export const SECTION_ORDER = ['automotive', 'portraits', 'automotive-portraits', 'products', 'pets'];

/**
 * The hero image (`uploads/20251209-DSCF9901-b064a99d.jpeg`) is handled
 * separately by the optimize script — it is the only 2560px asset.
 */
export const HERO = { file: '20251209-DSCF9901-b064a99d.jpeg', slug: 'hero', alt: 'Leica camera and lens resting in its case' };

/**
 * Brand marquee logos.
 *
 *   mode 'plain'  – already white/transparent; just resize (PXN, Kempson).
 *   mode 'white'  – has real alpha; CSS forces it pure white (Workstations, BYLD SVG).
 *   mode 'key'    – source is a logo baked onto an opaque black / textured-dark
 *                   background. The optimize script rebuilds it as a real
 *                   transparent PNG by keying the (dark) background out on
 *                   luminance, so it needs no blend-mode hack on the page.
 *
 * `key` options: extract {left,top,width,height} crop first · maskLin [m,b]
 * linear on the luminance → alpha · threshold N hard-cut the alpha instead of
 * maskLin · rgbLin [m,b] brighten the mark · blur feather the alpha edge.
 */
export const LOGOS = [
  { file: 'pasted-1787818080325-0.png', out: 'logo-workstations.png', width: 600, mode: 'white', h: 36, alt: 'Workstations' },
  { file: 'pasted-1787818173222-0.png', out: 'logo-kpr.png', mode: 'key', h: 40, alt: 'KPR',
    key: { maskLin: [2.2, -18], width: 320 } },
  { file: 'byld-pro-logo.svg', out: 'logo-byld.svg', mode: 'white', h: 26, alt: 'BYLD Pro' },
  { file: 'pasted-1787818294729-0.png', out: 'logo-elitecars.png', mode: 'key', h: 44, alt: 'EliteCars Kraków',
    key: { extract: { left: 365, top: 325, width: 730, height: 470 }, threshold: 112, rgbLin: [4.0, 35], blur: 0.5, width: 260 } },
  { file: 'PXN_White@4x.png', out: 'logo-pxn.png', width: 584, mode: 'plain', h: 30, alt: 'GM PXN' },
  { file: 'pasted-1787818717609-0.png', out: 'logo-naruczaju.png', mode: 'key', h: 26, alt: 'Naruczaju',
    key: { maskLin: [2.4, -22], width: 360 } },
  { file: 'pasted-1787818782197-0.png', out: 'logo-sassy.png', mode: 'key', h: 54, alt: 'Sassy High Heels by Klaudia',
    key: { maskLin: [2.0, -14], rgbLin: [1.15, 0], width: 180 } },
  { file: 'LOGO_KEMPSON_white.avif', out: 'logo-kempson.png', width: 480, mode: 'plain', h: 34, alt: 'Kempson' },
];
