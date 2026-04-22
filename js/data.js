/* ══════════════════════════════════════════════════════
   data.js — seed data, state, data helpers
   ══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   1. MOCK DATA
   ═══════════════════════════════════════════════════════════ */

const EQUIPMENT = [
  { id:'fl-001', name:'Forklift 1',         code:'FL-001',  type:'Forklift',    location:'Seremban Store', make:'Toyota',  model:'02-FDE35',  fuel:'Diesel', capacity:'3.5 ton', engine:'1DZ-II',        purchase:'2018-06-15', hours:4521, status:'warning',  img:null },
  { id:'fl-002', name:'Forklift 2',         code:'FL-002',  type:'Forklift',    location:'AATF 1',         make:'Toyota',  model:'02-FDE35',  fuel:'Diesel', capacity:'3.5 ton', engine:'1DZ-II',        purchase:'2019-03-10', hours:3820, status:'ok',       img:null },
  { id:'fl-003', name:'Forklift 3',         code:'FL-003',  type:'Forklift',    location:'AATF 1',         make:'Nissan',  model:'F04D45',    fuel:'Diesel', capacity:'4.5 ton', engine:'FD46T',         purchase:'2017-11-20', hours:6201, status:'breakdown',img:null },
  { id:'fl-004', name:'Forklift 4',         code:'FL-004',  type:'Forklift',    location:'HQ',             make:'Toyota',  model:'02-7FD15',  fuel:'Diesel', capacity:'1.5 ton', engine:'1FZ-E',         purchase:'2020-08-05', hours:2890, status:'overdue',  img:null },
  { id:'fl-005', name:'Forklift 5',         code:'FL-005',  type:'Forklift',    location:'AATF 2',         make:'Komatsu', model:'FD20-14',   fuel:'Diesel', capacity:'2.0 ton', engine:'4D94E',         purchase:'2021-02-14', hours:1540, status:'ok',       img:null },
  { id:'fl-006', name:'Forklift 6',         code:'FL-006',  type:'Forklift',    location:'HQ',             make:'Komatsu', model:'FD30-11',   fuel:'Diesel', capacity:'3.0 ton', engine:'4D94LE',        purchase:'2019-07-22', hours:3105, status:'ok',       img:null },
  { id:'mag-001',name:'Excavator 1',        code:'MAG-001', type:'Excavator',   location:'HQ',             make:'Kobelco', model:'SK200-8',   fuel:'Diesel', capacity:'20 ton',  engine:'Hino J05E',     purchase:'2019-03-15', hours:3284, status:'overdue',  img:null },
  { id:'mag-002',name:'Excavator 2',        code:'NIB-002', type:'Excavator',   location:'AATF 1',         make:'Sunward', model:'SWE210E',   fuel:'Diesel', capacity:'21 ton',  engine:'Yuchai YC6J',   purchase:'2022-01-08', hours:1820, status:'ok',       img:null },
  { id:'ssl-001',name:'Skid Steer Loader',  code:'SSL-001', type:'Skid Steer',  location:'HQ',             make:'TCM',     model:'FD45T3',    fuel:'Diesel', capacity:'4.5 ton', engine:'Nissan TD27',   purchase:'2018-09-30', hours:5102, status:'warning',  img:null },
];

const FUEL_LOGS = {
  'fl-001':  [1200,1350,1180,1420,1290,1310],
  'fl-002':  [980, 1100,1050,1080,990, 1020],
  'fl-003':  [1500,1620,1490,1700,1580,1550],
  'fl-004':  [820, 890, 840, 910, 870, 850],
  'fl-005':  [640, 710, 680, 730, 695, 720],
  'fl-006':  [1100,1180,1090,1250,1200,1160],
  'mag-001': [1850,2100,1950,2250,2000,2083],
  'mag-002': [1600,1750,1680,1820,1700,1730],
  'ssl-001': [900, 980, 920, 1050,990, 1010],
};

const FUEL_ENTRIES = [
  { id:'fe-001', equipId:'fl-001',  equipCode:'FL-001',  equipName:'Forklift 1',        date:'2026-04-15', litres:220, operatingHours:4510, pricePerLitre:2.85, totalCost:627,  refuelledBy:'Ahmad B.',  notes:'' },
  { id:'fe-002', equipId:'fl-001',  equipCode:'FL-001',  equipName:'Forklift 1',        date:'2026-03-20', litres:195, operatingHours:4380, pricePerLitre:2.80, totalCost:546,  refuelledBy:'Ahmad B.',  notes:'' },
  { id:'fe-003', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',       date:'2026-04-10', litres:410, operatingHours:3270, pricePerLitre:2.85, totalCost:1169, refuelledBy:'Rizal H.',  notes:'Tank full before long project.' },
  { id:'fe-004', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',       date:'2026-03-25', litres:380, operatingHours:3120, pricePerLitre:2.80, totalCost:1064, refuelledBy:'Rizal H.',  notes:'' },
  { id:'fe-005', equipId:'fl-003',  equipCode:'FL-003',  equipName:'Forklift 3',        date:'2026-04-18', litres:260, operatingHours:6185, pricePerLitre:2.85, totalCost:741,  refuelledBy:'Hafiz M.',  notes:'' },
  { id:'fe-006', equipId:'ssl-001', equipCode:'SSL-001', equipName:'Skid Steer Loader', date:'2026-04-05', litres:175, operatingHours:5090, pricePerLitre:2.85, totalCost:499,  refuelledBy:'Hafiz M.',  notes:'' },
];

const MONTHS = ['Nov','Dec','Jan','Feb','Mar','Apr'];

const JOBS = [
  { id:'job-001', equipId:'mag-001', equipName:'Excavator 1',       equipCode:'MAG-001', type:'Major Service',  basis:'hour', dueHours:3000,  currentHours:3284, dueDate:null,         status:'overdue',    priority:'high',   location:'HQ',             started:'2026-04-20', checklistId:'exc-major',  estCost:2400 },
  { id:'job-002', equipId:'fl-004',  equipName:'Forklift 4',         equipCode:'FL-004',  type:'Minor Service',  basis:'time', dueHours:null,  currentHours:2890, dueDate:'2026-04-18', status:'overdue',    priority:'high',   location:'HQ',             started:'2026-04-20', checklistId:'fl-minor',   estCost:485  },
  { id:'job-003', equipId:'fl-001',  equipName:'Forklift 1',         equipCode:'FL-001',  type:'Minor Service',  basis:'time', dueHours:null,  currentHours:4521, dueDate:'2026-04-23', status:'upcoming',   priority:'medium', location:'Seremban Store', started:null,          checklistId:'fl-minor',   estCost:485  },
  { id:'job-004', equipId:'fl-003',  equipName:'Forklift 3',         equipCode:'FL-003',  type:'Weekly Check',   basis:'time', dueHours:null,  currentHours:6201, dueDate:'2026-04-25', status:'upcoming',   priority:'low',    location:'AATF 1',         started:null,          checklistId:'fl-weekly',  estCost:150  },
  { id:'job-005', equipId:'ssl-001', equipName:'Skid Steer Loader',  equipCode:'SSL-001', type:'Minor Service',  basis:'hour', dueHours:5250,  currentHours:5102, dueDate:null,         status:'upcoming',   priority:'medium', location:'HQ',             started:null,          checklistId:'ssl-minor',  estCost:620  },
  { id:'job-006', equipId:'fl-006',  equipName:'Forklift 6',         equipCode:'FL-006',  type:'Major Service',  basis:'hour', dueHours:3500,  currentHours:3105, dueDate:null,         status:'upcoming',   priority:'low',    location:'HQ',             started:null,          checklistId:'fl-major',   estCost:1800 },
  { id:'job-007', equipId:'fl-002',  equipName:'Forklift 2',         equipCode:'FL-002',  type:'Pre-use Check',  basis:'time', dueHours:null,  currentHours:3820, dueDate:'2026-04-21', status:'inprogress', priority:'medium', location:'AATF 1',         started:'2026-04-21', checklistId:'fl-preuse',  estCost:80   },
];

const HISTORY = [
  { id:'h01', equipId:'fl-004',  equipCode:'FL-004',  equipName:'Forklift 4',        type:'Minor Service',  date:'2026-03-18', duration:'2h 15m', cost:485,  parts:3, tech:'Ahmad B.', status:'completed' },
  { id:'h02', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',       type:'Minor Service',  date:'2026-03-10', duration:'3h 00m', cost:980,  parts:4, tech:'Rizal H.',  status:'completed' },
  { id:'h03', equipId:'fl-001',  equipCode:'FL-001',  equipName:'Forklift 1',        type:'Minor Service',  date:'2026-03-08', duration:'2h 00m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
  { id:'h04', equipId:'fl-003',  equipCode:'FL-003',  equipName:'Forklift 3',        type:'Weekly Check',   date:'2026-03-04', duration:'1h 00m', cost:150,  parts:1, tech:'Hafiz M.',  status:'completed' },
  { id:'h05', equipId:'fl-006',  equipCode:'FL-006',  equipName:'Forklift 6',        type:'Pre-use Check',  date:'2026-02-28', duration:'0h 45m', cost:80,   parts:0, tech:'Hafiz M.',  status:'completed' },
  { id:'h06', equipId:'ssl-001', equipCode:'SSL-001', equipName:'Skid Steer Loader', type:'Minor Service',  date:'2026-02-20', duration:'2h 30m', cost:620,  parts:4, tech:'Rizal H.',  status:'completed' },
  { id:'h07', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',       type:'Minor Service',  date:'2026-02-15', duration:'3h 30m', cost:980,  parts:4, tech:'Rizal H.',  status:'completed' },
  { id:'h08', equipId:'fl-002',  equipCode:'FL-002',  equipName:'Forklift 2',        type:'Minor Service',  date:'2026-02-10', duration:'2h 00m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
  { id:'h09', equipId:'fl-005',  equipCode:'FL-005',  equipName:'Forklift 5',        type:'Weekly Check',   date:'2026-02-05', duration:'1h 00m', cost:150,  parts:1, tech:'Hafiz M.',  status:'completed' },
  { id:'h10', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',       type:'Major Service',  date:'2026-01-20', duration:'6h 00m', cost:2400, parts:9, tech:'Rizal H.',  status:'completed' },
  { id:'h11', equipId:'fl-004',  equipCode:'FL-004',  equipName:'Forklift 4',        type:'Minor Service',  date:'2026-01-18', duration:'2h 15m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
  { id:'h12', equipId:'fl-001',  equipCode:'FL-001',  equipName:'Forklift 1',        type:'Minor Service',  date:'2026-01-08', duration:'2h 00m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
  { id:'h13', equipId:'ssl-001', equipCode:'SSL-001', equipName:'Skid Steer Loader', type:'Major Service',  date:'2025-12-10', duration:'5h 00m', cost:1950, parts:8, tech:'Rizal H.',  status:'completed' },
  { id:'h14', equipId:'fl-003',  equipCode:'FL-003',  equipName:'Forklift 3',        type:'Minor Service',  date:'2025-12-05', duration:'2h 00m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
  { id:'h15', equipId:'fl-006',  equipCode:'FL-006',  equipName:'Forklift 6',        type:'Minor Service',  date:'2025-11-28', duration:'2h 00m', cost:485,  parts:3, tech:'Ahmad B.',  status:'completed' },
];

const PARTS = [
  { id:'p01', name:'Engine Oil Filter',       code:'T-1637',     cat:'Filter',        stock:8,  minStock:3, unit:'pcs', price:45  },
  { id:'p02', name:'Air Filter',              code:'AFI-17654P', cat:'Filter',        stock:0,  minStock:2, unit:'pcs', price:68  },
  { id:'p03', name:'Hydraulic Filter',        code:'H-8523',     cat:'Filter',        stock:2,  minStock:3, unit:'pcs', price:125 },
  { id:'p04', name:'Diesel Filter',           code:'FC-55240',   cat:'Filter',        stock:5,  minStock:2, unit:'pcs', price:55  },
  { id:'p05', name:'Excavator Hyd. Filter',   code:'H-5803',     cat:'Filter',        stock:1,  minStock:2, unit:'pcs', price:185 },
  { id:'p06', name:'Engine Oil 10W-40',       code:'OIL-10W40',  cat:'Lubricant',     stock:24, minStock:6, unit:'L',   price:18  },
  { id:'p07', name:'Hydraulic Oil 46',        code:'HYD-46',     cat:'Lubricant',     stock:60, minStock:20,unit:'L',   price:12  },
  { id:'p08', name:'Grease Cartridge',        code:'GR-NLGI2',   cat:'Lubricant',     stock:15, minStock:5, unit:'pcs', price:22  },
  { id:'p09', name:'Fan Belt (Forklift)',     code:'FB-1640',    cat:'Drive',         stock:4,  minStock:2, unit:'pcs', price:95  },
  { id:'p10', name:'Battery 12V 80Ah',        code:'BAT-12V80',  cat:'Electrical',    stock:2,  minStock:2, unit:'pcs', price:420 },
  { id:'p11', name:'Spark Plug (set 4)',      code:'SP-NGK4',    cat:'Electrical',    stock:3,  minStock:1, unit:'set', price:80  },
  { id:'p12', name:'Brake Pad Set',           code:'BP-FK35',    cat:'Brake',         stock:6,  minStock:2, unit:'set', price:145 },
  { id:'p13', name:'Radiator Coolant 50/50',  code:'COOL-5050',  cat:'Coolant',       stock:30, minStock:10,unit:'L',   price:9   },
  { id:'p14', name:'Tire 7.00-15 (Forklift)', code:'TIRE-700-15',cat:'Tire',          stock:4,  minStock:4, unit:'pcs', price:580 },
  { id:'p15', name:'Track Roller (Excavator)',code:'TR-SK200',   cat:'Undercarriage', stock:0,  minStock:2, unit:'pcs', price:920 },
];

// Parts-per-equipment (admin manages from equipment profile)
const EQUIPMENT_PARTS_SEED = {
  'fl-001': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'fl-002': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'fl-003': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'fl-004': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'fl-005': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'fl-006': [{partId:'p01',qty:1},{partId:'p02',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:6},{partId:'p09',qty:1},{partId:'p10',qty:1},{partId:'p12',qty:1},{partId:'p14',qty:4}],
  'mag-001':[{partId:'p03',qty:1},{partId:'p04',qty:1},{partId:'p05',qty:1},{partId:'p07',qty:20},{partId:'p08',qty:2},{partId:'p10',qty:1},{partId:'p13',qty:10},{partId:'p15',qty:1}],
  'mag-002':[{partId:'p03',qty:1},{partId:'p04',qty:1},{partId:'p05',qty:1},{partId:'p07',qty:20},{partId:'p08',qty:2},{partId:'p10',qty:1},{partId:'p13',qty:10}],
  'ssl-001':[{partId:'p01',qty:1},{partId:'p03',qty:1},{partId:'p04',qty:1},{partId:'p06',qty:5},{partId:'p07',qty:8},{partId:'p08',qty:2},{partId:'p10',qty:1},{partId:'p13',qty:10}],
};
EQUIPMENT.forEach(e => { e.parts = (EQUIPMENT_PARTS_SEED[e.id] || []).map(x => ({...x})); });

// Parts this specific job needs (admin picks at schedule time from equipment's parts)
const JOB_REQ_PARTS_SEED = {
  'job-001': ['p03','p04','p05','p07','p08','p13'],   // mag-001 Major — p03 low, p05 low → warning
  'job-002': ['p01','p04','p06'],                      // fl-004 Minor — ok
  'job-003': ['p01','p04','p06'],                      // fl-001 Minor — ok
  'job-004': [],                                       // fl-003 Weekly — no parts
  'job-005': ['p01','p03','p04','p06','p07'],          // ssl-001 Minor — p03 low → warning
  'job-006': ['p01','p02','p04','p06','p09','p12'],    // fl-006 Major — p02 out → blocked
  'job-007': [],                                       // fl-002 Pre-use — no parts
};
JOBS.forEach(j => {
  j.requiredPartIds = [...(JOB_REQ_PARTS_SEED[j.id] || [])];
  if (!j.entityType) j.entityType = 'equipment';
  if (!j.entityId)   j.entityId   = j.equipId;
});
// Also backfill HISTORY entries for entity typing
HISTORY.forEach(h => {
  if (!h.entityType) h.entityType = 'equipment';
  if (!h.entityId)   h.entityId   = h.equipId;
});

// Helpers
function equipParts(equipId) {
  const e = EQUIPMENT.find(x => x.id === equipId);
  if (!e || !e.parts) return [];
  return e.parts.map(ep => {
    const part = PARTS.find(p => p.id === ep.partId);
    return part ? { ...ep, part } : null;
  }).filter(Boolean);
}

function partUsedBy(partId) {
  return EQUIPMENT.filter(e => e.parts && e.parts.some(ep => ep.partId === partId));
}

function jobRequiredParts(job) {
  if (!job.requiredPartIds || job.requiredPartIds.length === 0) return [];
  const eqParts = equipParts(job.equipId);
  return job.requiredPartIds.map(pid => {
    const ep = eqParts.find(x => x.partId === pid);
    if (!ep) return null;
    const part = ep.part;
    let status = 'ok';
    if (part.stock === 0)              status = 'out';
    else if (part.stock < ep.qty)      status = 'insufficient';
    else if (part.stock <= part.minStock) status = 'low';
    return { partId: pid, qty: ep.qty, part, status };
  }).filter(Boolean);
}

function jobPartsSummary(job) {
  const parts = jobRequiredParts(job);
  const blocked = parts.filter(p => p.status === 'out' || p.status === 'insufficient').length;
  const low     = parts.filter(p => p.status === 'low').length;
  return { parts, blocked, low, total: parts.length };
}

const BREAKDOWNS = [
  { id:'bd-001', equipId:'fl-003',  equipCode:'FL-003',  equipName:'Forklift 3',   date:'2026-04-21', time:'08:45', reportedBy:'Hafiz M.',   description:'Hydraulic cylinder leaking oil on left side. Oil dripping onto floor. Equipment unable to lift load safely.',        severity:'high',     status:'active',   resolvedDate:null,        resolvedBy:null,      resolutionNotes:null },
  { id:'bd-002', equipId:'fl-004',  equipCode:'FL-004',  equipName:'Forklift 4',   date:'2026-03-15', time:'14:30', reportedBy:'Ahmad B.',    description:'Engine overheating. Temperature warning light on. Smoke from exhaust pipe during operation.',                        severity:'high',     status:'resolved', resolvedDate:'2026-03-17', resolvedBy:'Rizal H.', resolutionNotes:'Replaced cracked coolant hose and thermostat. Flushed cooling system.' },
  { id:'bd-003', equipId:'mag-001', equipCode:'MAG-001', equipName:'Excavator 1',  date:'2026-02-08', time:'11:00', reportedBy:'Rizal H.',    description:'Unusual grinding noise from swing motor. Getting louder during rotation.',                                             severity:'low',      status:'resolved', resolvedDate:'2026-02-09', resolvedBy:'Rizal H.', resolutionNotes:'Tightened loose mounting bolts on swing motor bracket. Noise resolved.' },
];

// PM Templates — maintenance checklists, admin-managed via PM Templates page
const TEMPLATES = [
  { id:'fl-minor',  name:'Forklift · Minor Service',        equipmentType:'Forklift',   serviceType:'Minor Service',  status:'active',
    items: [
      { id:'c1', bm:'Tukar minyak enjin', en:'Change engine oil' },
      { id:'c2', bm:'Bersihkan atau ganti filter udara', en:'Clean or replace air filter' },
      { id:'c3', bm:'Periksa dan tambah minyak hidraulik', en:'Check and top up hydraulic oil' },
      { id:'c4', bm:'Periksa ketegangan tali kipas', en:'Check fan belt tension' },
      { id:'c5', bm:'Periksa dan laras brek', en:'Check and adjust brakes' },
      { id:'c6', bm:'Periksa dan bersihkan terminal bateri', en:'Check and clean battery terminals' },
      { id:'c7', bm:'Periksa pendawaian dan sambungan elektrik', en:'Check wiring and electrical connections' },
    ]
  },
  { id:'fl-major',  name:'Forklift · Major Service',        equipmentType:'Forklift',   serviceType:'Major Service',  status:'active',
    items: [
      { id:'m1', bm:'Tukar minyak enjin dan penapis', en:'Change engine oil and filter' },
      { id:'m2', bm:'Tukar penapis udara', en:'Replace air filter' },
      { id:'m3', bm:'Tukar penapis bahan api', en:'Replace fuel filter' },
      { id:'m4', bm:'Periksa dan tukar air radiator', en:'Check and replace radiator coolant' },
      { id:'m5', bm:'Laras brek tangan dan kaki', en:'Adjust hand and foot brakes' },
      { id:'m6', bm:'Periksa dan laras rantai angkat', en:'Check and adjust lift chains' },
      { id:'m7', bm:'Periksa minyak gear kotak', en:'Check gear box oil' },
      { id:'m8', bm:'Periksa sistem hidraulik', en:'Inspect hydraulic system' },
      { id:'m9', bm:'Bersihkan sistem pendingin', en:'Clean cooling system' },
      { id:'m10',bm:'Uji semua fungsi operasi', en:'Test all operating functions' },
      { id:'m11',bm:'Periksa tayar dan rim', en:'Check tires and rims' },
      { id:'m12',bm:'Rekod bacaan jam operasi', en:'Record operating hour readings' },
    ]
  },
  { id:'fl-weekly', name:'Forklift · Weekly Check',         equipmentType:'Forklift',   serviceType:'Weekly Check',   status:'active',
    items: [
      { id:'w1', bm:'Semak aras minyak enjin', en:'Check engine oil level' },
      { id:'w2', bm:'Semak aras air bateri', en:'Check battery water level' },
      { id:'w3', bm:'Semak tekanan tayar', en:'Check tire pressure' },
      { id:'w4', bm:'Semak lampu isyarat', en:'Check signal lights' },
      { id:'w5', bm:'Semak hon', en:'Check horn' },
      { id:'w6', bm:'Uji brek tangan', en:'Test handbrake' },
    ]
  },
  { id:'fl-preuse', name:'Forklift · Pre-use Inspection',   equipmentType:'Forklift',   serviceType:'Pre-use Check',  status:'active',
    items: [
      { id:'pu1', bm:'Semak kebocoran cecair', en:'Check for fluid leaks' },
      { id:'pu2', bm:'Semak aras minyak', en:'Check oil levels' },
      { id:'pu3', bm:'Semak tekanan tayar', en:'Check tire pressure' },
      { id:'pu4', bm:'Semak brek', en:'Check brakes' },
      { id:'pu5', bm:'Semak lampu', en:'Check lights' },
      { id:'pu6', bm:'Semak rantai angkat', en:'Check lift chains' },
    ]
  },
  { id:'exc-major', name:'Excavator · Major Service',       equipmentType:'Excavator',  serviceType:'Major Service',  status:'active',
    items: [
      { id:'e1', bm:'Tukar minyak enjin dan penapis', en:'Change engine oil and filter' },
      { id:'e2', bm:'Tukar penapis hidraulik', en:'Change hydraulic filter' },
      { id:'e3', bm:'Tukar penapis bahan api', en:'Change fuel filter' },
      { id:'e4', bm:'Periksa dan tukar air radiator', en:'Check and change radiator coolant' },
      { id:'e5', bm:'Periksa tegangan rantai', en:'Check track tension' },
      { id:'e6', bm:'Periksa sistem hidraulik', en:'Inspect hydraulic system' },
      { id:'e7', bm:'Periksa injap pengudaraan karter', en:'Check crankcase ventilation valve' },
      { id:'e8', bm:'Periksa dan laras brek swing', en:'Check and adjust swing brake' },
      { id:'e9', bm:'Pelinciran semua pin dan bush', en:'Lubricate all pins and bushings' },
      { id:'e10',bm:'Periksa sistem elektrik', en:'Inspect electrical system' },
      { id:'e11',bm:'Uji semua fungsi hidraulik', en:'Test all hydraulic functions' },
      { id:'e12',bm:'Rekod bacaan meter', en:'Record meter readings' },
    ]
  },
  { id:'ssl-minor', name:'Skid Steer · Minor Service',      equipmentType:'Skid Steer', serviceType:'Minor Service',  status:'active',
    items: [
      { id:'s1', bm:'Tukar minyak enjin', en:'Change engine oil' },
      { id:'s2', bm:'Tukar penapis minyak', en:'Change oil filter' },
      { id:'s3', bm:'Semak aras minyak hidraulik', en:'Check hydraulic oil level' },
      { id:'s4', bm:'Semak rantai drive', en:'Check drive chains' },
      { id:'s5', bm:'Semak sistem brek', en:'Check brake system' },
      { id:'s6', bm:'Pelinciran semua titik grease', en:'Lubricate all grease points' },
    ]
  },
];

const EQUIPMENT_TYPES_FOR_TEMPLATE = ['Any', 'Forklift', 'Excavator', 'Skid Steer'];
const SERVICE_TYPES_FIXED = ['Pre-use Check', 'Weekly Check', 'Monthly Service', 'Minor Service', 'Major Service'];
const FACILITY_TYPES = ['Air Compressor','Overhead Crane','Fan','Lighting','Oil Trap','Roof','Water Jet','Fence','Rack','Drainage','Facility Paint','Fire Extinguisher','Other'];

// Tag existing equipment templates with entityType
TEMPLATES.forEach(t => { if (!t.entityType) t.entityType = 'equipment'; });

// Facility templates — seeded from Car Medic's paper checklists
TEMPLATES.push(
  { id:'fac-air-comp',  name:'Air Compressor · Monthly Check',       entityType:'facility', equipmentType:'Any', facilityType:'Air Compressor',     serviceType:'Monthly Service', status:'active',
    items: [
      { id:'ac1', bm:'Air Compressor belum mencapai tempoh penyelenggaraan yang ditetapkan', en:'Air compressor has not reached scheduled maintenance period' },
      { id:'ac2', bm:'Tiada kebocoran (ANGIN, MINYAK)', en:'No leaks (air, oil)' },
      { id:'ac3', bm:'"INTAKE" penapis adalah bersih dan bebas daripada habuk atau halangan', en:'Intake filter is clean and free from dust or obstruction' },
      { id:'ac4', bm:'Paras minyak mencukupi, dan tiada kebocoran minyak', en:'Oil level is sufficient and no oil leaks' },
      { id:'ac5', bm:'Kipas adalah bersih dan bebas daripada penumpukan habuk', en:'Fan is clean and free from dust buildup' },
      { id:'ac6', bm:'Suis henti automatik berfungsi dengan baik', en:'Automatic stop switch functions properly' },
      { id:'ac7', bm:'Semua wiring tidak rosak, tanpa tanda-tanda terlalu panas atau sambungan longgar', en:'All wiring undamaged, no signs of overheating or loose connections' },
      { id:'ac8', bm:'Air Compressor dipasang dengan kukuh tanpa getaran berlebihan', en:'Compressor is firmly mounted without excessive vibration' },
      { id:'ac9', bm:'Semua bolt, nat, dan kelengkapan telah diketatkan', en:'All bolts, nuts and fittings have been tightened' },
      { id:'ac10',bm:'Pressure relief valve berfungsi dengan baik', en:'Pressure relief valve functions properly' },
      { id:'ac11',bm:'Tiada bunyi luar biasa semasa operasi', en:'No unusual noise during operation' },
    ]
  },
  { id:'fac-crane-oh',  name:'Overhead Crane · Monthly Check',       entityType:'facility', equipmentType:'Any', facilityType:'Overhead Crane',     serviceType:'Monthly Service', status:'active',
    items: [
      { id:'oc1', bm:'Dawai di kren overhead tidak berbulu dan ada di keadaan yang baik', en:'Overhead crane wires not frayed and in good condition' },
      { id:'oc2', bm:'Alat kawalan kren overhead berfungsi dan tidak rosak', en:'Crane control functions and undamaged' },
      { id:'oc3', bm:'Alat kawalan kren sudah dibersihkan', en:'Crane control has been cleaned' },
      { id:'oc4', bm:'Tali-tali kain ada dalam keadaan yang baik dan tidak akan putus', en:'Fabric slings in good condition and will not break' },
      { id:'oc5', bm:'Dawai-dawai ada dalam keadaan yang baik dan tidak akan putus', en:'Wires in good condition and will not break' },
    ]
  },
  { id:'fac-fan',       name:'Fan · Monthly Check',                  entityType:'facility', equipmentType:'Any', facilityType:'Fan',                serviceType:'Monthly Service', status:'active',
    items: [
      { id:'fn1', bm:'Bilah kipas adalah bersih dan bebas daripada penumpukan habuk', en:'Fan blades are clean and free from dust buildup' },
      { id:'fn2', bm:'Semua kipas berfungsi dengan lancar tanpa bunyi yang luar biasa', en:'All fans operate smoothly without unusual noise' },
      { id:'fn3', bm:'Tiada retakan atau kerosakan yang kelihatan pada kipas', en:'No visible cracks or damage on fan' },
      { id:'fn4', bm:'Penutup pelindung kipas atau pelindung keselamatan berada dalam keadaan baik dan terpasang dengan kukuh', en:'Fan guard or safety cover is in good condition and firmly installed' },
    ]
  },
  { id:'fac-lighting',  name:'Lighting · Monthly Check',             entityType:'facility', equipmentType:'Any', facilityType:'Lighting',           serviceType:'Monthly Service', status:'active',
    items: [
      { id:'lg1', bm:'Semua lampu berfungsi dengan baik tanpa kelipan atau malap', en:'All lights work properly without flickering or dimming' },
      { id:'lg2', bm:'Tiada mentol atau tiub yang terbakar atau rosak', en:'No burnt-out or damaged bulbs or tubes' },
      { id:'lg3', bm:'Penutup lampu, penyebar cahaya, dan pemantul berada dalam keadaan baik dan terpasang dengan kukuh', en:'Light covers, diffusers, and reflectors in good condition and firmly installed' },
      { id:'lg4', bm:'Pendawaian adalah dalam keadaan baik tanpa wayar terdedah atau rosak', en:'Wiring is in good condition without exposed or damaged wires' },
      { id:'lg5', bm:'Tiada tanda-tanda terlalu panas, kesan terbakar, atau bau luar biasa dari kelengkapan lampu', en:'No signs of overheating, burn marks, or unusual smells from light fittings' },
      { id:'lg6', bm:'Semua suis berfungsi dengan baik tanpa tanda-tanda kerosakan atau kelonggaran', en:'All switches work properly without damage or looseness' },
    ]
  },
  { id:'fac-oil-trap',  name:'Oil Trap · Monthly Check',             entityType:'facility', equipmentType:'Any', facilityType:'Oil Trap',           serviceType:'Monthly Service', status:'active',
    items: [
      { id:'ot1', bm:'Penutup oil trap terpasang dengan kukuh dan tidak rosak', en:'Oil trap cover firmly installed and undamaged' },
      { id:'ot2', bm:'Oil trap bebas daripada penumpukan lumpur atau sisa pepejal yang berlebihan', en:'Oil trap free from excessive sludge or solid waste buildup' },
      { id:'ot3', bm:'Paip masuk dan keluar adalah bersih dan tidak tersumbat', en:'Inlet and outlet pipes are clean and unobstructed' },
      { id:'ot4', bm:'Tiada bau busuk yang menandakan tersumbat atau pencemaran', en:'No foul odour indicating blockage or contamination' },
      { id:'ot5', bm:'Kawasan sekeliling adalah bersih dan bebas daripada tumpahan', en:'Surrounding area is clean and free from spills' },
    ]
  },
  { id:'fac-roof',      name:'Roof · Monthly Check',                 entityType:'facility', equipmentType:'Any', facilityType:'Roof',               serviceType:'Monthly Service', status:'active',
    items: [
      { id:'rf1', bm:'Tiada retakan, lubang, atau kepingan bumbung yang rosak yang kelihatan', en:'No visible cracks, holes, or damaged roof pieces' },
      { id:'rf2', bm:'Jubin bumbung, kepingan, atau panel berada dalam keadaan baik dan dipasang dengan kukuh', en:'Roof tiles, sheets, or panels in good condition and firmly installed' },
      { id:'rf3', bm:'Longkang dan saluran air hujan bebas daripada sisa dan berfungsi dengan baik', en:'Gutters and rainwater channels free of debris and functioning properly' },
      { id:'rf4', bm:'Tiada tanda-tanda kebocoran air atau kesan kotoran pada siling', en:'No signs of water leaks or stains on ceiling' },
    ]
  },
  { id:'fac-water-jet', name:'Water Jet · Monthly Check',            entityType:'facility', equipmentType:'Any', facilityType:'Water Jet',          serviceType:'Monthly Service', status:'active',
    items: [
      { id:'wj1', bm:'Hos bebas daripada retakan, potongan, atau kehausan yang berlebihan', en:'Hose free from cracks, cuts, or excessive wear' },
      { id:'wj2', bm:'Pam bebas daripada kebocoran dan bunyi luar biasa semasa beroperasi', en:'Pump free from leaks and unusual noise during operation' },
      { id:'wj3', bm:'Power cord dan plug tidak rosak dan disambung dengan kukuh', en:'Power cord and plug undamaged and firmly connected' },
      { id:'wj4', bm:'Tahap tekanan adalah stabil dan beroperasi pada tetapan yang betul', en:'Pressure level is stable and operates at correct settings' },
      { id:'wj5', bm:'Tiada kebocoran yang kelihatan pada hos, fitting, atau connectors', en:'No visible leaks on hose, fittings, or connectors' },
    ]
  },
  { id:'fac-fence',     name:'Fence · Monthly Check',                entityType:'facility', equipmentType:'Any', facilityType:'Fence',              serviceType:'Monthly Service', status:'active',
    items: [
      { id:'fc1', bm:'Pagar terbuka dan tertutup dengan lancar tanpa halangan', en:'Fence opens and closes smoothly without obstruction' },
      { id:'fc2', bm:'Engsel dilincirkan dan bebas daripada karat atau bunyi berdecit', en:'Hinges are lubricated and free from rust or squeaking' },
      { id:'fc3', bm:'Struktur pagar berada dalam keadaan baik tanpa retakan, bengkok, atau kerosakan yang kelihatan', en:'Fence structure in good condition without cracks, bends, or visible damage' },
      { id:'fc4', bm:'Semua bolt, skru, dan pengikat dipasang dengan kukuh', en:'All bolts, screws, and fasteners firmly installed' },
      { id:'fc5', bm:'Penggelek pagar selari dan bergerak dengan lancar', en:'Fence rollers parallel and moving smoothly' },
    ]
  },
  { id:'fac-rack',      name:'Rack · Monthly Check',                 entityType:'facility', equipmentType:'Any', facilityType:'Rack',               serviceType:'Monthly Service', status:'active',
    items: [
      { id:'rk1', bm:'Tiada retakan, bengkok, atau kerosakan yang kelihatan pada struktur rak', en:'No visible cracks, bends, or damage on rack structure' },
      { id:'rk2', bm:'Rak adalah rata dan disusun dengan betul', en:'Rack is level and arranged correctly' },
      { id:'rk3', bm:'Barangan yang disimpan disusun dengan teratur dan diedarkan secara sekata untuk mengelakkan ketidakseimbangan', en:'Stored items are organised and distributed evenly to prevent imbalance' },
      { id:'rk4', bm:'Tiada barang yang longgar atau tidak stabil yang boleh jatuh', en:'No loose or unstable items that could fall' },
    ]
  },
  { id:'fac-drainage',  name:'Drainage · Monthly Check',             entityType:'facility', equipmentType:'Any', facilityType:'Drainage',           serviceType:'Monthly Service', status:'active',
    items: [
      { id:'dr1', bm:'Penutup longkang berada dalam keadaan baik, terpasang dengan kukuh, dan tidak rosak', en:'Drainage cover in good condition, firmly installed, and undamaged' },
      { id:'dr2', bm:'Tiada halangan atau sisa yang kelihatan di dalam longkang', en:'No visible obstruction or debris inside drainage' },
      { id:'dr3', bm:'Air mengalir dengan lancar tanpa bertakung atau melimpah', en:'Water flows smoothly without pooling or overflowing' },
      { id:'dr4', bm:'Penutup parit adalah bersih dan bebas daripada kotoran, gris, atau penumpukan sisa', en:'Drain cover is clean and free from dirt, grease, or waste buildup' },
      { id:'dr5', bm:'Paip longkang berada dalam keadaan baik tanpa retakan, kebocoran, atau kakisan', en:'Drainage pipes in good condition without cracks, leaks, or corrosion' },
    ]
  },
  { id:'fac-paint',     name:'Facility Paint · Monthly Check',       entityType:'facility', equipmentType:'Any', facilityType:'Facility Paint',     serviceType:'Monthly Service', status:'active',
    items: [
      { id:'pt1', bm:'Tiada retakan, cat mengelupas, atau cat tertanggal yang kelihatan pada dinding', en:'No visible cracks, peeling paint, or detached paint on walls' },
      { id:'pt2', bm:'Dinding luar adalah bersih dan bebas daripada kotoran, kesan noda, atau kulapuk', en:'Exterior walls are clean and free from dirt, stains, or mould' },
      { id:'pt3', bm:'Tiada tanda-tanda kesan air atau tompokan lembap pada kawasan yang dicat', en:'No signs of water marks or damp patches on painted areas' },
    ]
  },
  { id:'fac-fire-ext',  name:'Fire Extinguisher · Monthly Check',    entityType:'facility', equipmentType:'Any', facilityType:'Fire Extinguisher',  serviceType:'Monthly Service', status:'active',
    items: [
      { id:'fe1', bm:'Semua pemadam api ada di lokasi yang ditetapkan', en:'All fire extinguishers present at designated locations' },
      { id:'fe2', bm:'Tiada apa-apa yang menghalang pemadam api', en:'Nothing obstructs the fire extinguishers' },
      { id:'fe3', bm:'Pemadam api digantung dan tidak diletakkan di lantai', en:'Fire extinguishers are hung and not placed on the floor' },
      { id:'fe4', bm:'Pemadam api dibersihkan', en:'Fire extinguishers are cleaned' },
      { id:'fe5', bm:'Tanda alat pemadam api jelas', en:'Fire extinguisher signs are clear' },
      { id:'fe6', bm:'Tolok tekanan berada di zon hijau, pin dalam keadaan utuh, dan tiada kerosakan', en:'Pressure gauge in green zone, pin intact, and no damage' },
    ]
  }
);

// FACILITIES seed data
const FACILITIES = [
  { id:'fac-001', name:'Air Compressor - Workshop Bay 1',   type:'Air Compressor',    location:'AATF 1', quantity:1,  installedDate:'2020-05-10', notes:'Main workshop compressor', status:'active', photo:null },
  { id:'fac-002', name:'Fire Extinguishers - Workshop',     type:'Fire Extinguisher', location:'AATF 1', quantity:6,  installedDate:'2023-01-15', notes:'ABC dry powder, 6kg each', status:'active', photo:null },
  { id:'fac-003', name:'Overhead Crane - Main Bay',         type:'Overhead Crane',    location:'HQ',     quantity:1,  installedDate:'2019-03-20', notes:'5-ton SWL, chain hoist',  status:'active', photo:null },
  { id:'fac-004', name:'Office Light Fixtures',             type:'Lighting',          location:'HQ',     quantity:20, installedDate:'2021-11-02', notes:'LED tube panels',         status:'active', photo:null },
  { id:'fac-005', name:'Water Jet Machine - Wash Bay',      type:'Water Jet',         location:'AATF 2', quantity:1,  installedDate:'2022-08-18', notes:'High-pressure cold water', status:'active', photo:null },
  { id:'fac-006', name:'Oil Trap - Workshop Floor',         type:'Oil Trap',          location:'AATF 2', quantity:1,  installedDate:'2019-03-20', notes:'Connected to main drainage', status:'active', photo:null },
];

function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

function getFacility(id) {
  return FACILITIES.find(f => f.id === id);
}

function getEntity(entityType, id) {
  return entityType === 'facility' ? getFacility(id) : EQUIPMENT.find(e => e.id === id);
}

function activeTemplatesFor(equipType, serviceType, entityType = 'equipment', facilityType = null) {
  return TEMPLATES.filter(t => {
    if (t.status !== 'active') return false;
    if ((t.entityType || 'equipment') !== entityType) return false;
    if (entityType === 'equipment') {
      const typeMatch = t.equipmentType === 'Any' || t.equipmentType === equipType;
      if (!typeMatch) return false;
    } else if (entityType === 'facility' && facilityType) {
      if (t.facilityType && t.facilityType !== facilityType) return false;
    }
    if (!serviceType) return true;
    if (serviceType === 'Custom') return true;
    return t.serviceType === serviceType;
  });
}

// User accounts — credentials will move to PHP/DB on backend integration
const USERS = [
  { id:'u-admin', name:'Amar Zamani', email:'admin@carmedic.com.my', password:'admin123', role:'admin', avatar:'AZ' },
  { id:'u-ops',   name:'Ahmad B.',    email:'ops@carmedic.com.my',   password:'ops123',   role:'ops',   avatar:'AB' },
];

function authenticate(email, password) {
  const u = USERS.find(x => x.email.toLowerCase() === (email || '').trim().toLowerCase());
  if (!u || u.password !== password) return null;
  return u;
}

/* ═══════════════════════════════════════════════════════════
   2. STATE
   ═══════════════════════════════════════════════════════════ */

const S = {
  page: 'overview',
  loggedIn: false,
  user: null,
  role: 'ops',
  dark: false,
  selectedEquipment: null,
  selectedJob: null,
  checks: {},
  equipSearch: '',
  equipFilters: { location: 'all', type: 'all', status: 'all' },
  maintFilter: 'all',
  histSearch: '',
  partsSearch: '',
  partsFilter: 'all',
  addEquipStep: 1,
  addEquipData: {},
  maintView: 'list',
  equipMaintView: 'list',
  calMonth: 0,
  editEquipPhotos: null,
  scheduleForm: null,
  templateSearch: '',
  templateFilterEquip: 'all',
  templateFilterService: 'all',
  templateFilterStatus: 'all',
  templateDraft: null,
  selectedFacility: null,
  facilitySearch: '',
  facilityFilterLocation: 'all',
  facilityFilterType: 'all',
  overviewTab: 'upcoming',
  notifOpen: false,
};

function freshScheduleForm() {
  return {
    entityType: 'equipment',
    equipId: '',
    facilityId: '',
    type: 'Minor Service',
    basis: 'time',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    dueHours: '',
    estCost: '',
    checklistId: '',
    customType: '',
    notes: '',
    requiredPartIds: [],
  };
}

function defaultRequiredPartsFor(equipId, type) {
  if (!equipId) return [];
  // Minor & Major consume parts; Weekly/Pre-use are inspection-only
  if (type === 'Minor Service' || type === 'Major Service') {
    return equipParts(equipId).map(x => x.partId);
  }
  return [];
}

function suggestChecklistFor(entityId, type, entityType = 'equipment') {
  if (entityType === 'facility') {
    const f = getFacility(entityId);
    if (!f) return '';
    const matches = activeTemplatesFor(null, type, 'facility', f.type);
    const exact = matches.find(t => t.facilityType === f.type);
    if (exact) return exact.id;
    if (matches.length > 0) return matches[0].id;
    return '';
  }
  const e = EQUIPMENT.find(x => x.id === entityId);
  if (!e) return '';
  const matches = activeTemplatesFor(e.type, type, 'equipment');
  const exact = matches.find(t => t.equipmentType === e.type);
  if (exact) return exact.id;
  if (matches.length > 0) return matches[0].id;
  return '';
}
