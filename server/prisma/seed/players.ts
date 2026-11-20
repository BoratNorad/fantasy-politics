/**
 * ════════════════════════════════════════════════════════════════════════════
 *  ⚠️  PLAYER SEED DATA — NEEDS VERIFICATION  ⚠️
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  Officeholders change constantly. This list was written from an AI model's
 *  training data (and partially web-checked), so some entries WILL be stale.
 *  Every player is seeded with `needsVerification = true`. Use the admin panel
 *  (/admin/players → filter "Needs verification") to confirm or fix each one,
 *  then untick the flag.
 *
 *  The seed only runs when the Player table is empty, so it never overwrites
 *  changes you make in the admin panel.
 *
 *  Tuple format:
 *    [country, position, name, officeTitle, tier, opts?]
 *  - tier 1–5 is a rough "draft value" guess used to set defaultRank
 *    (1 = first-round pick). Admin can edit ranks later.
 *  - opts.wiki overrides the English Wikipedia article title (defaults to name).
 *  - opts.status overrides the default ACTIVE status.
 *  - opts.note is shown to the admin as a verification hint.
 * ════════════════════════════════════════════════════════════════════════════
 */
import type { Position, PlayerStatus } from '@fp/shared';

export interface SeedOpts {
  wiki?: string;
  status?: PlayerStatus;
  note?: string;
}

export type SeedRow = [
  country: string,
  position: Position,
  name: string,
  officeTitle: string,
  tier: 1 | 2 | 3 | 4 | 5,
  opts?: SeedOpts,
];

const HOS: Position = 'HEAD_OF_STATE';
const FIN: Position = 'FINANCE';
const FOR: Position = 'FOREIGN';
const GOV: Position = 'GOVERNOR';
const MAY: Position = 'MAYOR';
const LEG: Position = 'LEGISLATIVE';
const OPP: Position = 'OPPOSITION';

export const SEED_PLAYERS: SeedRow[] = [
  // ── United States ──
  ['US', HOS, 'Donald Trump', 'President', 1],
  ['US', FIN, 'Scott Bessent', 'Secretary of the Treasury', 2],
  ['US', FIN, 'Kevin Warsh', 'Chair of the Federal Reserve', 2],
  ['US', FOR, 'Marco Rubio', 'Secretary of State', 1],
  ['US', LEG, 'Mike Johnson', 'Speaker of the House', 2, { status: 'LAME_DUCK', note: 'Democrats won the House in Nov 2026; loses speakership Jan 2027.' }],
  ['US', LEG, 'John Thune', 'Senate Majority Leader', 3, { status: 'LAME_DUCK', note: 'Democrats won the Senate in Nov 2026; becomes minority leader Jan 2027.' }],
  ['US', OPP, 'Hakeem Jeffries', 'House Minority Leader', 2, { note: 'Democrats won the House; expected to become Speaker Jan 2027.' }],
  ['US', OPP, 'Chuck Schumer', 'Senate Minority Leader', 3, { note: 'Democrats won the Senate; leadership contested by Chris Van Hollen (Nov 2026) — verify caucus vote.' }],
  ['US', GOV, 'Gavin Newsom', 'Governor of California', 2, { status: 'LAME_DUCK', note: 'Term-limited; Xavier Becerra elected Nov 2026, takes office Jan 2027.' }],
  ['US', GOV, 'Greg Abbott', 'Governor of Texas', 3, { status: 'LAME_DUCK', note: 'Lost Nov 2026 election to Gina Hinojosa; leaves office Jan 2027.' }],
  ['US', GOV, 'Ron DeSantis', 'Governor of Florida', 3, { status: 'LAME_DUCK', note: 'Term-limited; Byron Donalds elected Nov 2026, takes office Jan 2027.' }],
  ['US', GOV, 'Kathy Hochul', 'Governor of New York', 3],
  ['US', GOV, 'JB Pritzker', 'Governor of Illinois', 3],
  ['US', GOV, 'Josh Shapiro', 'Governor of Pennsylvania', 3],
  ['US', MAY, 'Zohran Mamdani', 'Mayor of New York City', 1],
  ['US', MAY, 'Karen Bass', 'Mayor of Los Angeles', 3, { status: 'LAME_DUCK', note: 'Lost Nov 2026 runoff to Nithya Raman, who takes office Dec 14, 2026.' }],
  ['US', MAY, 'Brandon Johnson', 'Mayor of Chicago', 3, { wiki: 'Brandon Johnson (politician)' }],

  // ── China ──
  ['CN', HOS, 'Xi Jinping', 'President / General Secretary', 1],
  ['CN', HOS, 'Li Qiang', 'Premier', 3],
  ['CN', FIN, 'Lan Fo\'an', 'Minister of Finance', 4],
  ['CN', FIN, 'Pan Gongsheng', 'Governor of the People\'s Bank of China', 3],
  ['CN', FOR, 'Wang Yi', 'Minister of Foreign Affairs', 2],
  ['CN', LEG, 'Zhao Leji', 'Chairman of the NPC Standing Committee', 4],
  ['CN', MAY, 'Zhu Zhongming', 'Acting Mayor of Shanghai', 5],
  ['CN', MAY, 'Yin Yong', 'Mayor of Beijing', 5],

  // ── Japan ──
  ['JP', HOS, 'Sanae Takaichi', 'Prime Minister', 2],
  ['JP', HOS, 'Naruhito', 'Emperor', 4],
  ['JP', FIN, 'Satsuki Katayama', 'Minister of Finance', 4],
  ['JP', FIN, 'Kazuo Ueda', 'Governor of the Bank of Japan', 3],
  ['JP', FOR, 'Toshimitsu Motegi', 'Minister for Foreign Affairs', 3],
  ['JP', OPP, 'Junya Ogawa', 'Leader of the Centrist Reform Alliance (largest opposition party)', 4, { note: 'CRA reportedly at risk of splitting — verify it remains the largest opposition party.' }],
  ['JP', GOV, 'Yuriko Koike', 'Governor of Tokyo', 3],

  // ── Germany ──
  ['DE', HOS, 'Friedrich Merz', 'Chancellor', 2],
  ['DE', HOS, 'Frank-Walter Steinmeier', 'President', 4],
  ['DE', FIN, 'Lars Klingbeil', 'Minister of Finance / Vice-Chancellor', 3],
  ['DE', FIN, 'Joachim Nagel', 'President of the Bundesbank', 4],
  ['DE', FOR, 'Johann Wadephul', 'Minister for Foreign Affairs', 3],
  ['DE', LEG, 'Julia Klöckner', 'President of the Bundestag', 4],
  ['DE', OPP, 'Alice Weidel', 'AfD co-leader (largest opposition party)', 2],
  ['DE', GOV, 'Markus Söder', 'Minister-President of Bavaria', 3],
  ['DE', GOV, 'Hendrik Wüst', 'Minister-President of North Rhine-Westphalia', 4],
  ['DE', MAY, 'Kai Wegner', 'Governing Mayor of Berlin', 4, { status: 'CARETAKER', note: 'Die Linke (Elif Eralp) won Sept 2026 election; coalition talks ongoing — replace once a new mayor is elected.' }],

  // ── India ──
  ['IN', HOS, 'Narendra Modi', 'Prime Minister', 1],
  ['IN', HOS, 'Droupadi Murmu', 'President', 4],
  ['IN', FIN, 'Nirmala Sitharaman', 'Minister of Finance', 3],
  ['IN', FIN, 'Sanjay Malhotra', 'Governor of the Reserve Bank of India', 4],
  ['IN', FOR, 'S. Jaishankar', 'Minister of External Affairs', 2],
  ['IN', LEG, 'Om Birla', 'Speaker of the Lok Sabha', 4],
  ['IN', OPP, 'Rahul Gandhi', 'Leader of the Opposition, Lok Sabha', 2],
  ['IN', GOV, 'Yogi Adityanath', 'Chief Minister of Uttar Pradesh', 2],
  ['IN', GOV, 'Devendra Fadnavis', 'Chief Minister of Maharashtra', 4],
  ['IN', GOV, 'Suvendu Adhikari', 'Chief Minister of West Bengal', 3],
  ['IN', GOV, 'Vijay', 'Chief Minister of Tamil Nadu', 3, { wiki: 'Vijay (actor)' }],

  // ── United Kingdom ──
  ['GB', HOS, 'Andy Burnham', 'Prime Minister', 1],
  ['GB', HOS, 'Charles III', 'King', 3],
  ['GB', FIN, 'John Healey', 'Chancellor of the Exchequer', 2],
  ['GB', FIN, 'Andrew Bailey', 'Governor of the Bank of England', 3, { wiki: 'Andrew Bailey (banker)' }],
  ['GB', FOR, 'Ed Miliband', 'Foreign Secretary', 3],
  ['GB', LEG, 'Lindsay Hoyle', 'Speaker of the House of Commons', 4],
  ['GB', OPP, 'Kemi Badenoch', 'Leader of the Opposition', 2],
  ['GB', OPP, 'Nigel Farage', 'Leader of Reform UK', 2],
  ['GB', GOV, 'John Swinney', 'First Minister of Scotland', 4],
  ['GB', MAY, 'Sadiq Khan', 'Mayor of London', 2],

  // ── France ──
  ['FR', HOS, 'Emmanuel Macron', 'President', 1, { status: 'LAME_DUCK', note: 'Term-limited; presidential election April 2027.' }],
  ['FR', HOS, 'Sébastien Lecornu', 'Prime Minister', 3],
  ['FR', FIN, 'Roland Lescure', 'Minister of the Economy and Finance', 4],
  ['FR', FOR, 'Jean-Noël Barrot', 'Minister for Europe and Foreign Affairs', 4],
  ['FR', LEG, 'Yaël Braun-Pivet', 'President of the National Assembly', 4],
  ['FR', OPP, 'Jordan Bardella', 'President of the National Rally', 2, { status: 'CAMPAIGNING' }],
  ['FR', OPP, 'Jean-Luc Mélenchon', 'Leader of La France Insoumise', 3],
  ['FR', MAY, 'Emmanuel Grégoire', 'Mayor of Paris', 4],

  // ── Italy ──
  ['IT', HOS, 'Giorgia Meloni', 'Prime Minister', 2],
  ['IT', HOS, 'Sergio Mattarella', 'President', 4],
  ['IT', FIN, 'Giancarlo Giorgetti', 'Minister of Economy and Finance', 4],
  ['IT', FIN, 'Fabio Panetta', 'Governor of the Bank of Italy', 5],
  ['IT', FOR, 'Antonio Tajani', 'Minister of Foreign Affairs', 3],
  ['IT', LEG, 'Ignazio La Russa', 'President of the Senate', 5],
  ['IT', OPP, 'Elly Schlein', 'Secretary of the Democratic Party', 3],
  ['IT', MAY, 'Roberto Gualtieri', 'Mayor of Rome', 4],

  // ── Canada ──
  ['CA', HOS, 'Mark Carney', 'Prime Minister', 2],
  ['CA', FIN, 'François-Philippe Champagne', 'Minister of Finance', 4],
  ['CA', FIN, 'Tiff Macklem', 'Governor of the Bank of Canada', 4],
  ['CA', FOR, 'Anita Anand', 'Minister of Foreign Affairs', 3],
  ['CA', LEG, 'Francis Scarpaleggia', 'Speaker of the House of Commons', 5],
  ['CA', OPP, 'Pierre Poilievre', 'Leader of the Opposition', 2],
  ['CA', GOV, 'Doug Ford', 'Premier of Ontario', 3],
  ['CA', GOV, 'Danielle Smith', 'Premier of Alberta', 3],
  ['CA', GOV, 'David Eby', 'Premier of British Columbia', 4],
  ['CA', MAY, 'Olivia Chow', 'Mayor of Toronto', 4],

  // ── Brazil ──
  ['BR', HOS, 'Luiz Inácio Lula da Silva', 'President', 1, { note: 'Re-elected Oct 25, 2026 (4th term from Jan 2027); Bolsonaro camp contesting result.' }],
  ['BR', FIN, 'Dario Durigan', 'Minister of Finance', 4],
  ['BR', FIN, 'Gabriel Galípolo', 'Governor of the Central Bank of Brazil', 4],
  ['BR', FOR, 'Mauro Vieira', 'Minister of Foreign Affairs', 4],
  ['BR', LEG, 'Hugo Motta', 'President of the Chamber of Deputies', 4],
  ['BR', LEG, 'Davi Alcolumbre', 'President of the Federal Senate', 5],
  ['BR', OPP, 'Flávio Bolsonaro', 'Senator, defeated 2026 presidential candidate', 3, { status: 'LAME_DUCK', note: 'Lost Oct 2026 runoff; Senate term ends Feb 2027.' }],
  ['BR', GOV, 'Tarcísio de Freitas', 'Governor of São Paulo', 3],
  ['BR', MAY, 'Ricardo Nunes', 'Mayor of São Paulo', 4],

  // ── Russia ──
  ['RU', HOS, 'Vladimir Putin', 'President', 1],
  ['RU', HOS, 'Mikhail Mishustin', 'Prime Minister', 4],
  ['RU', FIN, 'Anton Siluanov', 'Minister of Finance', 4],
  ['RU', FIN, 'Elvira Nabiullina', 'Governor of the Central Bank of Russia', 3],
  ['RU', FOR, 'Sergey Lavrov', 'Minister of Foreign Affairs', 2],
  ['RU', LEG, 'Vyacheslav Volodin', 'Chairman of the State Duma', 4],
  ['RU', OPP, 'Yulia Navalnaya', 'Opposition leader (in exile)', 3],
  ['RU', MAY, 'Sergey Sobyanin', 'Mayor of Moscow', 4],

  // ── South Korea ──
  ['KR', HOS, 'Lee Jae-myung', 'President', 2],
  ['KR', HOS, 'Han Seong-sook', 'Prime Minister', 4],
  ['KR', FIN, 'Lee Hyoung-il', 'Deputy Prime Minister and Minister of Economy and Finance', 5],
  ['KR', FOR, 'Cho Hyun', 'Minister of Foreign Affairs', 4],
  ['KR', LEG, 'Cho Jeong-sik', 'Speaker of the National Assembly', 4],
  ['KR', OPP, 'Jang Dong-hyuk', 'Leader of the People Power Party', 4],
  ['KR', MAY, 'Oh Se-hoon', 'Mayor of Seoul', 4],

  // ── Australia ──
  ['AU', HOS, 'Anthony Albanese', 'Prime Minister', 2],
  ['AU', FIN, 'Jim Chalmers', 'Treasurer', 4],
  ['AU', FIN, 'Michele Bullock', 'Governor of the Reserve Bank of Australia', 4],
  ['AU', FOR, 'Penny Wong', 'Minister for Foreign Affairs', 3],
  ['AU', LEG, 'Milton Dick', 'Speaker of the House of Representatives', 5],
  ['AU', OPP, 'Angus Taylor', 'Leader of the Opposition', 3, { wiki: 'Angus Taylor (politician)' }],
  ['AU', GOV, 'Chris Minns', 'Premier of New South Wales', 4],
  ['AU', GOV, 'Ben Carroll', 'Premier of Victoria', 4, { status: 'CAMPAIGNING', note: 'Victorian state election 28 Nov 2026.' }],

  // ── Mexico ──
  ['MX', HOS, 'Claudia Sheinbaum', 'President', 2],
  ['MX', FIN, 'Édgar Amador Zamora', 'Secretary of Finance', 5],
  ['MX', FIN, 'Victoria Rodríguez Ceja', 'Governor of the Bank of Mexico', 5],
  ['MX', FOR, 'Roberto Velasco Álvarez', 'Secretary of Foreign Affairs', 4],
  ['MX', OPP, 'Jorge Romero Herrera', 'President of the National Action Party (PAN)', 5],
  ['MX', MAY, 'Clara Brugada', 'Head of Government of Mexico City', 4],

  // ── Indonesia ──
  ['ID', HOS, 'Prabowo Subianto', 'President', 2],
  ['ID', FIN, 'Suahasil Nazara', 'Minister of Finance', 4],
  ['ID', FIN, 'Perry Warjiyo', 'Governor of Bank Indonesia', 5],
  ['ID', FOR, 'Arrmanatha Nasir', 'Minister of Foreign Affairs', 4],
  ['ID', LEG, 'Puan Maharani', 'Speaker of the House of Representatives', 4],
  ['ID', GOV, 'Pramono Anung', 'Governor of Jakarta', 4],

  // ── Turkey ──
  ['TR', HOS, 'Recep Tayyip Erdoğan', 'President', 1],
  ['TR', FIN, 'Mehmet Şimşek', 'Minister of Treasury and Finance', 4],
  ['TR', FIN, 'Fatih Karahan', 'Governor of the Central Bank of Turkey', 5],
  ['TR', FOR, 'Hakan Fidan', 'Minister of Foreign Affairs', 3],
  ['TR', LEG, 'Numan Kurtulmuş', 'Speaker of the Grand National Assembly', 5],
  ['TR', OPP, 'Özgür Özel', 'Leader of the New Party (ex-CHP chair)', 3, { note: 'Court ousted him as CHP chair (May 2026, Kılıçdaroğlu reinstated); founded a new party July 2026 — verify its name/status.' }],
  ['TR', MAY, 'Mansur Yavaş', 'Mayor of Ankara', 4],

  // ── Saudi Arabia ──
  ['SA', HOS, 'Mohammed bin Salman', 'Crown Prince and Prime Minister', 2],
  ['SA', HOS, 'Salman of Saudi Arabia', 'King', 4],
  ['SA', FIN, 'Mohammed Al-Jadaan', 'Minister of Finance', 5],
  ['SA', FOR, 'Faisal bin Farhan Al Saud', 'Minister of Foreign Affairs', 3],

  // ── Argentina ──
  ['AR', HOS, 'Javier Milei', 'President', 1],
  ['AR', FIN, 'Luis Caputo', 'Minister of Economy', 3, { wiki: 'Luis Caputo (economist)' }],
  ['AR', FIN, 'Santiago Bausili', 'President of the Central Bank of Argentina', 5],
  ['AR', FOR, 'Pablo Quirno', 'Minister of Foreign Affairs', 5],
  ['AR', LEG, 'Martín Menem', 'President of the Chamber of Deputies', 5],
  ['AR', GOV, 'Axel Kicillof', 'Governor of Buenos Aires Province', 3],
  ['AR', MAY, 'Jorge Macri', 'Head of Government of Buenos Aires', 5],

  // ── South Africa ──
  ['ZA', HOS, 'Cyril Ramaphosa', 'President', 2],
  ['ZA', FIN, 'Enoch Godongwana', 'Minister of Finance', 5],
  ['ZA', FIN, 'Lesetja Kganyago', 'Governor of the South African Reserve Bank', 5],
  ['ZA', FOR, 'Ronald Lamola', 'Minister of International Relations', 5],
  ['ZA', LEG, 'Thoko Didiza', 'Speaker of the National Assembly', 5],
  ['ZA', OPP, 'Julius Malema', 'Leader of the Economic Freedom Fighters', 3],
  ['ZA', GOV, 'Panyaza Lesufi', 'Premier of Gauteng', 5],
  ['ZA', MAY, 'Geordin Hill-Lewis', 'Mayor of Cape Town and DA federal leader', 3],

  // ── European Union ──
  ['EU', HOS, 'Ursula von der Leyen', 'President of the European Commission', 2],
  ['EU', HOS, 'António Costa', 'President of the European Council', 3],
  ['EU', FIN, 'Christine Lagarde', 'President of the European Central Bank', 2, { status: 'LAME_DUCK', note: 'Stepping down 7 Feb 2027; successor not yet named.' }],
  ['EU', FOR, 'Kaja Kallas', 'High Representative for Foreign Affairs', 3],
  ['EU', LEG, 'Roberta Metsola', 'President of the European Parliament', 3, { note: 'Mid-term handover expected early 2027.' }],

  // ── Ukraine ──
  ['UA', HOS, 'Volodymyr Zelenskyy', 'President', 1],
  ['UA', HOS, 'Serhii Koretskyi', 'Prime Minister', 4],
  ['UA', FIN, 'Serhiy Marchenko', 'Minister of Finance', 5],
  ['UA', FOR, 'Andrii Sybiha', 'Minister of Foreign Affairs', 3],
  ['UA', LEG, 'Ruslan Stefanchuk', 'Chairman of the Verkhovna Rada', 5],
  ['UA', OPP, 'Petro Poroshenko', 'Leader of European Solidarity', 4],
  ['UA', MAY, 'Vitali Klitschko', 'Mayor of Kyiv', 3],

  // ── Israel ──
  ['IL', HOS, 'Benjamin Netanyahu', 'Prime Minister', 1, { status: 'CARETAKER', note: 'Oct 2026 election hung; Eisenkot has until Dec 6 to form a government.' }],
  ['IL', HOS, 'Isaac Herzog', 'President', 4],
  ['IL', FIN, 'Bezalel Smotrich', 'Minister of Finance', 3, { status: 'CARETAKER' }],
  ['IL', FOR, 'Gideon Sa\'ar', 'Minister of Foreign Affairs', 3, { status: 'CARETAKER' }],
  ['IL', LEG, 'Matan Kahana', 'Speaker of the Knesset', 5],
  ['IL', OPP, 'Gadi Eisenkot', 'Leader of Yashar; prime minister-designate', 2],
  ['IL', OPP, 'Naftali Bennett', 'Leader of Together', 3],
  ['IL', MAY, 'Ron Huldai', 'Mayor of Tel Aviv', 5],

  // ── Iran ──
  ['IR', HOS, 'Mojtaba Khamenei', 'Supreme Leader', 2],
  ['IR', HOS, 'Masoud Pezeshkian', 'President', 3],
  ['IR', FOR, 'Abbas Araghchi', 'Minister of Foreign Affairs', 3],
  ['IR', LEG, 'Mohammad Bagher Ghalibaf', 'Speaker of Parliament', 4],

  // ── Poland ──
  ['PL', HOS, 'Donald Tusk', 'Prime Minister', 2],
  ['PL', HOS, 'Karol Nawrocki', 'President', 3],
  ['PL', FIN, 'Andrzej Domański', 'Minister of Finance', 5],
  ['PL', FIN, 'Adam Glapiński', 'President of the National Bank of Poland', 5],
  ['PL', FOR, 'Radosław Sikorski', 'Minister of Foreign Affairs', 3],
  ['PL', LEG, 'Włodzimierz Czarzasty', 'Marshal of the Sejm', 5],
  ['PL', OPP, 'Jarosław Kaczyński', 'Leader of Law and Justice (PiS)', 3],
  ['PL', MAY, 'Rafał Trzaskowski', 'Mayor of Warsaw', 4],

  // ── Spain ──
  ['ES', HOS, 'Pedro Sánchez', 'Prime Minister', 2, { status: 'CAMPAIGNING', note: 'Snap general election 29 Nov 2026.' }],
  ['ES', HOS, 'Felipe VI', 'King', 4],
  ['ES', FIN, 'Carlos Cuerpo', 'First Deputy Prime Minister and Minister of Economy', 5],
  ['ES', FOR, 'José Manuel Albares', 'Minister of Foreign Affairs', 4],
  ['ES', LEG, 'Francina Armengol', 'President of the Congress of Deputies', 5],
  ['ES', OPP, 'Alberto Núñez Feijóo', 'Leader of the Opposition', 3, { status: 'CAMPAIGNING' }],
  ['ES', GOV, 'Isabel Díaz Ayuso', 'President of the Community of Madrid', 3],
  ['ES', MAY, 'José Luis Martínez-Almeida', 'Mayor of Madrid', 5],
  ['ES', MAY, 'Jaume Collboni', 'Mayor of Barcelona', 5],

  // ── Netherlands ──
  ['NL', HOS, 'Rob Jetten', 'Prime Minister', 3],
  ['NL', HOS, 'Willem-Alexander of the Netherlands', 'King', 5],
  ['NL', FIN, 'Eelco Heinen', 'Minister of Finance', 5],
  ['NL', FOR, 'Tom Berendsen', 'Minister of Foreign Affairs', 5],
  ['NL', OPP, 'Geert Wilders', 'Leader of the Party for Freedom (PVV)', 3],
  ['NL', MAY, 'Femke Halsema', 'Mayor of Amsterdam', 5],

  // ── Nigeria ──
  ['NG', HOS, 'Bola Tinubu', 'President', 2, { status: 'CAMPAIGNING', note: 'General election Feb 2027.' }],
  ['NG', FIN, 'Taiwo Oyedele', 'Minister of Finance and Coordinating Minister of the Economy', 5],
  ['NG', FIN, 'Olayemi Cardoso', 'Governor of the Central Bank of Nigeria', 5],
  ['NG', FOR, 'Bianca Odumegwu-Ojukwu', 'Minister of Foreign Affairs', 5],
  ['NG', LEG, 'Godswill Akpabio', 'President of the Senate', 4],
  ['NG', OPP, 'Atiku Abubakar', 'ADC presidential candidate', 3, { status: 'CAMPAIGNING' }],
  ['NG', OPP, 'Peter Obi', 'NDC presidential candidate', 3, { status: 'CAMPAIGNING' }],
  ['NG', GOV, 'Babajide Sanwo-Olu', 'Governor of Lagos State', 4],

  // ── Egypt ──
  ['EG', HOS, 'Abdel Fattah el-Sisi', 'President', 2],
  ['EG', HOS, 'Mostafa Madbouly', 'Prime Minister', 4],
  ['EG', FIN, 'Ahmed Kouchouk', 'Minister of Finance', 5],
  ['EG', FOR, 'Badr Abdelatty', 'Minister of Foreign Affairs', 4],

  // ── Pakistan ──
  ['PK', HOS, 'Shehbaz Sharif', 'Prime Minister', 2],
  ['PK', HOS, 'Asif Ali Zardari', 'President', 4],
  ['PK', FIN, 'Muhammad Aurangzeb', 'Minister of Finance', 5],
  ['PK', FOR, 'Ishaq Dar', 'Deputy Prime Minister and Foreign Minister', 4],
  ['PK', OPP, 'Imran Khan', 'Founder of PTI (imprisoned)', 2],
  ['PK', GOV, 'Maryam Nawaz', 'Chief Minister of Punjab', 3],

  // ── Philippines ──
  ['PH', HOS, 'Bongbong Marcos', 'President', 2],
  ['PH', FIN, 'Frederick Go', 'Secretary of Finance', 5],
  ['PH', FOR, 'Theresa Lazaro', 'Secretary of Foreign Affairs', 5],
  ['PH', LEG, 'Sherwin Gatchalian', 'President of the Senate', 4, { wiki: 'Win Gatchalian' }],
  ['PH', OPP, 'Sara Duterte', 'Vice President (opposition)', 3, { note: 'Senate impeachment trial ongoing (since July 2026) — check verdict.' }],

  // ── Vietnam ──
  ['VN', HOS, 'Tô Lâm', 'General Secretary and President', 3],
  ['VN', HOS, 'Lê Minh Hưng', 'Prime Minister', 5],

  // ── Taiwan ──
  ['TW', HOS, 'Lai Ching-te', 'President', 2],
  ['TW', HOS, 'Cho Jung-tai', 'Premier', 4],
  ['TW', FOR, 'Lin Chia-lung', 'Minister of Foreign Affairs', 4],
  ['TW', LEG, 'Han Kuo-yu', 'President of the Legislative Yuan', 4],
  ['TW', OPP, 'Cheng Li-wun', 'Chairwoman of the Kuomintang', 4],
  ['TW', MAY, 'Chiang Wan-an', 'Mayor of Taipei', 4, { status: 'CAMPAIGNING', note: 'Local elections Nov 2026.' }],
];
