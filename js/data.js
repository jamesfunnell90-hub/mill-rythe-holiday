// Static content for App 1. Anything not sourced from PLAN.md is labelled Unverified.
export const PARK = { name: 'Mill Rythe Coastal Village', address: 'Havant Road, Hayling Island PO11 0PB', lat: 50.8013, lon: -0.9688, phone: '02392 460044' };
export const UNV = 'Unverified. Check before relying on it.';
export const MET_OFFICE = 'https://weather.metoffice.gov.uk/forecast/gcp2cm19n';
export const BOOKING_SITE = 'https://away-resorts.sports-booker.com/bookings/';

export const DAYS = [
  { id: 'sat', date: '2026-10-24', short: 'Sat 24', long: 'Saturday 24 October', theme: 'Travel and check-in',
    forecast: 'As of 23 Oct (Met Office): heavy rain from late morning, gusts to about 55 mph.',
    rainSwap: 'Storm day. Skip any stop that is not needed. If the drive is bad, take the safe option and skip the shows: they are optional if you arrive late.',
    plan: [
      { slot: 'Morning', t: '', title: 'Drive down, lunch en route', kind: 'travel', note: 'Half term traffic and the storm. Check the drive weather before leaving.' },
      { slot: 'Midday', t: '', title: 'Supermarket click and collect on the route', kind: 'activity', note: 'James is booking this.' },
      { slot: 'Afternoon', t: '16:00', title: 'Check in (16:00 to 18:00)', kind: 'fixed', card: 'park' },
      { slot: 'Evening', t: '17:00', title: 'Dinner at the Green Room', kind: 'meal', card: 'greenroom', note: 'Shows follow in this plan. Back to the lodge straight after for 19:30 bed.' }
    ],
    alts: { Afternoon: ['soft-play', 'playground'], Evening: ['missing-squirrel', 'catch22'] } },
  { id: 'sun', date: '2026-10-25', short: 'Sun 25', long: 'Sunday 25 October', theme: 'Swim, Emsworth lunch, shows',
    forecast: 'As of 23 Oct (Met Office): showers then sunny, 14°C. Clocks go back at 02:00 and sunset is about 16:50.',
    rainSwap: 'Swap the harbour stroll for an early lunch at The Ropemaker and soft play in the afternoon.',
    plan: [
      { slot: 'Morning', t: '09:00', title: 'Swim (arrive 08:40)', kind: 'swim', card: 'pool', note: 'General swim, 75 min. Both adults swim.' },
      { slot: 'Midday', t: '11:00', title: 'Emsworth harbour stroll', kind: 'outing', card: 'emsworth', note: 'Toddler naps in the car or pushchair.' },
      { slot: 'Midday', t: '11:45', title: 'Sunday lunch at The Ropemaker', kind: 'meal', card: 'ropemaker' },
      { slot: 'Midday', t: '12:30', title: 'Toddler nap (car or pushchair)', kind: 'nap' },
      { slot: 'Afternoon', t: '', title: 'Lodge, then pottery painting or soft play', kind: 'activity', card: 'crafts' },
      { slot: 'Evening', t: '16:45', title: 'Light lodge supper', kind: 'meal', note: 'Salmon and pasta for the kids, or French stick with cheese and ham.' }
    ],
    alts: { Midday: ['blue-reef', 'staunton'], Afternoon: ['soft-play', 'playground', 'crafts'] } },
  { id: 'mon', date: '2026-10-26', short: 'Mon 26', long: 'Monday 26 October', theme: 'Craft, swim, Green Room',
    forecast: 'As of 23 Oct (Met Office): light rain then overcast, 17°C.',
    rainSwap: 'Already mostly indoors. Soft play instead of the adventure playground.',
    plan: [
      { slot: 'Morning', t: '09:00', title: 'Optional toddler nap', kind: 'nap', note: 'Optional, 09:00 to 10:00.' },
      { slot: 'Morning', t: '10:15', title: 'Booked craft', kind: 'activity', card: 'crafts', note: 'Pick a craft that suits a 4 year old and a toddler. Book it.' },
      { slot: 'Midday', t: '12:00', title: 'Swim (arrive 11:40)', kind: 'swim', card: 'pool' },
      { slot: 'Midday', t: '13:00', title: 'Lodge lunch', kind: 'meal' },
      { slot: 'Midday', t: '13:30', title: 'Toddler nap (lodge), to about 15:00', kind: 'nap' },
      { slot: 'Afternoon', t: '15:15', title: 'Soft play or adventure playground', kind: 'activity', card: 'soft-play' },
      { slot: 'Evening', t: '17:00', title: 'Dinner at the Green Room', kind: 'meal', card: 'greenroom' }
    ],
    alts: { Afternoon: ['soft-play', 'playground', 'sports-court'], Morning: ['crafts', 'soft-play'] } },
  { id: 'tue', date: '2026-10-27', short: 'Tue 27', long: 'Tuesday 27 October', theme: 'Farm, swim, nice dinner out',
    forecast: 'As of 23 Oct (Met Office): showers then sunny intervals, 14°C.',
    rainSwap: 'Swap Staunton Farm for Blue Reef Aquarium, Southsea.',
    plan: [
      { slot: 'Morning', t: '10:00', title: 'Staunton Farm, 10:00 to 11:45', kind: 'outing', card: 'staunton' },
      { slot: 'Midday', t: '12:15', title: 'Lodge lunch', kind: 'meal' },
      { slot: 'Midday', t: '12:30', title: 'Toddler nap (lodge), to about 14:00', kind: 'nap' },
      { slot: 'Afternoon', t: '14:30', title: 'Swim (arrive 14:10)', kind: 'swim', card: 'pool', note: 'Leave the park about 16:30 for dinner.' },
      { slot: 'Evening', t: '17:00', title: 'Nice dinner off-site, 17:00 sitting', kind: 'meal', card: 'waterside', note: 'Venue not chosen yet. Waterside is the shortlist leader.' }
    ],
    alts: { Morning: ['blue-reef', 'crafts'], Evening: ['waterside', 'ship-itchenor', 'anchor-bleu'] } },
  { id: 'wed', date: '2026-10-28', short: 'Wed 28', long: 'Wednesday 28 October', theme: 'Check out, big lunch, drive home',
    forecast: 'As of 23 Oct (Met Office): sunny intervals, 15°C.',
    rainSwap: 'Skip the beach and donkey sanctuary. Go to lunch early and head home.',
    plan: [
      { slot: 'Morning', t: '10:00', title: 'Pack and check out by 10:00', kind: 'fixed', card: 'park' },
      { slot: 'Morning', t: '', title: 'Seafront railway, beach or donkey sanctuary', kind: 'outing', card: 'railway' },
      { slot: 'Midday', t: '11:45', title: 'Big lunch out', kind: 'meal', note: 'Venue not chosen yet. On Hayling or on the route home.' },
      { slot: 'Afternoon', t: '13:00', title: 'Drive home in the nap', kind: 'travel', note: 'Alternative: Marwell Zoo on the way home, evening drive.' }
    ],
    alts: { Morning: ['railway', 'donkeys', 'beach'], Afternoon: ['marwell'] } }
];

export const SLOT_DEFAULT = { Morning: '08:00', Midday: '12:00', Afternoon: '15:00', Evening: '17:00' };

// type: onsite | outing | food | essential
export const CARDS = {
  park: { name: 'Mill Rythe Coastal Village', type: 'onsite', what: 'Your holiday park, with a two-bed lodge.', why: 'Everything for a 4 year old and a toddler is on site.', hours: 'Check-in 16:00 to 18:00, check-out 10:00 (from listing sites; confirm from your booking email).', cost: 'Booked.', booking: 'Already booked.', web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/', phone: PARK.phone, place: 'Mill Rythe Coastal Village, Havant Road, Hayling Island PO11 0PB', drive: 'You are here.', parking: UNV, fac: 'Guest Services open 9am to 5pm.' },
  pool: { name: 'Indoor pool: general swim', type: 'onsite', what: 'General swim, 75 min. Arrive 20 min early to change.', why: 'Warm indoor splash in any weather. Under 5s need 1:1.', hours: 'Booked: Sun 09:00, Mon 12:00, Tue 14:30.', cost: UNV, booking: 'Booked. Cancel via the activity booking site or Guest Services.', web: BOOKING_SITE, phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: 'Pool ratios: 0 to 3 year olds 1:1 in the water; max two 4 to 7 year olds per adult. So both adults swim. Baby change: ' + UNV },
  'soft-play': { name: 'Soft play', type: 'onsite', what: 'Indoor soft play.', why: 'Rain-proof burn-off for the 4 year old. Check the toddler zone.', hours: UNV, cost: UNV, booking: 'Check whether it needs booking. ' + UNV, web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/', phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: 'Under 5s need 1:1. ' + UNV },
  playground: { name: 'Adventure playground', type: 'onsite', what: 'Outdoor adventure playground.', why: 'Free fresh air on a dry spell.', hours: UNV, cost: UNV, booking: 'No booking known.', web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/', phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: UNV },
  'sports-court': { name: 'Sports court', type: 'onsite', what: 'Open in October.', why: 'Space for a ball game.', hours: UNV, cost: UNV, booking: UNV, web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/', phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: UNV },
  crafts: { name: 'On-site crafts', type: 'onsite', what: 'Pottery Painting from £9.50 (1+), Make a Plushie from £18 (1+), Cupcake Decorating from £5 (1 to 5), Messy Play from £5 (0 to 5), Tin Can Targets from £9.50 (2 to 7, closed-toe shoes). Tie-Dye and Slime are 5+, so skip them.', why: 'Crafts suit a 4 year old, and Pottery, Plushie and Messy Play also suit the toddler.', hours: 'Slots: ' + UNV, cost: 'Prices from your brief, ' + UNV, booking: 'Book up to 21 days ahead and at least 30 minutes before, on the booking site or in the Away Resorts app.', web: BOOKING_SITE, phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: UNV },
  greenroom: { name: 'The Green Room', type: 'food', what: 'Family pub classics with a gourmet twist, and the home of the kids\' shows.', why: 'Dinner then straight into the shows. Kids eat for £1 with an adult main (park offer, checked 23 Oct).', hours: 'October hours: ' + UNV, cost: 'Kids £1 with an adult main. Happy hour 3pm to 6pm.', booking: 'Not listed on the online booking page. Ask Guest Services or ring 0330 053 7000.', web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/food-and-drink/', phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: 'High chairs: ' + UNV },
  'missing-squirrel': { name: 'The Missing Squirrel', type: 'food', what: 'On-site restaurant.', why: 'A bookable on-site fallback if the Green Room cannot be reserved.', hours: UNV, cost: 'Late cancellation £5 per cover.', booking: 'Book online. Free changes up to 12 hours before.', web: 'https://booking.resdiary.com/widget/Standard/MillRytheMissingSquirrel/33416', phone: '023 9231 1040', place: PARK.address, drive: 'On site.', parking: 'On site.', fac: UNV },
  catch22: { name: 'Catch 22', type: 'food', what: 'Fish and chips via the Away Resorts app.', why: 'Easy lodge supper.', hours: UNV, cost: UNV, booking: 'Order in the Away Resorts app.', web: 'https://www.awayresorts.co.uk/parks/hampshire/mill-rythe/food-and-drink/', phone: PARK.phone, place: PARK.address, drive: 'On site.', parking: 'On site.', fac: UNV },
  ropemaker: { name: 'The Ropemaker, Emsworth', type: 'food', what: 'Heartwood Inns pub with a kids\' menu with activities (per your brief). Default for Sunday lunch.', why: 'Right by Emsworth harbour for a pushchair stroll.', hours: 'Sunday times: ' + UNV, cost: UNV, booking: 'Ring to book. Verify times, menu and high chairs.', web: '', phone: '01243 373363', place: '93 Havant Road, Emsworth PO10 7LF', drive: UNV, parking: UNV, fac: 'High chairs: ' + UNV },
  emsworth: { name: 'Emsworth harbour and town walk', type: 'outing', what: 'Harbour stroll with the pushchair.', why: 'Easy walk that lets the toddler nap.', hours: 'Open air.', cost: 'Free.', booking: 'None.', web: '', phone: '', place: 'Emsworth Harbour, Emsworth PO10', drive: UNV, parking: UNV, fac: UNV },
  staunton: { name: 'Staunton Farm, Havant', type: 'outing', what: 'Working family farm with animals.', why: 'A 4 year old who loves animals. Ride-on tractors are listed as a thing to check.', hours: 'Open 10:00 to 17:00 until 31 Oct, then 10:00 to 16:00 (from your brief).', cost: 'Prices: ' + UNV + ' Parking included with the farm ticket.', booking: UNV, web: '', phone: '', place: 'Staunton Farm, Havant', drive: UNV, parking: 'Included with the farm ticket.', fac: 'Café: ' + UNV },
  railway: { name: 'Hayling Seaside Railway and seafront', type: 'outing', what: 'Miniature railway on the seafront, plus the beach.', why: 'Trains and sea air for both kids.', hours: 'October timetable: ' + UNV, cost: UNV, booking: UNV, web: '', phone: '', place: 'Hayling Seaside Railway, Hayling Island', drive: UNV, parking: UNV, fac: 'Mad Hatters Tea Room is a nearby option. ' + UNV },
  donkeys: { name: 'Hayling Island Donkey Sanctuary', type: 'outing', what: 'Donkey sanctuary on Hayling.', why: 'Animals for the 4 year old.', hours: 'October opening: ' + UNV, cost: UNV, booking: UNV, web: '', phone: '', place: 'Hayling Island Donkey Sanctuary, Hayling Island', drive: UNV, parking: UNV, fac: UNV },
  beach: { name: 'Beach walk', type: 'outing', what: 'Hayling seafront beach.', why: 'Free and flexible if the weather is kind.', hours: 'Open air. Sunset about 16:50.', cost: 'Free.', booking: 'None.', web: '', phone: '', place: 'Hayling Island seafront', drive: UNV, parking: UNV, fac: UNV },
  'blue-reef': { name: 'Blue Reef Aquarium, Southsea', type: 'outing', what: 'Indoor aquarium.', why: 'Rain swap with animals.', hours: UNV, cost: UNV, booking: UNV, web: '', phone: '', place: 'Blue Reef Aquarium, Southsea', drive: UNV, parking: UNV, fac: UNV },
  marwell: { name: 'Marwell Zoo: Wild Autumn', type: 'outing', what: 'Wild Autumn event, 24 Oct to 1 Nov.', why: 'Wednesday option on the route home. Animals for the 4 year old.', hours: UNV, cost: 'Tickets from £25 (from your brief).', booking: UNV, web: '', phone: '', place: 'Marwell Zoo, Winchester', drive: UNV, parking: UNV, fac: UNV },
  waterside: { name: 'Waterside at Langstone Quays', type: 'food', what: 'Harbourside restaurant with British classics. Tuesday dinner shortlist, first place.', why: 'Very close to the park, so a short drive after the swim. Children\'s menu listed.', hours: 'Evening times: ' + UNV, cost: UNV, booking: 'Book online via the resort page. Ask for a 17:00 sitting.', web: 'https://lqresorts.co.uk/langstone-quays/dining/waterside/', phone: '', place: 'Langstone Quays Resort, Langstone, Havant', drive: 'About 0.4 miles (from your brief).', parking: UNV, fac: 'High chairs: ' + UNV },
  'ship-itchenor': { name: 'The Ship Inn, Itchenor', type: 'food', what: 'Waterside pub. Tuesday dinner shortlist, second place.', why: 'Families welcome. No formal kids\' menu found.', hours: UNV, cost: UNV, booking: 'Ring to book.', web: '', phone: '01243 512284', place: 'The Ship Inn, Itchenor', drive: UNV, parking: UNV, fac: 'High chairs: ' + UNV },
  'anchor-bleu': { name: 'The Anchor Bleu, Bosham', type: 'food', what: 'Harbourside pub. Tuesday dinner shortlist, third place.', why: 'Tagged family friendly.', hours: 'Opens 17:00 on Tuesday (CAMRA listing).', cost: UNV, booking: 'Ring to book.', web: '', phone: '01243 573956', place: 'The Anchor Bleu, High Street, Bosham PO18 8LS', drive: UNV, parking: 'Check tide and parking. The rear patio floods at high tide.', fac: UNV }
};

export const ESSENTIALS = [
  { h: 'Park', t: 'Mill Rythe Guest Services 02392 460044 (9am to 5pm). General Away Resorts line 0330 053 7000.' },
  { h: 'Nearest A&E', t: 'Probably Queen Alexandra Hospital, Cosham. ' + UNV },
  { h: 'Minor injuries unit', t: UNV },
  { h: 'Pharmacy on Hayling', t: UNV },
  { h: 'Supermarket and petrol', t: UNV },
  { h: 'Clock change', t: 'Clocks go back at 02:00 on Sunday 25 October. Sunset is about 16:50 from Sunday.' },
  { h: 'Pool rules', t: 'Under 5s need 1:1 at activities. In the pool, 0 to 3 year olds are 1:1 in the water and max two 4 to 7 year olds per adult. Both adults swim.' },
  { h: 'Closed in October', t: 'Outdoor splash zone and fishing lake.' },
  { h: 'Booking', t: 'Activities book up to 21 days ahead and at least 30 minutes before the slot.' },
  { h: 'Bedtime', t: '19:30. Head back to the lodge straight after the shows.' }
];

// Seed data (written to Firestore once). Ids are fixed so a double seed is harmless.
export const SEED = {
  shopping: [
    ['Milk', 'Dairy'], ['Butter', 'Dairy'], ['Cheese', 'Dairy'], ['Yoghurts', 'Dairy'], ['Eggs', 'Dairy'],
    ['Bread', 'Bakery'], ['French stick', 'Bakery'], ['Cereal', 'Cupboard'], ['Porridge oats', 'Cupboard'], ['Pasta', 'Cupboard'], ['Pasta sauce', 'Cupboard'], ['Tea and coffee', 'Cupboard'], ['Squash', 'Drinks'],
    ['Bananas', 'Fruit and veg'], ['Apples', 'Fruit and veg'], ['Cucumber and carrot sticks', 'Fruit and veg'], ['Salad bits', 'Fruit and veg'],
    ['Ham', 'Meat and fish'], ['Salmon fillets (Sunday supper)', 'Meat and fish'],
    ['Nappies and wipes', 'Baby'], ['Toddler snacks', 'Baby'], ['Washing up liquid and sponge', 'Household'], ['Bin bags', 'Household'], ['Kitchen roll', 'Household']
  ].map(([name, aisle], i) => ({ id: 's' + i, name, aisle, done: false, order: i })),
  packing: [
    ['Coats and waterproofs for four', 'Storm-proof travel'], ['Wellies', 'Storm-proof travel'], ['Spare clothes in the car', 'Storm-proof travel'], ['Towels for the car', 'Storm-proof travel'],
    ['Swim kit for four', 'Swim'], ['Swim nappies', 'Swim'], ['Goggles and floats', 'Swim'], ['Towels', 'Swim'],
    ['Halloween costumes', 'Halloween'], ['Halloween bags', 'Halloween'],
    ['Cot and sheets', 'Toddler sleep'], ['Sleeping bag or blanket', 'Toddler sleep'], ['Night light and comforter', 'Toddler sleep'], ['Pushchair and rain cover', 'Toddler sleep'],
    ['Car snacks', 'Car'], ['Drinks and beakers', 'Car'], ['Tablet or story CDs', 'Car'], ['Sick bags', 'Car'],
    ['Phone chargers', 'Other'], ['Booking confirmation email', 'Other']
  ].map(([name, group], i) => ({ id: 'p' + i, name, group, done: false, order: i })),
  bookings: [
    { id: 'b0', name: 'Swim', day: 'sun', time: '09:00', bookBy: '', booked: true, notes: 'Arrive 08:40.' },
    { id: 'b1', name: 'Swim', day: 'mon', time: '12:00', bookBy: '', booked: true, notes: 'Arrive 11:40.' },
    { id: 'b2', name: 'Swim', day: 'tue', time: '14:30', bookBy: '', booked: true, notes: 'Arrive 14:10.' },
    { id: 'b3', name: 'Sunday lunch at The Ropemaker', day: 'sun', time: '11:45', bookBy: 'Today', booked: false, notes: 'Ring 01243 373363.' },
    { id: 'b4', name: 'Green Room table', day: 'sat', time: '17:00', bookBy: 'Today', booked: false, notes: 'Ask Guest Services 02392 460044.' },
    { id: 'b5', name: 'Green Room table', day: 'mon', time: '17:00', bookBy: 'Today', booked: false, notes: 'Ask Guest Services 02392 460044.' },
    { id: 'b6', name: 'Tuesday dinner (Waterside first choice)', day: 'tue', time: '17:00', bookBy: 'Today', booked: false, notes: 'See Book now list.' },
    { id: 'b7', name: 'Craft session', day: 'mon', time: '10:15', bookBy: 'Today', booked: false, notes: 'Booking site or Away Resorts app.' },
    { id: 'b8', name: 'Supermarket click and collect', day: 'sat', time: '', bookBy: 'Today', booked: false, notes: 'On the route down.' }
  ].map((b, i) => ({ ...b, order: i })),
  items: [
    ['sat', '17:40', 'Bear in the Woods live show', 20, true], ['sat', '18:00', 'Nutty Noah (guest act)', 60, true],
    ['sun', '17:40', 'Playtots Showtime', 40, true], ['sun', '18:20', 'Bear in the Woods live show', 20, true],
    ['mon', '17:40', 'Bear in the Woods live show', 20, true], ['mon', '18:00', 'Live and Wild (guest act, your top pick)', 60, true],
    ['tue', '17:40', 'Playtots Showtime (repeat of Sunday)', 40, false], ['tue', '18:20', 'Bear in the Woods live show (repeat of Sunday)', 25, false]
  ].map(([day, time, name, dur, go], i) => ({ id: 'i' + i, day, time, name, dur, go, kind: 'show', place: 'The Green Room', booked: false, notes: '', order: i }))
};
