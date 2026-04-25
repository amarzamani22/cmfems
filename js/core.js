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
    users: 'Administration · Users',
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
    users:              renderUsers,
  };
  // Guard: operators can't access admin-only pages. Silently redirect to Overview.
  const adminOnlyPages = ['templates', 'reports', 'users', 'schedule'];
  if (S.role !== 'admin' && adminOnlyPages.includes(S.page)) {
    S.page = 'overview';
  }
  el.innerHTML = (map[S.page] || (() => '<div class="empty-state">Page not found.</div>'))();
  attachHandlers();
  applyAdminVisibility();
  updateNotificationBadge();
  updateNavCounts();
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

/* effectiveStatus — treat an `upcoming` job as `overdue` once its due date/hours has passed.
   The DB column `status` is only updated by user action (Edit job); this derivation keeps
   filters, counts, and badges in sync with reality without needing a server-side cron job. */

function effectiveStatus(j) {
  if (!j) return 'upcoming';
  if (j.status !== 'upcoming') return j.status;
  if (j.basis === 'hour' && j.currentHours != null && j.dueHours != null) {
    // Reaching the due hour itself (current == due) is overdue —
    // the meter has already hit the service threshold and the job needs to be done.
    return j.currentHours >= j.dueHours ? 'overdue' : 'upcoming';
  }
  if (j.dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    return j.dueDate < today ? 'overdue' : 'upcoming';
  }
  return 'upcoming';
}

/* hourJobThreshold — how close (in op hrs) is "due soon" for an hour-based job.
   Scales with recurrence interval (10% of interval, minimum 50 hrs). For non-recurring
   jobs, fall back to 50 hrs. Shared between effectiveEquipmentStatus, overview, and
   notification logic so the warning band is consistent everywhere. */
function hourJobThreshold(j) {
  const interval = j.recurrenceHours && j.recurrenceHours > 0 ? j.recurrenceHours : 0;
  return interval > 0 ? Math.max(50, Math.round(interval * 0.1)) : 50;
}

/* isJobDueSoon — upcoming job within the warning band (next 7 days for time-based,
   within hour threshold for hour-based). Excludes already-overdue jobs. */
function isJobDueSoon(j) {
  if (effectiveStatus(j) !== 'upcoming') return false;
  if (j.basis === 'hour' && j.dueHours != null && j.currentHours != null) {
    const gap = j.dueHours - j.currentHours;
    return gap > 0 && gap <= hourJobThreshold(j);
  }
  if (j.basis === 'time' && j.dueDate) {
    const today = new Date().toISOString().slice(0, 10);
    const weekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return j.dueDate >= today && j.dueDate <= weekStr;
  }
  return false;
}

/* effectiveEquipmentStatus — derive an equipment's health from its jobs + breakdowns.
   Same problem as effectiveStatus: the stored `status` column is only updated on breakdown
   events, so "warning" and "overdue" never auto-appear. This derives them live.
   Priority: breakdown > overdue > warning (due within 7 days / 50 op hrs) > ok. */

function effectiveEquipmentStatus(e) {
  if (!e) return 'ok';
  if (BREAKDOWNS.some(b => b.equipId === e.id && b.status === 'active')) return 'breakdown';
  const eqJobs = JOBS.filter(j => j.equipId === e.id && j.status !== 'completed');
  if (eqJobs.some(j => effectiveStatus(j) === 'overdue')) return 'overdue';
  if (eqJobs.some(j => isJobDueSoon(j))) return 'warning';
  return 'ok';
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
            ${!c.outOfMonth && c.events && c.events.length > 3 ? `<button class="cal-more" data-action="show-cal-day" data-date="${c.date}">+${c.events.length-3} more</button>` : ''}
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

/* fuelMonthlyFor — per-equipment 6-slot monthly litre totals, derived live from FUEL_ENTRIES. */

function fuelMonthlyFor(equipId) {
  const slots = [0, 0, 0, 0, 0, 0];
  for (const fe of FUEL_ENTRIES) {
    if (fe.equipId !== equipId) continue;
    const s = fuelMonthSlot(fe.date);
    if (s >= 0) slots[s] += Number(fe.litres) || 0;
  }
  return slots;
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

  // Overdue jobs (uses effective status so a past-due 'upcoming' job also shows)
  JOBS.filter(j => effectiveStatus(j) === 'overdue').forEach(j => {
    let overdueBy = '';
    if (j.basis === 'time' && j.dueDate) {
      const days = Math.floor((new Date() - new Date(j.dueDate)) / 86400000);
      if (days > 0) overdueBy = ` — ${days} day${days>1?'s':''} late`;
    } else if (j.basis === 'hour' && j.dueHours) {
      const diff = j.currentHours - j.dueHours;
      if (diff > 0) overdueBy = ` — ${diff} hrs past`;
      else if (diff === 0) overdueBy = ' — meter reached due';
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

  // Due-soon jobs — approaching threshold, surface before they slip overdue.
  JOBS.filter(j => isJobDueSoon(j)).forEach(j => {
    let when = '';
    if (j.basis === 'hour' && j.dueHours != null && j.currentHours != null) {
      const gap = j.dueHours - j.currentHours;
      when = `due in ${gap} hr${gap === 1 ? '' : 's'} · ${j.currentHours.toLocaleString()} / ${j.dueHours.toLocaleString()}`;
    } else if (j.basis === 'time' && j.dueDate) {
      const days = Math.round((new Date(j.dueDate) - new Date()) / 86400000);
      when = days === 0 ? 'due today' : `due in ${days} day${days === 1 ? '' : 's'}`;
    }
    items.push({
      group:   'duesoon',
      title:   `${j.equipName} · ${j.type}`,
      sub:     `Due soon — ${when}`,
      severity:'warn',
      navPage: 'job',
      jobId:   j.id,
    });
  });

  // Parts at or below min stock
  PARTS.filter(p => p.stock <= p.minStock && partUsedBy(p.id).length > 0).forEach(p => {
    items.push({
      group:   'parts',
      title:   p.stock === 0 ? `${p.name} · out of stock` : `${p.name} · low stock (${p.stock} ${p.unit})`,
      sub:     `Part no. ${p.code} · min ${p.minStock} ${p.unit} · used by ${partUsedBy(p.id).length} equipment`,
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
        <div style="font-size:11px;color:var(--text-4);margin-top:3px;">All equipment operational</div>
      </div>
    `;
  }

  const GROUP_CAP = 3;
  const groups = [
    { key:'breakdown', label:'Active breakdowns',      icon:'bd',     viewAllPage:'equipment' },
    { key:'blocked',   label:'Jobs blocked by parts',  icon:'danger', viewAllPage:'maintenance' },
    { key:'overdue',   label:'Overdue jobs',           icon:'danger', viewAllPage:'maintenance' },
    { key:'duesoon',   label:'Due soon',               icon:'warn',   viewAllPage:'maintenance' },
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

/* Keep the sidebar nav badges in sync with live data.
   Equipment = total count; Maintenance = items needing attention (overdue + active breakdowns). */

function updateNavCounts() {
  const setBadge = (id, n) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (n > 0) { el.textContent = n > 99 ? '99+' : String(n); el.style.display = ''; }
    else       { el.style.display = 'none'; }
  };
  if (!S.loggedIn) {
    setBadge('nav-count-equipment', 0);
    setBadge('nav-count-maintenance', 0);
    return;
  }
  setBadge('nav-count-equipment', EQUIPMENT.length);
  const overdue    = JOBS.filter(j => effectiveStatus(j) === 'overdue').length;
  const activeBd   = BREAKDOWNS.filter(b => b.status === 'active').length;
  setBadge('nav-count-maintenance', overdue + activeBd);
}

/* confirmAction — promise-based styled confirmation dialog (replacement for native confirm()).
   Stacks on top of the normal modal system with a higher z-index, so it can be called from
   within an existing modal flow (e.g. report-breakdown duplicate warning). */

function confirmAction({ title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'confirm-overlay';
    // Inline critical layout styles as a cache-proof fallback — if styles.css hasn't been
    // refreshed yet, the popup still positions itself correctly as a centered overlay.
    wrap.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.15s ease;';
    const iconBg = danger ? 'background:#fde8e8;color:#c81e1e;' : 'background:#fef3c7;color:#854f0b;';
    wrap.innerHTML = `
      <div class="confirm-backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
      <div class="confirm-box" style="position:relative;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.25);max-width:420px;width:92%;">
        <div class="confirm-hd" style="display:flex;align-items:center;gap:12px;padding:18px 20px 10px;">
          <div class="confirm-icon ${danger ? 'danger' : 'warn'}" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;${iconBg}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="confirm-title" style="font-size:15px;font-weight:600;">${title}</div>
        </div>
        <div class="confirm-body" style="padding:4px 20px 16px;font-size:13px;color:#4b5563;line-height:1.5;">${message}</div>
        <div class="confirm-ft" style="padding:10px 20px 18px;display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn" data-confirm-cancel>${cancelLabel}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm-ok ${danger ? 'style="background:#c81e1e;border-color:#c81e1e;color:white;font-weight:600;"' : ''}>${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    // Fade in — both via class (for stylesheet) and inline style (for cache-proof fallback)
    requestAnimationFrame(() => {
      wrap.classList.add('open');
      wrap.style.opacity = '1';
      wrap.style.pointerEvents = 'auto';
    });

    const close = (result) => {
      wrap.classList.remove('open');
      wrap.style.opacity = '0';
      wrap.style.pointerEvents = 'none';
      setTimeout(() => wrap.remove(), 150);
      resolve(result);
    };
    wrap.querySelector('[data-confirm-cancel]').addEventListener('click', () => close(false));
    wrap.querySelector('[data-confirm-ok]').addEventListener('click',     () => close(true));
    wrap.querySelector('.confirm-backdrop').addEventListener('click',     () => close(false));
    // Autofocus the primary button for keyboard users; Escape cancels.
    setTimeout(() => wrap.querySelector('[data-confirm-ok]').focus(), 20);
    const esc = e => { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(false); } };
    document.addEventListener('keydown', esc);
  });
}

/* showLoader / hideLoader — full-screen spinner overlay shown during long-running work
   (initial data load after login, session restore). Idempotent: safe to call multiple times. */

function showLoader(label = 'Loading…') {
  let el = document.getElementById('app-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-loader';
    el.className = 'app-loader';
    el.innerHTML = `
      <div class="app-loader-box">
        <div class="app-loader-spinner"></div>
        <div class="app-loader-label"></div>
      </div>
    `;
    document.body.appendChild(el);
  }
  el.querySelector('.app-loader-label').textContent = label;
  requestAnimationFrame(() => el.classList.add('visible'));
}

function hideLoader() {
  const el = document.getElementById('app-loader');
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 200);
}

/* renderEmptyZero — renders a "no data yet" empty state with a circular illustration and a primary CTA.
   `iconSvg` is the inner <path>/... markup for a 24x24 stroke-based icon. `ctaHtml` is typically a
   <button data-action="..."> or a <a data-nav="..."> link. Pass `ctaHtml=''` to omit the button (e.g. for ops users). */

function renderEmptyZero({ iconSvg, title, message, ctaHtml = '' }) {
  return `
    <div class="empty-state empty-state-zero">
      <div class="empty-state-illus">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${iconSvg}
        </svg>
      </div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-sub">${message}</div>
      ${ctaHtml ? `<div class="empty-state-cta">${ctaHtml}</div>` : ''}
    </div>
  `;
}

/* downloadCsv — build a CSV blob from rows + headers and trigger a download.
   Quotes every field and escapes embedded quotes/newlines per RFC 4180. */

function downloadCsv(filename, headers, rows) {
  const esc = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.map(esc).join(',')];
  rows.forEach(r => lines.push(headers.map(h => esc(r[h])).join(',')));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
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

/* bindSortBar — wires sort-pill buttons emitted by renderSortBar(). */
function bindSortBar(dataAttr, keyState, dirState) {
  document.querySelectorAll(`[${dataAttr}]`).forEach(btn => {
    btn.addEventListener('click', () => {
      const newKey = btn.getAttribute(dataAttr);
      if (S[keyState] === newKey) {
        S[dirState] = (S[dirState] === 'desc') ? 'asc' : 'desc';
      } else {
        S[keyState] = newKey;
        S[dirState] = 'asc';
      }
      render();
    });
  });
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

/* exportHistoryCsv — exports the active History tab (maintenance / breakdowns / fuel)
   with the current period + filters applied, matching what's visible on screen. */

function exportHistoryCsv() {
  const tab    = S.historyTab    || 'maintenance';
  const period = S.historyPeriod || '3m';
  const assetFilter = S.historyAssetFilter || 'all';
  const search = (S.histSearch || '').toLowerCase();
  const now = new Date();
  const cutoffMap = {
    '1w': new Date(now.getTime() - 7   * 86400000),
    '1m': new Date(now.getTime() - 30  * 86400000),
    '3m': new Date(now.getTime() - 90  * 86400000),
    '1y': new Date(now.getTime() - 365 * 86400000),
  };
  const cutoff = cutoffMap[period] ? cutoffMap[period].toISOString().slice(0, 10) : null;
  const inPeriod = (dateStr) => !cutoff || (dateStr || '') >= cutoff;
  const today = new Date().toISOString().slice(0,10);

  if (tab === 'breakdowns') {
    let rows = BREAKDOWNS.filter(b => inPeriod(b.date));
    if (search) rows = rows.filter(b =>
      b.equipName.toLowerCase().includes(search) ||
      (b.equipCode || '').toLowerCase().includes(search) ||
      (b.description || '').toLowerCase().includes(search) ||
      (b.reportedBy  || '').toLowerCase().includes(search));
    const out = rows.map(b => ({
      Date: b.date, Time: b.time || '',
      EquipmentCode: b.equipCode || '',
      EquipmentName: b.equipName || '',
      Severity: b.severity || '',
      Status:   b.status   || '',
      ReportedBy: b.reportedBy || '',
      Description: b.description || '',
      ResolvedDate: b.resolvedDate || '',
      ResolvedBy:   b.resolvedBy   || '',
      ResolutionNotes: b.resolutionNotes || '',
    }));
    downloadCsv(`fems-breakdowns-${today}.csv`, Object.keys(out[0] || {Date:'',Time:'',EquipmentCode:'',EquipmentName:'',Severity:'',Status:'',ReportedBy:'',Description:'',ResolvedDate:'',ResolvedBy:'',ResolutionNotes:''}), out);
    toast(`Exported ${rows.length} breakdown records`);
    return;
  }

  if (tab === 'fuel') {
    let rows = FUEL_ENTRIES.filter(f => inPeriod(f.date));
    if (search) rows = rows.filter(f =>
      f.equipName.toLowerCase().includes(search) ||
      (f.equipCode   || '').toLowerCase().includes(search) ||
      (f.refuelledBy || '').toLowerCase().includes(search));
    const out = rows.map(f => ({
      Date: f.date,
      EquipmentCode: f.equipCode || '',
      EquipmentName: f.equipName || '',
      Litres: f.litres || 0,
      OperatingHours: f.operatingHours != null ? f.operatingHours : '',
      PricePerLitre:  f.pricePerLitre  != null ? f.pricePerLitre  : '',
      TotalCost:      f.totalCost      != null ? f.totalCost      : '',
      RefuelledBy:    f.refuelledBy    || '',
      Notes:          f.notes          || '',
    }));
    downloadCsv(`fems-fuel-${today}.csv`, Object.keys(out[0] || {Date:'',EquipmentCode:'',EquipmentName:'',Litres:'',OperatingHours:'',PricePerLitre:'',TotalCost:'',RefuelledBy:'',Notes:''}), out);
    toast(`Exported ${rows.length} fuel records`);
    return;
  }

  // Default: maintenance tab
  let rows = HISTORY.filter(h => inPeriod(h.date));
  if (assetFilter !== 'all') rows = rows.filter(h => (h.entityType || 'equipment') === assetFilter);
  if (search) rows = rows.filter(h =>
    h.equipName.toLowerCase().includes(search) ||
    (h.equipCode || '').toLowerCase().includes(search) ||
    h.type.toLowerCase().includes(search) ||
    (h.tech || '').toLowerCase().includes(search));
  const out = rows.map(h => ({
    Date: h.date,
    AssetType: h.entityType || 'equipment',
    AssetCode: h.equipCode || '',
    AssetName: h.equipName || '',
    ServiceType: h.type || '',
    Duration: h.duration || '',
    PartsCount: h.parts || 0,
    PartsCost:  h.partsCost || 0,
    LaborCost:  h.laborCost || 0,
    MiscCost:   h.miscCost  || 0,
    TotalCost:  h.cost      || 0,
    Technician: h.tech      || '',
    Notes:      h.notes     || '',
  }));
  downloadCsv(`fems-maintenance-${today}.csv`, Object.keys(out[0] || {Date:'',AssetType:'',AssetCode:'',AssetName:'',ServiceType:'',Duration:'',PartsCount:'',PartsCost:'',LaborCost:'',MiscCost:'',TotalCost:'',Technician:'',Notes:''}), out);
  toast(`Exported ${rows.length} maintenance records`);
}

/* compressImage — resize + re-encode an image File to a data URL.
   - Scales so the longest edge is at most `maxDim` px
   - Saves as JPEG at `quality` (0..1)
   - Falls back to raw data URL if any step fails */
function compressImage(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Not an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = e => {
      const src = e.target.result;
      const img = new Image();
      img.onerror = () => resolve(src); // fallback: return uncompressed
      img.onload  = () => {
        try {
          let { width, height } = img;
          const longest = Math.max(width, height);
          if (longest > maxDim) {
            const ratio = maxDim / longest;
            width  = Math.round(width  * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // White background for JPEGs (transparent PNGs would go black otherwise)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          resolve(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/* esc — HTML-escape a string for safe interpolation */

function esc(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
