/* ══════════════════════════════════════════════════════
   api.js (DEMO) — in-memory mock of the PHP backend.
   Uses the seed arrays from data.js and persists mutations to localStorage
   so a refresh keeps the demo state. No server, no PHP, no MySQL required.
   Designed to be a drop-in replacement for the production api.js.
   ══════════════════════════════════════════════════════ */

'use strict';

const API = (() => {
  const STORE_KEY = 'fems-demo-state';
  const USER_KEY  = 'fems-demo-user';
  const DELAY_MS  = 80;   // small delay to mimic network round-trip and show loaders

  /* ─── Persistence ─── */
  function hydrate() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (Array.isArray(s.users))       replaceArray(USERS,        s.users);
      if (Array.isArray(s.equipment))   replaceArray(EQUIPMENT,    s.equipment);
      if (Array.isArray(s.parts))       replaceArray(PARTS,        s.parts);
      if (Array.isArray(s.facilities))  replaceArray(FACILITIES,   s.facilities);
      if (Array.isArray(s.templates))   replaceArray(TEMPLATES,    s.templates);
      if (Array.isArray(s.jobs))        replaceArray(JOBS,         s.jobs);
      if (Array.isArray(s.history))     replaceArray(HISTORY,      s.history);
      if (Array.isArray(s.breakdowns))  replaceArray(BREAKDOWNS,   s.breakdowns);
      if (Array.isArray(s.fuelEntries)) replaceArray(FUEL_ENTRIES, s.fuelEntries);
    } catch (e) {
      console.warn('demo: hydrate failed, starting from seed', e);
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        users:       USERS,
        equipment:   EQUIPMENT,
        parts:       PARTS,
        facilities:  FACILITIES,
        templates:   TEMPLATES,
        jobs:        JOBS,
        history:     HISTORY,
        breakdowns:  BREAKDOWNS,
        fuelEntries: FUEL_ENTRIES,
      }));
    } catch (e) {
      console.warn('demo: persist failed (quota?)', e);
    }
  }
  hydrate();

  /* ─── Utilities ─── */
  const delay = (val, ms = DELAY_MS) => new Promise(r => setTimeout(() => r(val), ms));
  const nid   = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const stripPassword = u => { const { password, ...rest } = u; return rest; };

  function sessionUser()     { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch(e){ return null; } }
  function setSessionUser(u) { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); }
  function requireSession()  { const u = sessionUser(); if (!u) throw new Error('Not logged in'); return u; }

  /* ─── Auth ─── */
  async function login(email, password) {
    const u = authenticate(email, password);
    if (!u) { await delay(null); throw new Error('Invalid email or password'); }
    const safe = stripPassword(u);
    setSessionUser(safe);
    return delay({ user: safe });
  }
  async function logout() { setSessionUser(null); return delay({ ok: true }); }
  async function me()     { const u = sessionUser(); if (!u) { await delay(null); throw new Error('Not logged in'); } return delay({ user: u }); }

  /* ─── Users ─── */
  // NOTE: returning users WITH passwords here is intentional for the demo — auth happens
  // client-side against USERS.password, so stripping them would break the next login.
  async function listUsers()          { return delay({ users: USERS.map(u => ({ ...u })) }); }
  async function createUser(data) {
    if (USERS.some(u => u.email.toLowerCase() === (data.email||'').toLowerCase())) throw new Error('Email already exists');
    const u = {
      id: nid('u'),
      name:  data.name,
      email: data.email,
      password: data.password || 'demo',
      role:  data.role || 'ops',
      avatar: (data.name || '??').slice(0, 2).toUpperCase(),
      active: true,
    };
    USERS.push(u); persist();
    return delay({ id: u.id, ok: true }, 120);
  }
  async function updateUser(id, data) {
    const u = USERS.find(x => x.id === id);
    if (!u) throw new Error('User not found');
    if (data.email && USERS.some(x => x.id !== id && x.email.toLowerCase() === data.email.toLowerCase())) throw new Error('Email already in use');
    Object.assign(u, data);
    persist();
    return delay({ ok: true });
  }
  async function deleteUser(id) {
    const current = sessionUser();
    if (current && current.id === id) throw new Error("You can't delete your own account");
    const i = USERS.findIndex(u => u.id === id);
    if (i < 0) throw new Error('User not found');
    USERS.splice(i, 1); persist();
    return delay({ ok: true });
  }
  async function resetUserPassword(id, password) {
    const u = USERS.find(x => x.id === id);
    if (!u) throw new Error('User not found');
    u.password = password;
    persist();
    return delay({ ok: true });
  }

  /* ─── Parts ─── */
  async function listParts()            { return delay({ parts: [...PARTS] }); }
  async function createPart(data) {
    if (PARTS.some(p => p.code.toLowerCase() === (data.code||'').toLowerCase())) throw new Error('Part code already exists');
    const p = {
      id: nid('p'),
      name:     data.name,
      code:     data.code,
      cat:      data.cat || 'Other',
      unit:     data.unit || 'pcs',
      price:    Number(data.price)    || 0,
      stock:    Number(data.stock)    || 0,
      minStock: Number(data.minStock) || 0,
    };
    PARTS.push(p); persist();
    return delay({ id: p.id, ok: true }, 120);
  }
  async function updatePart(id, data) {
    const p = PARTS.find(x => x.id === id);
    if (!p) throw new Error('Part not found');
    if (data.code && PARTS.some(x => x.id !== id && x.code.toLowerCase() === data.code.toLowerCase())) throw new Error('Part code already in use');
    Object.assign(p, data);
    if (data.price != null)    p.price    = Number(data.price);
    if (data.stock != null)    p.stock    = Number(data.stock);
    if (data.minStock != null) p.minStock = Number(data.minStock);
    persist();
    return delay({ ok: true });
  }
  async function deletePart(id) {
    const i = PARTS.findIndex(p => p.id === id);
    if (i < 0) throw new Error('Part not found');
    PARTS.splice(i, 1);
    // Cascade: remove from equipment_parts and job_required_parts
    EQUIPMENT.forEach(e => { if (e.parts) e.parts = e.parts.filter(ep => ep.partId !== id); });
    JOBS.forEach(j => { if (j.requiredPartIds) j.requiredPartIds = j.requiredPartIds.filter(pid => pid !== id); });
    persist();
    return delay({ ok: true });
  }

  /* ─── Facilities ─── */
  async function listFacilities()           { return delay({ facilities: [...FACILITIES] }); }
  async function createFacility(data) {
    const f = { id: nid('fac'), ...data, status: data.status || 'active' };
    FACILITIES.push(f); persist();
    return delay({ id: f.id, ok: true }, 120);
  }
  async function updateFacility(id, data) {
    const f = FACILITIES.find(x => x.id === id);
    if (!f) throw new Error('Facility not found');
    Object.assign(f, data);
    persist();
    return delay({ ok: true });
  }
  async function deleteFacility(id) {
    const i = FACILITIES.findIndex(f => f.id === id);
    if (i < 0) throw new Error('Facility not found');
    FACILITIES.splice(i, 1);
    // Cascade: drop dependent jobs/history
    for (let k = JOBS.length - 1; k >= 0; k--)    if (JOBS[k].entityType === 'facility'    && JOBS[k].entityId === id)    JOBS.splice(k, 1);
    for (let k = HISTORY.length - 1; k >= 0; k--) if (HISTORY[k].entityType === 'facility' && HISTORY[k].entityId === id) HISTORY.splice(k, 1);
    persist();
    return delay({ ok: true });
  }

  /* ─── Equipment ─── */
  async function listEquipment()           { return delay({ equipment: [...EQUIPMENT] }); }
  async function createEquipment(data) {
    const e = { id: nid('eq'), ...data, status: data.status || 'ok', parts: [] };
    EQUIPMENT.push(e); persist();
    return delay({ id: e.id, ok: true }, 150);
  }
  async function updateEquipment(id, data) {
    const e = EQUIPMENT.find(x => x.id === id);
    if (!e) throw new Error('Equipment not found');
    Object.assign(e, data);
    persist();
    return delay({ ok: true });
  }
  async function deleteEquipment(id) {
    const i = EQUIPMENT.findIndex(e => e.id === id);
    if (i < 0) throw new Error('Equipment not found');
    EQUIPMENT.splice(i, 1);
    for (let k = JOBS.length - 1; k >= 0; k--)          if (JOBS[k].equipId === id)          JOBS.splice(k, 1);
    for (let k = HISTORY.length - 1; k >= 0; k--)       if (HISTORY[k].equipId === id)       HISTORY.splice(k, 1);
    for (let k = BREAKDOWNS.length - 1; k >= 0; k--)    if (BREAKDOWNS[k].equipId === id)    BREAKDOWNS.splice(k, 1);
    for (let k = FUEL_ENTRIES.length - 1; k >= 0; k--)  if (FUEL_ENTRIES[k].equipId === id)  FUEL_ENTRIES.splice(k, 1);
    persist();
    return delay({ ok: true });
  }

  /* ─── Equipment ↔ Parts junction ─── */
  async function addEquipmentPart(equipmentId, partId, qty) {
    const e = EQUIPMENT.find(x => x.id === equipmentId);
    if (!e) throw new Error('Equipment not found');
    e.parts = e.parts || [];
    if (e.parts.some(p => p.partId === partId)) throw new Error('Part already linked to this equipment');
    e.parts.push({ partId, qty: Number(qty) || 1 });
    persist();
    return delay({ ok: true });
  }
  async function updateEquipmentPart(equipmentId, partId, qty) {
    const e = EQUIPMENT.find(x => x.id === equipmentId);
    if (!e || !e.parts) throw new Error('Equipment not found');
    const ep = e.parts.find(p => p.partId === partId);
    if (!ep) throw new Error('Part link not found');
    ep.qty = Number(qty) || 1;
    persist();
    return delay({ ok: true });
  }
  async function removeEquipmentPart(equipmentId, partId) {
    const e = EQUIPMENT.find(x => x.id === equipmentId);
    if (!e || !e.parts) throw new Error('Equipment not found');
    e.parts = e.parts.filter(p => p.partId !== partId);
    persist();
    return delay({ ok: true });
  }

  /* ─── Templates ─── */
  async function listTemplates()             { return delay({ templates: [...TEMPLATES] }); }
  async function createTemplate(data) {
    const t = {
      id: nid('tpl'),
      name:          data.name,
      entityType:    data.entityType || 'equipment',
      equipmentType: data.equipmentType || null,
      facilityType:  data.facilityType  || null,
      serviceType:   data.serviceType,
      status:        data.status || 'active',
      items:         Array.isArray(data.items) ? data.items.map((it, i) => ({ id: it.id || `i${i}`, bm: it.bm || '', en: it.en || '' })) : [],
    };
    TEMPLATES.push(t); persist();
    return delay({ id: t.id, ok: true }, 120);
  }
  async function updateTemplate(id, data) {
    const t = TEMPLATES.find(x => x.id === id);
    if (!t) throw new Error('Template not found');
    Object.assign(t, data);
    if (Array.isArray(data.items)) t.items = data.items.map((it, i) => ({ id: it.id || `i${i}`, bm: it.bm || '', en: it.en || '' }));
    persist();
    return delay({ ok: true });
  }
  async function deleteTemplate(id) {
    const i = TEMPLATES.findIndex(t => t.id === id);
    if (i < 0) throw new Error('Template not found');
    TEMPLATES.splice(i, 1);
    // Null out checklistId on any job that referenced this template (mirrors FK ON DELETE SET NULL)
    JOBS.forEach(j => { if (j.checklistId === id) j.checklistId = null; });
    persist();
    return delay({ ok: true });
  }

  /* ─── Jobs ─── */
  async function listJobs()            { return delay({ jobs: [...JOBS] }); }
  async function createJob(data) {
    const entity = data.entityType === 'facility'
      ? FACILITIES.find(f => f.id === data.entityId)
      : EQUIPMENT.find(e => e.id === data.entityId);
    if (!entity) throw new Error('Target entity not found');
    const j = {
      id: nid('job'),
      entityType:  data.entityType || 'equipment',
      entityId:    data.entityId,
      equipId:     data.entityType === 'facility' ? null : data.entityId,
      equipName:   entity.name,
      equipCode:   data.entityType === 'facility' ? entity.type : entity.code,
      type:        data.type,
      basis:       data.basis || 'time',
      dueDate:     data.dueDate || null,
      dueHours:    data.dueHours  != null ? Number(data.dueHours)  : null,
      currentHours:data.currentHours != null ? Number(data.currentHours) : null,
      status:      data.status   || 'upcoming',
      priority:    data.priority || 'medium',
      location:    data.location,
      started:     data.started  || null,
      checklistId: data.checklistId || null,
      estCost:     Number(data.estCost) || 0,
      notes:       data.notes || null,
      requiredPartIds: Array.isArray(data.requiredPartIds) ? [...data.requiredPartIds] : [],
    };
    JOBS.push(j); persist();
    return delay({ id: j.id, ok: true }, 150);
  }
  async function updateJob(id, data) {
    const j = JOBS.find(x => x.id === id);
    if (!j) throw new Error('Job not found');
    // If entity swap, re-snapshot
    if (data.entityType && data.entityId && (data.entityType !== j.entityType || data.entityId !== j.entityId)) {
      const entity = data.entityType === 'facility'
        ? FACILITIES.find(f => f.id === data.entityId)
        : EQUIPMENT.find(e => e.id === data.entityId);
      if (!entity) throw new Error('Target entity not found');
      j.entityType = data.entityType;
      j.entityId   = data.entityId;
      j.equipId    = data.entityType === 'facility' ? null : data.entityId;
      j.equipName  = entity.name;
      j.equipCode  = data.entityType === 'facility' ? entity.type : entity.code;
    }
    ['type','basis','dueDate','status','priority','location','started','checklistId','notes'].forEach(k => { if (data[k] !== undefined) j[k] = data[k]; });
    if (data.dueHours     !== undefined) j.dueHours     = data.dueHours     != null && data.dueHours     !== '' ? Number(data.dueHours)     : null;
    if (data.currentHours !== undefined) j.currentHours = data.currentHours != null && data.currentHours !== '' ? Number(data.currentHours) : null;
    if (data.estCost      !== undefined) j.estCost      = Number(data.estCost) || 0;
    if (Array.isArray(data.requiredPartIds)) j.requiredPartIds = [...data.requiredPartIds];
    persist();
    return delay({ ok: true });
  }
  async function deleteJob(id) {
    const i = JOBS.findIndex(j => j.id === id);
    if (i < 0) throw new Error('Job not found');
    JOBS.splice(i, 1); persist();
    return delay({ ok: true });
  }
  async function closeJob(id, data) {
    const jIdx = JOBS.findIndex(j => j.id === id);
    if (jIdx < 0) throw new Error('Job not found');
    const j = JOBS[jIdx];

    // Load required parts + their qty from equipment_parts + current price from PARTS
    const required = (j.requiredPartIds || []).map(pid => {
      const eq = EQUIPMENT.find(x => x.id === j.equipId);
      const ep = eq?.parts?.find(x => x.partId === pid);
      const p  = PARTS.find(x => x.id === pid);
      return { partId: pid, qty: ep?.qty ?? 1, price: p?.price ?? 0 };
    });
    const partsCost = required.reduce((s, rp) => s + (rp.qty * rp.price), 0);
    const laborCost = Number(data.laborCost) || 0;
    const miscCost  = Number(data.miscCost)  || 0;
    const cost      = partsCost + laborCost + miscCost;

    // Meter validation
    if (j.basis === 'hour' && j.entityType === 'equipment') {
      const eq = EQUIPMENT.find(x => x.id === j.entityId);
      if (!data.meter) throw new Error('Meter reading required for hour-based jobs');
      if (eq && data.meter < eq.hours) throw new Error('Meter reading cannot be less than current hours');
    }

    // 1. Insert history record
    const h = {
      id: nid('h'),
      entityType: j.entityType,
      entityId:   j.entityId,
      equipId:    j.equipId,
      equipName:  j.equipName,
      equipCode:  j.equipCode,
      type:       j.type,
      date:       data.date,
      duration:   data.duration,
      cost, partsCost, laborCost, miscCost,
      parts:      required.length,
      tech:       data.tech,
      notes:      data.notes || null,
      status:     'completed',
    };
    HISTORY.unshift(h);

    // 2. Deduct parts stock (bounded at 0)
    required.forEach(rp => {
      const p = PARTS.find(x => x.id === rp.partId);
      if (p) p.stock = Math.max(0, p.stock - rp.qty);
    });

    // 3. Update equipment hours if meter provided (equipment jobs only)
    if (data.meter != null && j.entityType === 'equipment') {
      const eq = EQUIPMENT.find(x => x.id === j.entityId);
      if (eq) eq.hours = Number(data.meter);
    }

    // 4. Delete the job
    JOBS.splice(jIdx, 1);

    persist();
    return delay({ ok: true, historyId: h.id }, 200);
  }

  /* ─── History ─── */
  async function listHistory()           { return delay({ history: [...HISTORY] }); }
  async function deleteHistory(id) {
    const i = HISTORY.findIndex(h => h.id === id);
    if (i < 0) throw new Error('History record not found');
    HISTORY.splice(i, 1); persist();
    return delay({ ok: true });
  }

  /* ─── Breakdowns ─── */
  async function listBreakdowns()              { return delay({ breakdowns: [...BREAKDOWNS] }); }
  async function createBreakdown(data) {
    const eq = EQUIPMENT.find(x => x.id === data.equipId);
    if (!eq) throw new Error('Equipment not found');
    const b = {
      id: nid('bd'),
      equipId:     data.equipId,
      equipName:   eq.name,
      equipCode:   eq.code,
      date:        data.date,
      time:        data.time,
      reportedBy:  data.reportedBy,
      description: data.description,
      severity:    data.severity || 'high',
      status:      'active',
      resolvedDate: null, resolvedBy: null, resolutionNotes: null,
    };
    BREAKDOWNS.unshift(b);
    eq.status = 'breakdown';
    persist();
    return delay({ id: b.id, ok: true }, 150);
  }
  async function updateBreakdown(id, data) {
    const b = BREAKDOWNS.find(x => x.id === id);
    if (!b) throw new Error('Breakdown not found');
    Object.assign(b, data);
    persist();
    return delay({ ok: true });
  }
  async function deleteBreakdown(id) {
    const i = BREAKDOWNS.findIndex(b => b.id === id);
    if (i < 0) throw new Error('Breakdown not found');
    const b = BREAKDOWNS[i];
    BREAKDOWNS.splice(i, 1);
    if (b.status === 'active') {
      const stillActive = BREAKDOWNS.some(x => x.equipId === b.equipId && x.status === 'active');
      if (!stillActive) {
        const eq = EQUIPMENT.find(x => x.id === b.equipId);
        if (eq) eq.status = 'ok';
      }
    }
    persist();
    return delay({ ok: true });
  }
  async function resolveBreakdown(id, data) {
    const b = BREAKDOWNS.find(x => x.id === id);
    if (!b) throw new Error('Breakdown not found');
    b.status          = 'resolved';
    b.resolvedDate    = data.resolvedDate || new Date().toISOString().slice(0,10);
    b.resolvedBy      = data.resolvedBy;
    b.resolutionNotes = data.resolutionNotes;
    const stillActive = BREAKDOWNS.some(x => x.equipId === b.equipId && x.status === 'active');
    if (!stillActive) {
      const eq = EQUIPMENT.find(x => x.id === b.equipId);
      if (eq) eq.status = 'ok';
    }
    persist();
    return delay({ ok: true });
  }

  /* ─── Fuel entries ─── */
  async function listFuelEntries()             { return delay({ entries: [...FUEL_ENTRIES] }); }
  async function createFuelEntry(data) {
    const eq = EQUIPMENT.find(x => x.id === data.equipId);
    if (!eq) throw new Error('Equipment not found');
    const f = {
      id: nid('fe'),
      equipId:        data.equipId,
      equipName:      eq.name,
      equipCode:      eq.code,
      date:           data.date,
      litres:         Number(data.litres) || 0,
      operatingHours: data.operatingHours != null && data.operatingHours !== '' ? Number(data.operatingHours) : null,
      pricePerLitre:  data.pricePerLitre  != null && data.pricePerLitre  !== '' ? Number(data.pricePerLitre)  : null,
      totalCost:      data.totalCost      != null && data.totalCost      !== '' ? Number(data.totalCost)      : null,
      refuelledBy:    data.refuelledBy || null,
      notes:          data.notes || null,
    };
    FUEL_ENTRIES.unshift(f); persist();
    return delay({ id: f.id, ok: true }, 120);
  }
  async function updateFuelEntry(id, data) {
    const f = FUEL_ENTRIES.find(x => x.id === id);
    if (!f) throw new Error('Fuel entry not found');
    Object.assign(f, data);
    persist();
    return delay({ ok: true });
  }
  async function deleteFuelEntry(id) {
    const i = FUEL_ENTRIES.findIndex(f => f.id === id);
    if (i < 0) throw new Error('Fuel entry not found');
    FUEL_ENTRIES.splice(i, 1); persist();
    return delay({ ok: true });
  }

  return {
    login, logout, me,
    listUsers, createUser, updateUser, deleteUser, resetUserPassword,
    listParts, createPart, updatePart, deletePart,
    listFacilities, createFacility, updateFacility, deleteFacility,
    listEquipment, createEquipment, updateEquipment, deleteEquipment,
    addEquipmentPart, updateEquipmentPart, removeEquipmentPart,
    listTemplates, createTemplate, updateTemplate, deleteTemplate,
    listJobs, createJob, updateJob, deleteJob, closeJob,
    listHistory, deleteHistory,
    listBreakdowns, createBreakdown, updateBreakdown, deleteBreakdown, resolveBreakdown,
    listFuelEntries, createFuelEntry, updateFuelEntry, deleteFuelEntry,
  };
})();

/* Production-parity helpers expected by modals.js / pages.js — copied verbatim. */
function replaceArray(arr, fresh) {
  arr.length = 0;
  if (Array.isArray(fresh)) arr.push(...fresh);
}

async function loadAllData() {
  const tasks = [
    { label: 'users',       call: () => API.listUsers(),       key: 'users',       target: USERS       },
    { label: 'parts',       call: () => API.listParts(),       key: 'parts',       target: PARTS       },
    { label: 'facilities',  call: () => API.listFacilities(),  key: 'facilities',  target: FACILITIES  },
    { label: 'equipment',   call: () => API.listEquipment(),   key: 'equipment',   target: EQUIPMENT   },
    { label: 'templates',   call: () => API.listTemplates(),   key: 'templates',   target: TEMPLATES   },
    { label: 'jobs',        call: () => API.listJobs(),        key: 'jobs',        target: JOBS        },
    { label: 'history',     call: () => API.listHistory(),     key: 'history',     target: HISTORY     },
    { label: 'breakdowns',  call: () => API.listBreakdowns(),  key: 'breakdowns',  target: BREAKDOWNS  },
    { label: 'fuel',        call: () => API.listFuelEntries(), key: 'entries',     target: FUEL_ENTRIES},
  ];
  const results = await Promise.allSettled(tasks.map(t => t.call()));
  results.forEach((r, i) => {
    const t = tasks[i];
    if (r.status === 'fulfilled') replaceArray(t.target, r.value[t.key]);
  });
}

async function refreshUsers()        { try { const { users }       = await API.listUsers();        replaceArray(USERS,        users); }        catch (e) { console.error(e); } }
async function refreshParts()        { try { const { parts }       = await API.listParts();        replaceArray(PARTS,        parts); }        catch (e) { console.error(e); } }
async function refreshFacilities()   { try { const { facilities }  = await API.listFacilities();   replaceArray(FACILITIES,   facilities); }   catch (e) { console.error(e); } }
async function refreshEquipment()    { try { const { equipment }   = await API.listEquipment();    replaceArray(EQUIPMENT,    equipment); }    catch (e) { console.error(e); } }
async function refreshTemplates()    { try { const { templates }   = await API.listTemplates();    replaceArray(TEMPLATES,    templates); }    catch (e) { console.error(e); } }
async function refreshJobs()         { try { const { jobs }        = await API.listJobs();         replaceArray(JOBS,         jobs); }         catch (e) { console.error(e); } }
async function refreshHistory()      { try { const { history }     = await API.listHistory();      replaceArray(HISTORY,      history); }      catch (e) { console.error(e); } }
async function refreshBreakdowns()   { try { const { breakdowns }  = await API.listBreakdowns();   replaceArray(BREAKDOWNS,   breakdowns); }   catch (e) { console.error(e); } }
async function refreshFuelEntries()  { try { const { entries }     = await API.listFuelEntries();  replaceArray(FUEL_ENTRIES, entries); }      catch (e) { console.error(e); } }
