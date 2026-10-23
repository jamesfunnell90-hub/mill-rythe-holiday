// Gunwharf Quays directory for the Saturday meet-up. Pure data and search: no DOM.
// Names come from the official shop and eat listings, read 23 Oct 2026. Categories and search keywords are added
// by this app to make searching easy: Gunwharf does not publish them. Shops change, so ring ahead for anything important.
export const GW = {
  name: 'Gunwharf Quays Outlet Centre',
  address: 'Gunwharf Quays, Portsmouth PO1 3TZ',
  phone: '023 9283 6700',
  web: 'https://www.gunwharf-quays.com/',
  checked: '23 Oct 2026',
  srcShops: ['Gunwharf shop listing', 'https://www.gunwharf-quays.com/en/shop-listing'],
  srcFood: ['Gunwharf places to eat', 'https://www.gunwharf-quays.com/en/eat-listing'],
  hours: 'Saturday 09:00 to 20:00 (listed for 2026, marked provisional). Individual shops can differ.',
  hoursSrc: ['Tourism For All listing', 'https://www.tourismforall.co.uk/things-to-do/gunwharf-quays-shopping-centre-p6265011'],
  parking: 'Underground car park via Park Road, open 24 hours. Charges apply. The operator lists a Saturday rate of up to 2 hours £3.60 and 2 to 3 hours £4.60, but another site shows different figures: check before you go. Overflow: Wickham Street PO1 3EF.',
  parkingSrc: ['APCOA car park page', 'https://www.apcoa.co.uk/parking-in/portsmouth/gunwharf-quays-portsmouth']
};

// [name, categories, extra keywords]
const S = (name, cats, kw = '') => ({ name, kind: 'shop', cats: cats.split(' '), kw });
export const SHOPS = [
  S('Adidas', 'sportswear footwear fashion menswear womenswear kidswear', 'trainers sneakers tracksuit'),
  S('AllSaints', 'fashion menswear womenswear', 'leather jacket boots'),
  S('ASICS', 'sportswear footwear', 'running trainers'),
  S('Beauty Outlet', 'beauty fragrance', 'makeup skincare'),
  S('Belstaff', 'fashion outdoor menswear womenswear', 'jacket waterproof'),
  S('Boots', 'pharmacy beauty health fragrance', 'chemist medicine plasters calpol nappies baby'),
  S('BOSS', 'fashion menswear womenswear', 'suit shirt tshirt polo'),
  S('Cadbury Outlet', 'sweets gifts food', 'chocolate biscuits'),
  S('Calvin Klein', 'fashion menswear womenswear', 'underwear tshirt jeans'),
  S('Charles Tyrwhitt', 'fashion menswear', 'shirts suits tie'),
  S('Citizen', 'watches accessories', 'watch'),
  S('Clarins', 'beauty skincare', 'makeup'),
  S('Clarks', 'footwear kidswear', 'shoes school'),
  S('Coach', 'bags accessories fashion', 'handbag purse wallet'),
  S('Columbia', 'outdoor sportswear fashion', 'waterproof hiking jacket'),
  S('Crew Clothing', 'fashion menswear womenswear kidswear', 'tshirt polo jumper stripe sailing'),
  S('Crocs', 'footwear kidswear', 'clogs sandals'),
  S('Denby', 'home kitchen', 'tableware stoneware plates mugs'),
  S('Dune London', 'footwear accessories womenswear', 'shoes bags'),
  S('Fred Perry', 'fashion menswear womenswear', 'polo tshirt'),
  S('French Connection', 'fashion womenswear menswear', 'dress denim'),
  S('GANT', 'fashion menswear womenswear', 'shirt polo tshirt'),
  S('Gunwharf News', 'convenience sweets', 'newsagent newspapers magazines snacks'),
  S('Hackett London', 'fashion menswear', 'tailoring shirt polo'),
  S('HARIBO', 'sweets gifts', 'pick mix candy'),
  S('Hatley', 'kidswear fashion', 'pyjamas pjs rainwear'),
  S('Havaianas', 'footwear', 'flip flops sandals'),
  S('Henri Lloyd', 'fashion outdoor menswear', 'sailing waterproof jacket'),
  S('HOKA', 'sportswear footwear', 'running trainers'),
  S('Hush', 'fashion womenswear', 'loungewear dress'),
  S('Kate Spade New York', 'bags fashion accessories', 'handbag purse'),
  S('Kurt Geiger', 'footwear accessories bags', 'shoes heels'),
  S("L'Occitane", 'beauty skincare gifts', 'fragrance hand cream'),
  S('Lacoste', 'fashion menswear womenswear kidswear', 'polo tshirt'),
  S('Le Creuset', 'kitchen home', 'cookware pans'),
  S('Leaders Waterside Properties', 'services', 'estate agent lettings'),
  S("Levi's", 'fashion menswear womenswear', 'jeans denim tshirt jacket'),
  S('Lindt', 'sweets gifts food', 'chocolate'),
  S('Loake', 'footwear menswear', 'shoes boots'),
  S('Lucy & Yak', 'fashion womenswear', 'dungarees'),
  S('M&S Outlet', 'fashion menswear womenswear kidswear home beauty', 'tshirt underwear clothes'),
  S('Michael Kors', 'bags fashion accessories', 'handbag watch'),
  S('Mint Velvet', 'fashion womenswear', 'dress knitwear'),
  S('Molton Brown', 'beauty fragrance gifts home', 'bath body candle'),
  S('MOSS', 'fashion menswear', 'suits tshirt polo chinos hire'),
  S('Mountain Warehouse', 'outdoor fashion kidswear menswear womenswear', 'waterproof walking camping hiking rainwear'),
  S('Mulberry', 'bags fashion accessories', 'handbag leather'),
  S('Musto', 'outdoor fashion', 'sailing waterproof jacket'),
  S('Musto The Lighthouse', 'outdoor fashion', 'sailing waterproof jacket'),
  S('New Balance', 'sportswear footwear', 'trainers running'),
  S('Nike Unite', 'sportswear footwear fashion kidswear', 'trainers tshirt'),
  S('Oliver Bonas', 'fashion womenswear home gifts jewellery', 'dress'),
  S('Original Penguin', 'fashion menswear', 'polo tshirt'),
  S('Osprey London', 'bags accessories', 'handbag leather scarves'),
  S('Pandora', 'jewellery', 'charms bracelet ring necklace'),
  S("Penhaligon's", 'fragrance beauty', 'perfume scent'),
  S('Piglet in Bed', 'home', 'bedding sleepwear linen'),
  S('Portmeirion Group', 'home kitchen', 'tableware homeware'),
  S('ProCook', 'kitchen home', 'cookware knives'),
  S('PUMA', 'sportswear footwear fashion', 'trainers tshirt'),
  S('Ralph Lauren', 'fashion menswear womenswear kidswear', 'polo shirt tshirt'),
  S('Reiss', 'fashion menswear womenswear', 'tailoring dress'),
  S('Rituals', 'beauty home gifts', 'bath body candle'),
  S('Skechers', 'footwear kidswear sportswear', 'trainers shoes'),
  S('Sunglass Hut', 'eyewear accessories', 'sunglasses glasses'),
  S('Superdry', 'fashion menswear womenswear', 'tshirt hoodie jacket'),
  S('Swarovski', 'jewellery gifts accessories', 'crystal necklace ring'),
  S('Sweaty Betty', 'sportswear womenswear', 'leggings activewear gym'),
  S('Tesco Express', 'convenience food supermarket', 'groceries snacks nappies baby milk'),
  S('The Aspex Shop', 'gifts home art', 'souvenirs'),
  S('The Body Shop', 'beauty skincare gifts', 'bath body'),
  S('The Cosmetics Company Store', 'beauty fragrance skincare', 'makeup'),
  S('The Entertainer', 'toys kids gifts', 'toy shop games lego'),
  S('The North Face', 'outdoor fashion sportswear', 'waterproof jacket hiking'),
  S('The Perfume Shop', 'fragrance beauty gifts', 'perfume aftershave scent'),
  S('The White Company', 'home womenswear gifts', 'bedding candles nightwear'),
  S('Timberland', 'footwear outdoor fashion', 'boots waterproof'),
  S('Tommy Hilfiger', 'fashion menswear womenswear', 'polo tshirt jeans'),
  S('Tommy Hilfiger Womenswear & Kids', 'fashion womenswear kidswear', 'tshirt'),
  S('UGG', 'footwear fashion womenswear', 'boots slippers'),
  S('Under Armour', 'sportswear footwear', 'tshirt gym trainers'),
  S('Vans', 'footwear fashion', 'trainers skate tshirt'),
  S('Weird Fish', 'fashion menswear womenswear', 'tshirt jumper'),
  S('White Stuff', 'fashion womenswear menswear home', 'tshirt dress'),
  S('Whittard of Chelsea', 'tea-coffee gifts food', 'tea coffee cocoa'),
  S('Zwilling', 'kitchen home', 'knives cookware')
];

const F = (name, cats, kw = '', note = '') => ({ name, kind: 'food', cats: cats.split(' '), kw, note });
export const FOOD = [
  F('All Bar One', 'restaurant bar', 'tapas drinks lunch'),
  F('Baked by Sweet Tooth', 'dessert takeaway', 'cookies brownies treats van'),
  F('Banana Tree', 'restaurant asian vegan gluten-free', 'pan-asian noodles curry'),
  F('Bella Italia', 'restaurant italian pizza pasta family', 'kids', 'Listed by the Portsmouth News as a family option.'),
  F('Brasserie Blanc', 'restaurant french', 'lunch'),
  F('Bubble CiTea', 'drinks takeaway', 'bubble tea'),
  F('Burger King', 'fast-food burgers quick family takeaway', 'kids chips nuggets'),
  F('Caffè Nero', 'cafe coffee pastries', 'tea cakes breakfast'),
  F("Carluccio's", 'restaurant italian pasta family', 'kids lunch', 'Named by Gunwharf as a family favourite.'),
  F('Chiquito', 'restaurant mexican', 'burritos tacos'),
  F('Costa Coffee', 'cafe coffee cakes', 'tea sandwiches'),
  F('Cosy Club', 'restaurant bar family', 'comfort food brunch lunch', 'Named by Gunwharf as a family favourite.'),
  F('Five Guys', 'fast-food burgers quick takeaway', 'fries shakes'),
  F("Frankie & Benny's", 'restaurant italian burgers family', 'pasta kids lunch', 'Named by Gunwharf as a family favourite.'),
  F('Giggling Squid', 'restaurant thai', 'lunch'),
  F('Grosvenor Casino', 'dining', 'casino', 'Dining from 19:00 to 02:00 only: not for lunch.'),
  F('Krispy Kreme', 'dessert coffee takeaway', 'doughnuts donuts'),
  F('Las Iguanas', 'restaurant latin', 'cocktails south american'),
  F("Maddie's", 'cafe coffee dessert', 'matcha sweet treats'),
  F("Nando's", 'restaurant chicken family kids-menu', 'peri-peri nandinos', 'Gunwharf says it has a kids Nandinos menu.'),
  F('Pho', 'restaurant vietnamese asian', 'noodles street food'),
  F('PizzaExpress', 'restaurant pizza italian family kids-menu', 'pasta kids meals', 'Gunwharf says it has kids meals and vegan options.'),
  F('Port Coffee', 'cafe coffee', 'aspex gallery'),
  F('RISE by Cornish Bakery', 'bakery cafe coffee breakfast', 'pasties pastries lunch takeaway'),
  F('Slim Chickens', 'fast-food chicken quick', 'tenders wings'),
  F('Spinnaker Kitchen and Bar', 'cafe restaurant waterfront lunch', 'views'),
  F('Tap & Tandoor', 'restaurant indian bar', 'curry craft beer'),
  F('The Alchemist', 'bar restaurant', 'cocktails'),
  F('The Cornish Bakery', 'bakery cafe coffee breakfast', 'pasties pastries lunch takeaway'),
  F('The Fossil Thief', 'cafe bar', 'taproom lock keepers cottage'),
  F('The Liquorist', 'bar restaurant', 'cocktails happy hour'),
  F('The Old Customs House', 'pub restaurant', 'traditional pub food roast'),
  F('The Slug & Lettuce', 'bar restaurant', 'cocktails'),
  F('Wagamama', 'restaurant asian family', 'noodles ramen kids', 'Named by Gunwharf as a family favourite.'),
  F('Zizzi', 'restaurant italian pizza', 'pasta')
];

// Friendly names for the category chips.
export const CAT_LABELS = {
  fashion: 'Fashion', menswear: 'Menswear', womenswear: 'Womenswear', kidswear: 'Kidswear', sportswear: 'Sportswear', footwear: 'Shoes and trainers', outdoor: 'Outdoor and waterproofs',
  beauty: 'Beauty', fragrance: 'Perfume', skincare: 'Skincare', home: 'Home', kitchen: 'Kitchen', jewellery: 'Jewellery', watches: 'Watches', accessories: 'Accessories', bags: 'Bags',
  gifts: 'Gifts', sweets: 'Sweets and chocolate', 'tea-coffee': 'Tea and coffee', pharmacy: 'Chemist', convenience: 'Everyday essentials', toys: 'Toys', eyewear: 'Sunglasses', services: 'Services', art: 'Art',
  restaurant: 'Restaurants', cafe: 'Cafes', coffee: 'Coffee', bakery: 'Bakeries', bar: 'Bars', pub: 'Pub', 'fast-food': 'Fast food', takeaway: 'Takeaway', dessert: 'Treats and desserts', drinks: 'Drinks',
  italian: 'Italian', pizza: 'Pizza', pasta: 'Pasta', asian: 'Asian', burgers: 'Burgers', chicken: 'Chicken', indian: 'Indian', mexican: 'Mexican', latin: 'South American', thai: 'Thai', vietnamese: 'Vietnamese', french: 'French',
  vegan: 'Vegan options', 'gluten-free': 'Gluten free options', family: 'Family favourites', 'kids-menu': 'Kids menu (per Gunwharf)', quick: 'Quick bites', breakfast: 'Breakfast', waterfront: 'Waterfront', dining: 'Evening dining'
};

// What people type -> categories and words we should look for. Typing "t-shirts" finds every fashion shop.
const SYN = {
  fashion: 'tshirt tee tees top tops polo polos shirt shirts jumper jumpers knitwear jeans denim jacket jackets coat coats clothes clothing hoodie hoodies dress dresses trousers chinos',
  menswear: 'men mens man male gents gentleman suit suits tie ties',
  womenswear: 'women womens woman ladies lady female dress dresses',
  kidswear: 'kids kid child children baby boys girls toddler',
  footwear: 'shoe shoes trainers trainer sneakers boots boot sandals sandal slippers flipflops flip-flops heels',
  bags: 'bag handbag handbags purse purses wallet backpack',
  sportswear: 'sport sports gym running activewear leggings tracksuit fitness',
  outdoor: 'waterproof waterproofs hiking walking camping sailing rain rainwear anorak',
  fragrance: 'perfume aftershave scent cologne',
  beauty: 'makeup make-up cosmetics lipstick',
  skincare: 'moisturiser cream',
  sweets: 'chocolate chocolates candy sweet confectionery haribo',
  toys: 'toy lego games game',
  gifts: 'gift present presents souvenir souvenirs',
  kitchen: 'cookware pans pan knives knife saucepan',
  home: 'bedding towels linen homeware candle candles tableware',
  jewellery: 'jewelry ring rings necklace bracelet charm charms earrings',
  watches: 'watch',
  eyewear: 'sunglasses glasses shades',
  pharmacy: 'chemist medicine medicines plasters calpol paracetamol nappies nappy',
  convenience: 'groceries milk snacks newspaper newspapers supermarket',
  coffee: 'latte cappuccino flat-white',
  cafe: 'cafes tea cakes cake sandwich sandwiches',
  bakery: 'pasty pasties pastry pastries bread',
  dessert: 'doughnut doughnuts donut donuts cookie cookies brownie ice-cream',
  restaurant: 'lunch dinner meal sit-down',
  'fast-food': 'burger burgers chips nuggets fries',
  'kids-menu': 'kids-meal kids-meals nandinos',
  quick: 'fast takeaway grab',
  family: 'high-chair highchair high-chairs',
  breakfast: 'brunch'
};
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/t-shirts?/g, 'tshirt').replace(/t shirts?/g, 'tshirt').replace(/[^a-z0-9&\- ]/g, ' ').replace(/\btshirts\b/g, 'tshirt').replace(/\btees\b/g, 'tee').replace(/\s+/g, ' ').trim();
const SYN_TOKEN = {};
for (const [cat, words] of Object.entries(SYN)) for (const w of words.split(' ')) { const k = norm(w); (SYN_TOKEN[k] = SYN_TOKEN[k] || new Set()).add(cat); }
SYN_TOKEN.tshirt = (SYN_TOKEN.tshirt || new Set()).add('fashion');

// Plural and spelling tolerance: shirts -> shirt, mens -> men.
const stem = (t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);

// Words that mean "any clothes shop": they bring back every fashion shop, as asked.
const GENERIC = new Set(['tshirt', 'tee', 'top', 'clothes', 'clothing', 'fashion', 'outfit']);
// Specific garments (jeans, polo, jacket) prefer shops that list them; everything else also matches by category.
const SPECIFIC = new Set(['jeans', 'denim', 'jacket', 'coat', 'polo', 'shirt', 'jumper', 'knitwear', 'hoodie', 'dress', 'trousers', 'chinos', 'leggings', 'underwear', 'suit']);
const words = (s) => norm(s).split(' ').filter(Boolean);
const hasWord = (ws, t) => ws.some((w) => w === t || (t.length >= 3 && w.startsWith(t)));

export function search(items, query, activeCats = []) {
  const toks = words(query).map((t) => (t === 'tops' ? 'top' : t === 'tees' ? 'tee' : t));
  const pool = activeCats.length ? items.filter((i) => activeCats.every((c) => i.cats.includes(c))) : items;
  if (!toks.length) return pool.slice().sort((a, b) => a.name.localeCompare(b.name));
  // per token: the set of items it matches, and how strongly
  const perTok = toks.map((t) => {
    const st = stem(t);
    const syn = new Set([...(SYN_TOKEN[t] || []), ...(SYN_TOKEN[st] || [])]);
    if (CAT_LABELS[t]) syn.add(t); else if (CAT_LABELS[st]) syn.add(st);
    const direct = new Map(), viaCat = new Map();
    for (const it of pool) {
      const nm = words(it.name), kw = words(it.kw), cats = it.cats.flatMap((c) => c.split('-')).concat(it.cats), note = words(it.note || '');
      let d = 0;
      if (hasWord(nm, t) || hasWord(nm, st)) d += 5;
      if (hasWord(kw, t) || hasWord(kw, st)) d += 3;
      if (cats.includes(t) || cats.includes(st)) d += 3;
      if (hasWord(note, t)) d += 1;
      if (d) direct.set(it, d);
      let c = 0; for (const cat of syn) if (it.cats.includes(cat)) c += 2;
      if (c) viaCat.set(it, c);
    }
    if (SPECIFIC.has(t) && !GENERIC.has(t) && direct.size) return direct;
    const m = new Map(viaCat); direct.forEach((v, k) => m.set(k, (m.get(k) || 0) + v)); return m;
  });
  const out = [];
  for (const it of pool) {
    let score = 0, ok = true;
    for (const m of perTok) { const v = m.get(it); if (!v) { ok = false; break; } score += v; }
    if (ok) out.push({ it, score });
  }
  out.sort((a, b) => b.score - a.score || a.it.name.localeCompare(b.it.name));
  return out.map((o) => o.it);
}

export function categoriesFor(items) {
  const n = {};
  items.forEach((i) => i.cats.forEach((c) => { n[c] = (n[c] || 0) + 1; }));
  return Object.entries(n).filter(([c, k]) => k >= 2 && CAT_LABELS[c]).sort((a, b) => b[1] - a[1]).map(([c, k]) => ({ cat: c, label: CAT_LABELS[c], n: k }));
}
