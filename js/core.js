/* ══════════════════════════════════════════════════════
   core.js — navigation, render dispatcher, utilities, calendar
   ══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   3. NAVIGATION
   ═══════════════════════════════════════════════════════════ */

function go(page, extra) {
  if (extra) Object.assign(S, extra);
  S.page = page;
  render();
  syncNav();
}

function syncNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === S.page ||
      (S.page === 'equipment-detail' && el.dataset.page === 'equipment') ||
      (S.page === 'facility-detail' && el.dataset.page === 'facilities') ||
      (S.page === 'job' && el.dataset.page === 'maintenance') ||
      (S.page === 'schedule' && el.dataset.page === 'maintenance')
    );
  });
  const labels = {
    overview: 'Overview',
    equipment: 'Equipment',
    'equipment-detail': 'Equipment · ' + (S.selectedEquipment ? (EQUIPMENT.find(e=>e.id===S.selectedEquipment)||{name:''}).name : ''),
    maintenance: 'Maintenance',
    job: 'Maintenance · Active Job',
    schedule: 'Maintenance · Schedule Job',
    history: 'History',
    parts: 'Parts & Inventory',
    templates: 'PM Templates',
    facilities: 'Facilities',
    'facility-detail': 'Facilities · ' + (S.selectedFacility ? (getFacility(S.selectedFacility)||{name:''}).name : ''),
    reports: 'Reports',
  };
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.textContent = labels[S.page] || S.page;
}

function render() {
  const el = document.getElementById('page-content');
  if (!el) return;

  // Gate: unauthenticated users see the login screen
  if (!S.loggedIn) {
    document.body.classList.add('login-mode');
    el.innerHTML = renderLogin();
    attachHandlers();
    return;
  }
  document.body.classList.remove('login-mode');

  const map = {
    overview:           renderOverview,
    equipment:          renderEquipmentList,
    'equipment-detail': renderEquipmentDetail,
    maintenance:        renderMaintenance,
    job:                renderJob,
    schedule:           renderSchedule,
    history:            renderHistory,
    parts:              renderParts,
    templates:          renderTemplates,
    facilities:         renderFacilities,
    'facility-detail':  renderFacilityDetail,
    reports:            renderReports,
  };
  el.innerHTML = (map[S.page] || (() => '<div class="empty-state">Page not found.</div>'))();
  attachHandlers();
  applyAdminVisibility();
  updateNotificationBadge();
  // Close notification panel whenever a fresh render happens (page nav, data change)
  const panel = document.getElementById('notif-panel');
  if (panel && S.notifOpen === false) panel.style.display = 'none';
}

/* ═══════════════════════════════════════════════════════════
   4. UTILITIES
   ═══════════════════════════════════════════════════════════ */

function toast(msg, type = 'success') {
  const wrap = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  const icons = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error:   '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    warn:    '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  };
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px">${icons[type]||icons.info}</svg><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 250); }, 2500);
}

function openModal(html) {
  const bd = document.getElementById('modal-backdrop');
  document.getElementById('modal-inner').innerHTML = html;
  bd.classList.add('open');
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-MY', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtRM(n) {
  return 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits:0 });
}

function statusColor(s) {
  if (s === 'breakdown') return 'breakdown';
  return s === 'overdue' ? 'danger' : s === 'warning' ? 'warning' : s === 'ok' ? 'ok' : s === 'inprogress' ? 'info' : 'neutral';
}

function statusLabel(s) {
  if (s === 'breakdown') return 'Breakdown';
  return s === 'overdue' ? 'Overdue' : s === 'warning' ? 'Due soon' : s === 'ok' ? 'Serviced' : s === 'inprogress' ? 'In progress' : 'Upcoming';
}

function bdSeverityPill(sev) {
  const map = { low:'warning', high:'danger', critical:'breakdown' };
  const labels = { low:'Low severity', high:'High severity', critical:'Critical — safety risk' };
  return pill(labels[sev] || sev, map[sev] || 'neutral');
}

function pill(text, color) {
  return `<span class="pill pill-${color}">${text}</span>`;
}

function applyAdminVisibility() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('off', S.role !== 'admin');
  });
}

function equipIcon(type) {
  const icons = {
    Forklift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
    Excavator:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 12h6l2-8h4l2 4h6v4H2z"/><path d="M2 16h20"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
    'Skid Steer':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6V4M16 6V4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  };
  return icons[type] || icons.Forklift;
}

/* ══════════════════════════════════════════════════════
   CALENDAR HELPERS
   ══════════════════════════════════════════════════════ */

function buildMaintEvents(jobs, history, breakdowns) {
  const events = [];
  jobs.forEach(j => {
    const date = j.started || j.dueDate;
    if (!date) return;
    const isFac = j.entityType === 'facility';
    events.push({
      date,
      title: `${j.equipCode} · ${j.type}`,
      tooltip: `${j.type} — ${j.equipName} (${j.location})`,
      status: j.status,
      equipId: isFac ? null : (j.entityId || j.equipId),
      facilityId: isFac ? j.entityId : null,
      jobId: j.id,
      navPage: j.status === 'inprogress' ? 'job' : (isFac ? 'facility-detail' : 'equipment-detail'),
    });
  });
  history.forEach(h => {
    const isFac = h.entityType === 'facility';
    events.push({
      date: h.date,
      title: `${h.equipCode} · ${h.type}`,
      tooltip: `Completed — ${h.type} by ${h.tech}`,
      status: 'completed',
      equipId: isFac ? null : (h.entityId || h.equipId),
      facilityId: isFac ? h.entityId : null,
      navPage: isFac ? 'facility-detail' : 'equipment-detail',
    });
  });
  breakdowns.forEach(b => {
    const isResolved = b.status === 'resolved';
    events.push({
      date: b.date,
      title: `${b.equipCode} · Breakdown${isResolved ? ' (resolved)' : ''}`,
      tooltip: `${isResolved ? 'Resolved breakdown' : 'Active breakdown'} (${b.severity}) — ${b.description.slice(0,60)}${b.description.length>60?'…':''}`,
      status: isResolved ? 'breakdown-resolved' : 'breakdown',
      equipId: b.equipId,
      navPage: 'equipment-detail',
    });
  });
  return events;
}

function renderCalendar(events, monthOffset) {
  const now         = new Date();
  const viewDate    = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year        = viewDate.getFullYear();
  const month       = viewDate.getMonth();
  const monthName   = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow    = new Date(year, month, 1).getDay();
  const prevLast    = new Date(year, month, 0).getDate();
  const todayStr    = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const byDate = {};
  events.forEach(ev => { (byDate[ev.date] = byDate[ev.date] || []).push(ev); });

  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) cells.push({ day: prevLast - i, outOfMonth: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, outOfMonth: false, date: ds, events: byDate[ds] || [] });
  }
  let t = 1;
  while (cells.length < 42) cells.push({ day: t++, outOfMonth: true });

  const totalInMonth = cells.filter(c => !c.outOfMonth).reduce((s,c) => s + (c.events ? c.events.length : 0), 0);

  return `
    <div class="cal-wrap">
      <div class="cal-hd">
        <div>
          <div class="cal-month">${monthName}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:2px;">${totalInMonth} event${totalInMonth===1?'':'s'} this month</div>
        </div>
        <div class="cal-nav">
          <button class="icon-btn" data-action="cal-prev" title="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="btn btn-sm" data-action="cal-today">Today</button>
          <button class="icon-btn" data-action="cal-next" title="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div class="cal-grid">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        ${cells.map(c => `
          <div class="cal-cell ${c.outOfMonth?'cal-cell-out':''} ${c.date===todayStr?'cal-cell-today':''}">
            <div class="cal-day-num">${c.day}</div>
            ${!c.outOfMonth && c.events ? c.events.slice(0,3).map(ev => `
              <div class="cal-event cal-event-${ev.status}"
                   data-nav="${ev.navPage}"
                   ${ev.equipId ? `data-equip="${ev.equipId}"` : ''}
                   ${ev.facilityId ? `data-facility="${ev.facilityId}"` : ''}
                   ${ev.jobId ? `data-job="${ev.jobId}"` : ''}
                   title="${ev.tooltip.replace(/"/g,'&quot;')}">
                ${ev.title}
              </div>
            `).join('') : ''}
            ${!c.outOfMonth && c.events && c.events.length > 3 ? `<div class="cal-more">+${c.events.length-3} more</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="cal-legend">
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--danger-bg);border-left-color:var(--danger-text);"></span>Overdue</span>
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--warn-bg);border-left-color:var(--warn-text);"></span>Upcoming</span>
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--info-bg);border-left-color:var(--info-text);"></span>In progress</span>
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--ok-bg);border-left-color:var(--ok-text);"></span>Completed</span>
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--bd-bg);border-left-color:var(--bd-text);"></span>Breakdown</span>
        <span class="cal-legend-item"><span class="cal-legend-dot" style="background:var(--neutral-bg);border-left-color:var(--text-3);"></span>Breakdown (resolved)</span>
      </div>
    </div>
  `;
}

/* fuelMonthSlot — which of the last 6 slots does this date fall into? */

function fuelMonthSlot(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const monthsBack = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  const slot = 5 - monthsBack;
  return (slot >= 0 && slot <= 5) ? slot : -1;
}

/* ══════════════════════════════════════════════════════
   NOTIFICATIONS — derived from live data
   ══════════════════════════════════════════════════════ */

function buildNotifications() {
  const items = [];

  // Active breakdowns (highest urgency)
  BREAKDOWNS.filter(b => b.status === 'active').forEach(b => {
    items.push({
      group:   'breakdown',
      title:   `${b.equipName} · active breakdown`,
      sub:     `Reported by ${b.reportedBy} · ${fmtDate(b.date)} ${b.time}`,
      severity:'bd',
      navPage: 'equipment-detail',
      equipId: b.equipId,
    });
  });

  // Jobs blocked by parts shortage
  JOBS.forEach(j => {
    if (j.entityType === 'facility') return;
    const ps = jobPartsSummary(j);
    if (ps.blocked > 0) {
      items.push({
        group:   'blocked',
        title:   `${j.equipName} · ${j.type}`,
        sub:     `Blocked by ${ps.blocked} part${ps.blocked>1?'s':''} — cannot complete`,
        severity:'danger',
        navPage: 'job',
        jobId:   j.id,
      });
    }
  });

  // Overdue jobs
  JOBS.filter(j => j.status === 'overdue').forEach(j => {
    let overdueBy = '';
    if (j.basis === 'time' && j.dueDate) {
      const days = Math.floor((new Date() - new Date(j.dueDate)) / 86400000);
      if (days > 0) overdueBy = ` — ${days} day${days>1?'s':''} late`;
    } else if (j.basis === 'hour' && j.dueHours) {
      const diff = j.currentHours - j.dueHours;
      if (diff > 0) overdueBy = ` — ${diff} hrs past`;
    }
    items.push({
      group:   'overdue',
      title:   `${j.equipName} · ${j.type}`,
      sub:     `Overdue${overdueBy}`,
      severity:'danger',
      navPage: 'job',
      jobId:   j.id,
    });
  });

  // Parts at or below min stock
  PARTS.filter(p => p.stock <= p.minStock && partUsedBy(p.id).length > 0).forEach(p => {
    items.push({
      group:   'parts',
      title:   p.stock === 0 ? `${p.name} · out of stock` : `${p.name} · low stock (${p.stock} ${p.unit})`,
      sub:     `Code ${p.code} · min ${p.minStock} ${p.unit} · used by ${partUsedBy(p.id).length} equipment`,
      severity:p.stock === 0 ? 'danger' : 'warn',
      navPage: 'parts',
    });
  });

  return items;
}

function renderNotificationPanel() {
  const items = buildNotifications();
  if (items.length === 0) {
    return `
      <div class="notif-hd">
        <div>
          <div class="notif-title">Notifications</div>
          <div class="notif-sub">All clear</div>
        </div>
      </div>
      <div class="notif-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.35;margin-bottom:8px;"><polyline points="20 6 9 17 4 12"/></svg>
        <div>No items need attention</div>
        <div style="font-size:11px;color:var(--text-4);margin-top:3px;">Fleet is operational</div>
      </div>
    `;
  }

  const GROUP_CAP = 3;
  const groups = [
    { key:'breakdown', label:'Active breakdowns',      icon:'bd',     viewAllPage:'equipment' },
    { key:'blocked',   label:'Jobs blocked by parts',  icon:'danger', viewAllPage:'maintenance' },
    { key:'overdue',   label:'Overdue jobs',           icon:'danger', viewAllPage:'maintenance' },
    { key:'parts',     label:'Parts alerts',           icon:'warn',   viewAllPage:'parts' },
  ];

  return `
    <div class="notif-hd">
      <div>
        <div class="notif-title">Notifications</div>
        <div class="notif-sub">${items.length} item${items.length>1?'s':''} need${items.length===1?'s':''} attention</div>
      </div>
      <button class="icon-btn" data-action="close-notifs" title="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="notif-body">
      ${groups.map(g => {
        const gitems = items.filter(i => i.group === g.key);
        if (gitems.length === 0) return '';
        const shown = gitems.slice(0, GROUP_CAP);
        const overflow = gitems.length - shown.length;
        return `
          <div class="notif-group">
            <div class="notif-group-hd">
              <span class="notif-group-label notif-group-${g.icon}">${g.label} · ${gitems.length}</span>
            </div>
            ${shown.map(n => `
              <div class="notif-item"
                   data-nav="${n.navPage}"
                   ${n.equipId    ? `data-equip="${n.equipId}"`       : ''}
                   ${n.jobId      ? `data-job="${n.jobId}"`           : ''}
                   ${n.facilityId ? `data-facility="${n.facilityId}"` : ''}>
                <div class="notif-item-dot notif-dot-${n.severity}"></div>
                <div style="min-width:0;flex:1;">
                  <div class="notif-item-title">${n.title}</div>
                  <div class="notif-item-sub">${n.sub}</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:12px;height:12px;color:var(--text-4);"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            `).join('')}
            ${overflow > 0 ? `
              <div class="notif-more" data-nav="${g.viewAllPage}">
                + ${overflow} more ${g.label.toLowerCase()} · view all →
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function updateNotificationBadge() {
  const count = S.loggedIn ? buildNotifications().length : 0;
  const dot = document.getElementById('notif-dot');
  if (!dot) return;
  if (count > 0) {
    dot.textContent = count > 99 ? '99+' : String(count);
    dot.style.display = '';
  } else {
    dot.style.display = 'none';
  }
}

/* debounce — delay execution until N ms after the last call */

function debounce(fn, ms = 400) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

/* bindSearchInput — debounced search with focus restoration after re-render */

function bindSearchInput(inputId, stateKey) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', debounce(e => {
    S[stateKey] = e.target.value;
    render();
    const re = document.getElementById(inputId);
    if (re) {
      re.focus();
      const len = re.value.length;
      try { re.setSelectionRange(len, len); } catch (_) {}
    }
  }, 400));
}

/* exportReportCsv — download maintenance history as CSV */

function exportReportCsv() {
  const headers = ['Date', 'Asset Type', 'Asset Code', 'Asset Name', 'Service Type', 'Technician', 'Duration', 'Cost (RM)', 'Parts Count', 'Notes'];
  const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const rows = HISTORY.map(h => [
    h.date,
    h.entityType || 'equipment',
    h.equipCode || '',
    h.equipName || '',
    h.type || '',
    h.tech || '',
    h.duration || '',
    h.cost == null ? 0 : h.cost,
    h.parts == null ? 0 : h.parts,
    h.notes || '',
  ]);
  const csv = [headers.map(q).join(','), ...rows.map(r => r.map(q).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fems-maintenance-history-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(`Exported ${HISTORY.length} records to CSV`);
}

/* esc — HTML-escape a string for safe interpolation */

function esc(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
