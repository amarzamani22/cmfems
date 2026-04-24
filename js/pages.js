/* ══════════════════════════════════════════════════════
   pages.js — all renderX page functions + card components
   ══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   LOGIN SCREEN
   ═══════════════════════════════════════════════════════════ */

function renderLogin() {
  return `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">
          <img src="logo.png" alt="Car Medic"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="login-logo-fallback" style="display:none;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>
        <div class="login-title">FEMS</div>
        <div class="login-sub">Car Medic · Equipment & Facility Management</div>

        <form id="login-form" style="display:flex;flex-direction:column;gap:12px;margin-top:24px;" autocomplete="off">
          <div class="field">
            <label class="field-label">Email</label>
            <input class="input" type="email" id="login-email" placeholder="you@carmedic.com.my" autocomplete="username" required>
          </div>
          <div class="field">
            <label class="field-label">Password</label>
            <input class="input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required>
          </div>
          <div id="login-error" style="font-size:12px;color:var(--danger-text);display:none;"></div>
          <button class="btn btn-primary" type="submit" style="justify-content:center;font-weight:600;padding:10px;margin-top:4px;">
            Sign in
          </button>
        </form>

        <div class="login-hint">
          <div style="font-weight:600;margin-bottom:4px;">Demo credentials</div>
          <div><strong>Admin</strong> · admin@carmedic.com.my / admin123</div>
          <div><strong>Operator</strong> · ops@carmedic.com.my / ops123</div>
        </div>
      </div>
      <div class="login-footer">© Car Medic · FEMS Prototype</div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   5. OVERVIEW
   ═══════════════════════════════════════════════════════════ */

function renderOverview() {
  // Role-based overview: operators see a task-first view, admins see the analytics dashboard.
  if (S.role !== 'admin') return renderOperatorOverview();
  return renderAdminOverview();
}

/* ═══════════════════════════════════════════════════════════
   OPERATOR OVERVIEW — task-first, big visuals, 2 quick actions
   ═══════════════════════════════════════════════════════════ */

function renderOperatorOverview() {
  const today      = new Date().toISOString().slice(0, 10);
  const name       = S.user ? S.user.name.split(' ')[0] : 'there';
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel  = new Date().toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'long' });

  const activeBreakdowns = BREAKDOWNS.filter(b => b.status === 'active');
  const overdueJobs  = JOBS.filter(j => effectiveStatus(j) === 'overdue');
  const todayJobs    = JOBS.filter(j => j.dueDate === today && effectiveStatus(j) !== 'completed' && effectiveStatus(j) !== 'overdue');
  const inprogJobs   = JOBS.filter(j => j.status === 'inprogress');
  const weekJobs     = JOBS.filter(j => {
    if (effectiveStatus(j) !== 'upcoming') return false;
    if (!j.dueDate || j.dueDate === today) return false;
    const diff = Math.round((new Date(j.dueDate) - new Date()) / 86400000);
    return diff > 0 && diff <= 7;
  });

  const closedToday = HISTORY.filter(h => h.date === today).length;

  const renderJobRow = (j) => {
    const isFac = j.entityType === 'facility';
    const eq = isFac ? FACILITIES.find(x => x.id === j.entityId) : EQUIPMENT.find(x => x.id === (j.entityId || j.equipId));
    const photo = isFac
      ? (eq && eq.photo)
      : (eq && eq.photos && (eq.photos.front || eq.photos.rear || eq.photos.left || eq.photos.right));
    const thumb = photo
      ? `<img src="${photo}" alt="${j.equipName}">`
      : (isFac
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>`
          : equipIcon(eq && eq.type));
    const eStatus = effectiveStatus(j);
    let dueTxt = '';
    if (j.basis === 'hour') {
      const diff = j.currentHours - j.dueHours;
      dueTxt = diff > 0 ? `Overdue ${diff} hrs` : `Due in ${-diff} hrs`;
    } else if (j.dueDate) {
      const diff = Math.round((new Date(j.dueDate) - new Date()) / 86400000);
      dueTxt = diff < 0 ? `Overdue ${-diff}d` : diff === 0 ? 'Due today' : `In ${diff}d`;
    }
    const dueColor = eStatus === 'overdue' ? 'danger' : eStatus === 'inprogress' ? 'info' : 'warning';
    return `
      <a href="#" class="op-task-row" data-nav="job" data-job="${j.id}">
        <div class="op-task-thumb">${thumb}</div>
        <div class="op-task-body">
          <div class="op-task-title">${j.equipName}</div>
          <div class="op-task-meta">${j.type} · ${j.location}</div>
          <div class="op-task-pills">
            ${pill(dueTxt, dueColor)}
            ${eStatus === 'inprogress' ? pill('In progress', 'info') : ''}
          </div>
        </div>
        <svg class="op-task-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
    `;
  };

  return `
    <div class="op-overview">
      <div class="op-greeting">
        <div class="op-greeting-hi">${greeting}, <strong>${name}</strong></div>
        <div class="op-greeting-date">${dateLabel}</div>
      </div>

      <div class="op-actions op-actions-single">
        <button class="op-action-btn op-action-bd" data-action="report-breakdown">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Report Breakdown</span>
        </button>
      </div>

      ${activeBreakdowns.length > 0 ? `
        <div class="op-section op-section-bd">
          <div class="op-section-hd">
            <span class="bd-pulse-dot"></span>
            <span>Active breakdowns</span>
            <span class="op-count op-count-bd">${activeBreakdowns.length}</span>
          </div>
          <div class="op-list">
            ${activeBreakdowns.map(b => {
              const eq = EQUIPMENT.find(x => x.id === b.equipId);
              const photo = eq && eq.photos && (eq.photos.front || eq.photos.rear || eq.photos.left || eq.photos.right);
              const thumb = photo
                ? `<img src="${photo}" alt="${b.equipName}">`
                : equipIcon(eq && eq.type);
              return `
                <a href="#" class="op-task-row op-task-row-bd" data-nav="equipment-detail" data-equip="${b.equipId}">
                  <div class="op-task-thumb">${thumb}</div>
                  <div class="op-task-body">
                    <div class="op-task-title">${b.equipName}</div>
                    <div class="op-task-meta">${b.description.slice(0, 60)}${b.description.length > 60 ? '…' : ''}</div>
                    <div class="op-task-pills">${bdSeverityPill(b.severity)} ${pill(`By ${b.reportedBy} · ${fmtDate(b.date)}`, 'neutral')}</div>
                  </div>
                  <svg class="op-task-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${inprogJobs.length > 0 ? `
        <div class="op-section">
          <div class="op-section-hd">
            <span>Jobs in progress</span>
            <span class="op-count">${inprogJobs.length}</span>
          </div>
          <div class="op-list">${inprogJobs.map(renderJobRow).join('')}</div>
        </div>
      ` : ''}

      ${overdueJobs.length > 0 ? `
        <div class="op-section">
          <div class="op-section-hd">
            <span>Overdue work</span>
            <span class="op-count op-count-bd">${overdueJobs.length}</span>
          </div>
          <div class="op-list">${overdueJobs.map(renderJobRow).join('')}</div>
        </div>
      ` : ''}

      ${todayJobs.length > 0 ? `
        <div class="op-section">
          <div class="op-section-hd">
            <span>Due today</span>
            <span class="op-count">${todayJobs.length}</span>
          </div>
          <div class="op-list">${todayJobs.map(renderJobRow).join('')}</div>
        </div>
      ` : ''}

      ${weekJobs.length > 0 ? `
        <div class="op-section">
          <div class="op-section-hd">
            <span>This week</span>
            <span class="op-count">${weekJobs.length}</span>
          </div>
          <div class="op-list">${weekJobs.slice(0, 5).map(renderJobRow).join('')}</div>
          ${weekJobs.length > 5 ? `<a href="#" data-nav="maintenance" class="op-view-all">View all ${weekJobs.length} upcoming jobs →</a>` : ''}
        </div>
      ` : ''}

      ${(activeBreakdowns.length + inprogJobs.length + overdueJobs.length + todayJobs.length + weekJobs.length) === 0 ? `
        <div class="op-allclear">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:48px;height:48px;opacity:0.5;"><polyline points="20 6 9 17 4 12"/></svg>
          <div class="op-allclear-title">All caught up</div>
          <div class="op-allclear-sub">No overdue jobs, no breakdowns, no work scheduled this week.</div>
        </div>
      ` : ''}

      ${closedToday > 0 ? `
        <div class="op-footer-stat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;color:var(--ok-text);"><polyline points="20 6 9 17 4 12"/></svg>
          <span>You closed <strong>${closedToday}</strong> job${closedToday > 1 ? 's' : ''} today. Nice work.</span>
        </div>
      ` : ''}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   ADMIN OVERVIEW — analytics dashboard (original)
   ═══════════════════════════════════════════════════════════ */

function renderAdminOverview() {
  const breakdown = EQUIPMENT.filter(e => effectiveEquipmentStatus(e) === 'breakdown').length;
  const overdue   = EQUIPMENT.filter(e => effectiveEquipmentStatus(e) === 'overdue').length;
  const warning   = EQUIPMENT.filter(e => effectiveEquipmentStatus(e) === 'warning').length;
  const ok        = EQUIPMENT.filter(e => effectiveEquipmentStatus(e) === 'ok').length;
  const total     = EQUIPMENT.length;
  const dueWeek   = JOBS.filter(j => effectiveStatus(j) === 'upcoming').length;
  const activeBreakdowns = BREAKDOWNS.filter(b => b.status === 'active');
  const partsOut  = PARTS.filter(p => p.stock === 0).length;
  const partsLow  = PARTS.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const partsToReorder = partsOut + partsLow;
  const facilityActive = FACILITIES.filter(f => f.status === 'active').length;

  // Donut: breakdown (crimson), overdue (red), warning (amber), ok (green)
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const pBd   = breakdown / total;
  const pOvrd = overdue   / total;
  const pWarn = warning   / total;
  const pOk   = ok        / total;
  const segments = [
    { pct: pOk,   color: '#0f6e56', offset: 0 },
    { pct: pWarn, color: '#ef9f27', offset: pOk },
    { pct: pOvrd, color: '#e24b4a', offset: pOk + pWarn },
    { pct: pBd,   color: '#c0392b', offset: pOk + pWarn + pOvrd },
  ];
  const donutSvg = `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--neutral-bg)" stroke-width="12"/>
      ${segments.map(seg => {
        if (seg.pct <= 0) return '';
        const dash = seg.pct * circ;
        const gap  = circ - dash;
        const rot  = seg.offset * 360 - 90;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="12"
          stroke-dasharray="${dash} ${gap}" transform="rotate(${rot} ${cx} ${cy})"/>`;
      }).join('')}
    </svg>`;

  const overdueJobs  = JOBS.filter(j => effectiveStatus(j) === 'overdue');
  const upcomingJobs = JOBS.filter(j => effectiveStatus(j) === 'upcoming').slice(0, 4);
  const blockedJobs  = JOBS.filter(j => j.status !== 'completed' && jobPartsSummary(j).blocked > 0);

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Operations Overview</div>
          <div class="page-sub">Module 2 · Maintenance management · ${new Date().toLocaleDateString('en-MY',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div class="page-hd-right">
          <button class="btn bd-report-btn" data-action="report-breakdown" data-equip="">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Report breakdown
          </button>
          <button class="btn btn-primary admin-only" data-nav="schedule">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Schedule job
          </button>
        </div>
      </div>

      ${(() => {
        const attentionCount = activeBreakdowns.length + blockedJobs.length + overdueJobs.length;
        if (attentionCount === 0) return '';
        return `
          <div class="attention-strip mb-16">
            <div class="attention-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>${attentionCount} ${attentionCount===1?'item needs':'items need'} attention</strong>
            </div>
            <div class="attention-pills">
              ${activeBreakdowns.length > 0 ? `
                <button class="att-pill att-pill-breakdown" data-overview-tab="breakdown">
                  <span class="bd-pulse-dot" style="width:7px;height:7px;"></span>
                  ${activeBreakdowns.length} active breakdown${activeBreakdowns.length>1?'s':''}
                </button>
              ` : ''}
              ${blockedJobs.length > 0 ? `
                <a class="att-pill att-pill-blocked" href="#" data-nav="parts">
                  ${blockedJobs.length} blocked by parts
                </a>
              ` : ''}
              ${overdueJobs.length > 0 ? `
                <button class="att-pill att-pill-overdue" data-overview-tab="overdue">
                  ${overdueJobs.length} overdue job${overdueJobs.length>1?'s':''}
                </button>
              ` : ''}
            </div>
          </div>
        `;
      })()}

      <div class="grid-4 mb-16">
        <div class="kpi-card card-click" style="background:var(--bd-bg);border-color:var(--bd-border);color:var(--bd-text);" data-nav="equipment">
          <div class="kpi-label" style="display:flex;align-items:center;gap:6px;">
            ${breakdown > 0 ? '<span class="bd-pulse-dot" style="width:7px;height:7px;"></span>' : ''}
            Breakdown
          </div>
          <div class="kpi-value" style="color:var(--bd-text);">${breakdown}</div>
          <div class="kpi-sub">${breakdown===0?'all equipment operational':'out of service'}</div>
        </div>
        <div class="kpi-card kpi-danger card-click" data-nav="maintenance">
          <div class="kpi-label">Overdue service</div>
          <div class="kpi-value">${overdue}</div>
          <div class="kpi-sub">${overdue===0?'all caught up':'need service now'}</div>
        </div>
        <div class="kpi-card kpi-warning card-click" data-nav="maintenance">
          <div class="kpi-label">Due this week</div>
          <div class="kpi-value">${dueWeek}</div>
          <div class="kpi-sub">upcoming jobs</div>
        </div>
        <div class="kpi-card ${partsToReorder > 0 ? 'kpi-warning' : 'kpi-info'} card-click admin-only" data-nav="parts">
          <div class="kpi-label">Parts to reorder</div>
          <div class="kpi-value">${partsToReorder}</div>
          <div class="kpi-sub">${partsToReorder===0 ? 'stock levels healthy' : `${partsOut} out · ${partsLow} low stock`}</div>
        </div>
      </div>

      <div class="grid-3-1">
        <div>
          ${(() => {
            const tab = S.overviewTab || 'upcoming';
            const upcomingAll = JOBS.filter(j => effectiveStatus(j) === 'upcoming');
            let rows = '';
            let emptyMsg = '';
            if (tab === 'overdue') {
              rows = overdueJobs.map(j => renderJobCard(j)).join('');
              emptyMsg = '✓ No overdue jobs · all caught up';
            } else if (tab === 'breakdown') {
              rows = activeBreakdowns.map(b => renderBreakdownCard(b)).join('');
              emptyMsg = '✓ No active breakdowns · all equipment operational';
            } else {
              rows = upcomingJobs.map(j => renderJobCard(j)).join('');
              emptyMsg = 'No upcoming jobs scheduled in the next 14 days';
            }
            const rowsExist = (tab === 'overdue' && overdueJobs.length > 0) ||
                              (tab === 'breakdown' && activeBreakdowns.length > 0) ||
                              (tab === 'upcoming' && upcomingJobs.length > 0);
            return `
              <div class="section">
                <div class="wq-hd">
                  <div class="wq-tabs">
                    <button class="wq-tab ${tab==='overdue'?'active':''}" data-overview-tab="overdue">
                      Overdue <span class="wq-count ${overdueJobs.length>0?'wq-count-danger':''}">${overdueJobs.length}</span>
                    </button>
                    <button class="wq-tab ${tab==='upcoming'?'active':''}" data-overview-tab="upcoming">
                      Upcoming <span class="wq-count">${upcomingAll.length}</span>
                    </button>
                    <button class="wq-tab ${tab==='breakdown'?'active':''}" data-overview-tab="breakdown">
                      Active breakdowns <span class="wq-count ${activeBreakdowns.length>0?'wq-count-bd':''}">${activeBreakdowns.length}</span>
                    </button>
                  </div>
                  <a href="#" style="font-size:12px;color:var(--accent);text-decoration:none;white-space:nowrap;" data-nav="maintenance">View all →</a>
                </div>
                ${rowsExist ? `
                  <div style="display:flex;flex-direction:column;gap:8px;">${rows}</div>
                  ${tab === 'upcoming' && upcomingAll.length > 4 ? `
                    <a href="#" data-nav="maintenance" style="display:block;text-align:center;font-size:12px;color:var(--accent);text-decoration:none;margin-top:10px;padding:8px;border:0.5px dashed var(--border-2);border-radius:var(--r-md);">
                      + ${upcomingAll.length - 4} more upcoming jobs
                    </a>
                  ` : ''}
                ` : `
                  <div style="text-align:center;padding:32px 16px;font-size:13px;color:var(--text-3);">${emptyMsg}</div>
                `}
              </div>
            `;
          })()}
        </div>

        <div>
          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Equipment health</div>
              <span style="font-size:11px;color:var(--text-3);">${total} unit${total!==1?'s':''}</span>
            </div>
            <div class="fleet-health">
              <div class="donut-wrap">
                ${donutSvg}
                <div class="donut-label">
                  <div class="donut-big">${Math.round((ok/total)*100)}%</div>
                  <div class="donut-small">healthy</div>
                </div>
              </div>
              <div class="health-legend">
                <div class="legend-row">
                  <div class="legend-dot" style="background:#0f6e56"></div>
                  <div class="legend-label">Serviced</div>
                  <div class="legend-val">${ok}</div>
                  <div class="legend-pct">${Math.round(ok/total*100)}%</div>
                </div>
                <div class="legend-row">
                  <div class="legend-dot" style="background:#ef9f27"></div>
                  <div class="legend-label">Due soon</div>
                  <div class="legend-val">${warning}</div>
                  <div class="legend-pct">${Math.round(warning/total*100)}%</div>
                </div>
                <div class="legend-row">
                  <div class="legend-dot" style="background:#e24b4a"></div>
                  <div class="legend-label">Overdue</div>
                  <div class="legend-val">${overdue}</div>
                  <div class="legend-pct">${Math.round(overdue/total*100)}%</div>
                </div>
                <div class="legend-row">
                  <div class="legend-dot" style="background:#c0392b"></div>
                  <div class="legend-label">Breakdown</div>
                  <div class="legend-val">${breakdown}</div>
                  <div class="legend-pct">${Math.round(breakdown/total*100)}%</div>
                </div>
              </div>
            </div>
            <div style="border-top:0.5px solid var(--border);margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;">
              <span style="color:var(--text-3);">Facilities</span>
              <a href="#" data-nav="facilities" style="color:var(--text-2);text-decoration:none;font-weight:500;">${facilityActive} active →</a>
            </div>
          </div>

          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Today's activity</div>
              <span style="font-size:11px;color:var(--text-3);">${fmtDate(new Date().toISOString().slice(0,10))}</span>
            </div>
            ${(() => {
              const today = new Date().toISOString().slice(0,10);
              const events = [];
              HISTORY.filter(h => h.date === today).forEach(h => events.push({
                color: '#0f6e56', dot: '●',
                title: `${h.equipName} · ${h.type}`,
                sub:   `Completed by ${h.tech}`,
              }));
              BREAKDOWNS.filter(b => b.date === today).forEach(b => events.push({
                color: '#c0392b', dot: '●',
                title: `${b.equipName} · breakdown reported`,
                sub:   `By ${b.reportedBy} at ${b.time}`,
              }));
              BREAKDOWNS.filter(b => b.resolvedDate === today && b.status === 'resolved').forEach(b => events.push({
                color: '#0f6e56', dot: '●',
                title: `${b.equipName} · breakdown resolved`,
                sub:   `By ${b.resolvedBy}`,
              }));
              FUEL_ENTRIES.filter(f => f.date === today).forEach(f => events.push({
                color: '#2563eb', dot: '●',
                title: `${f.equipName} · ${f.litres}L fuel logged`,
                sub:   f.refuelledBy ? `By ${f.refuelledBy}` : 'Fuel refuel',
              }));
              if (events.length === 0) {
                return `<div style="text-align:center;padding:16px 8px;font-size:12px;color:var(--text-3);">Quiet day so far — no activity yet.</div>`;
              }
              return `
                <div style="display:flex;flex-direction:column;gap:0;">
                  ${events.slice(0, 5).map((ev, i) => `
                    <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;${i < Math.min(events.length,5)-1 ? 'border-bottom:0.5px solid var(--border)' : ''}">
                      <span style="color:${ev.color};font-size:12px;line-height:18px;">${ev.dot}</span>
                      <div style="min-width:0;flex:1;">
                        <div style="font-size:12px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ev.title}</div>
                        <div style="font-size:10.5px;color:var(--text-3);">${ev.sub}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `;
            })()}
          </div>

          <div class="card admin-only">
            <div class="section-hd-title mb-8">Parts alert</div>
            ${PARTS.filter(p => p.stock <= p.minStock).slice(0,4).map(p => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:0.5px solid var(--border);">
                <div>
                  <div style="font-size:12px;color:var(--text-1);">${p.name}</div>
                  <span class="code">${p.code}</span>
                </div>
                ${p.stock === 0
                  ? pill('Out of stock','danger')
                  : pill(`Low (${p.stock})`, 'warning')}
              </div>
            `).join('')}
            <a href="#" data-nav="parts" style="display:block;font-size:11px;color:var(--accent);text-decoration:none;margin-top:8px;">Manage inventory →</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   JOB CARD COMPONENT
   ═══════════════════════════════════════════════════════════ */
function renderJobCard(j) {
  const eStatus = effectiveStatus(j);
  const color = eStatus === 'overdue' ? 'danger' : eStatus === 'inprogress' ? 'info' : eStatus === 'upcoming' ? (j.priority === 'high' ? 'warning' : 'neutral') : 'neutral';
  let dueText = '';
  if (j.basis === 'hour') {
    const diff = j.currentHours - j.dueHours;
    dueText = diff > 0 ? `Overdue ${diff} hrs` : `Due in ${-diff} hrs`;
  } else if (j.dueDate) {
    const diff = Math.round((new Date(j.dueDate) - new Date()) / 86400000);
    dueText = diff < 0 ? `Overdue ${-diff} day${diff<-1?'s':''}` : diff === 0 ? 'Due today' : `Due in ${diff} day${diff>1?'s':''}`;
  }

  // Resolve thumbnail: equipment photo, facility photo, or placeholder icon.
  const isFac = j.entityType === 'facility';
  let thumbHtml = '';
  if (isFac) {
    const f = FACILITIES.find(x => x.id === j.entityId);
    thumbHtml = (f && f.photo)
      ? `<img src="${f.photo}" alt="${j.equipName}">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>`;
  } else {
    const eq = EQUIPMENT.find(x => x.id === (j.entityId || j.equipId));
    const photo = eq && eq.photos && (eq.photos.front || eq.photos.rear || eq.photos.left || eq.photos.right);
    thumbHtml = photo
      ? `<img src="${photo}" alt="${j.equipName}">`
      : equipIcon(eq && eq.type);
  }

  return `
    <div class="job-card ${color}" data-nav="job" data-job="${j.id}">
      <div class="job-card-thumb">${thumbHtml}</div>
      <div class="job-card-body">
        <div class="job-card-hd">
          <div class="job-card-title">${j.equipName} · ${j.type}</div>
          <span style="font-size:11px;color:var(--text-3);flex-shrink:0;">${j.location}</span>
        </div>
        <div class="job-card-meta">${j.equipCode} · ${j.basis === 'hour' ? `${j.currentHours.toLocaleString()} / ${j.dueHours.toLocaleString()} op hrs` : fmtDate(j.dueDate)}</div>
        ${j.basis === 'hour' ? `
          <div class="progress mb-8">
            <div class="progress-fill" style="width:${Math.min(100, Math.round(j.currentHours/j.dueHours*100))}%;background:${color==='danger'?'var(--danger-text)':color==='warning'?'var(--warn-text)':'var(--ok-text)'};"></div>
          </div>
        ` : ''}
        <div class="job-card-pills">
          ${pill(j.type, 'info')}
          ${pill(dueText, color)}
          ${eStatus === 'inprogress' ? pill('In progress','info') : ''}
          ${(() => {
            const ps = jobPartsSummary(j);
            if (ps.blocked > 0) return pill(`⚠ ${ps.blocked} part${ps.blocked>1?'s':''} missing`, 'danger');
            if (ps.low > 0)     return pill(`${ps.low} part${ps.low>1?'s':''} low`, 'warning');
            return '';
          })()}
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   6. EQUIPMENT LIST
   ═══════════════════════════════════════════════════════════ */

function renderEquipmentList() {
  const locations = [...new Set(EQUIPMENT.map(e => e.location))].sort();
  const types     = [...new Set(EQUIPMENT.map(e => e.type))].sort();

  let filtered = EQUIPMENT;
  if (S.equipSearch) {
    const q = S.equipSearch.toLowerCase();
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) ||
      e.make.toLowerCase().includes(q) ||
      e.model.toLowerCase().includes(q)
    );
  }
  if (S.equipFilters.location !== 'all') filtered = filtered.filter(e => e.location === S.equipFilters.location);
  if (S.equipFilters.type !== 'all')     filtered = filtered.filter(e => e.type === S.equipFilters.type);
  if (S.equipFilters.status !== 'all')   filtered = filtered.filter(e => effectiveEquipmentStatus(e) === S.equipFilters.status);

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Equipment</div>
          <div class="page-sub">${EQUIPMENT.length} equipment across ${locations.length} locations</div>
        </div>
        <div class="page-hd-right">
          <button class="btn btn-primary admin-only" data-action="add-equipment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add equipment
          </button>
        </div>
      </div>

      <div class="toolbar">
        <label class="toolbar-search" style="max-width:280px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="equip-search" placeholder="Search by name, code, make…" value="${S.equipSearch}" autocomplete="off">
        </label>
        <select class="filter-select" id="filter-location">
          <option value="all">All locations</option>
          ${locations.map(l => `<option value="${l}" ${S.equipFilters.location===l?'selected':''}>${l}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-type">
          <option value="all">All types</option>
          ${types.map(t => `<option value="${t}" ${S.equipFilters.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="filter-status">
          <option value="all">All status</option>
          <option value="overdue" ${S.equipFilters.status==='overdue'?'selected':''}>Overdue</option>
          <option value="warning" ${S.equipFilters.status==='warning'?'selected':''}>Due soon</option>
          <option value="ok" ${S.equipFilters.status==='ok'?'selected':''}>Serviced</option>
        </select>
      </div>

      ${filtered.length === 0 ? (EQUIPMENT.length === 0 ? renderEmptyZero({
          iconSvg: `<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
          title: 'No equipment yet',
          message: 'Track forklifts, excavators, and other mobile machinery — with photos, operating hours, maintenance schedules, and breakdown history.',
          ctaHtml: S.role === 'admin' ? `<button class="btn btn-primary" data-action="add-equipment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add your first equipment
          </button>` : '',
        }) : `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <div class="empty-state-title">No equipment matches</div>
          <div class="empty-state-sub">Try adjusting your search or filters.</div>
        </div>
      `) : `
        <div class="grid-3">
          ${filtered.map(e => renderEquipCard(e)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderEquipCard(e) {
  const eStatus = effectiveEquipmentStatus(e);
  const color = statusColor(eStatus);
  const label = statusLabel(eStatus);
  const job   = JOBS.find(j => j.equipId === e.id && (effectiveStatus(j) === 'overdue' || effectiveStatus(j) === 'upcoming'));
  const activeBd = BREAKDOWNS.find(b => b.equipId === e.id && b.status === 'active');
  const isBd = eStatus === 'breakdown';

  const borderStyle = isBd ? 'border-color:var(--bd-border);border-left:3px solid var(--bd-text);' : '';

  const heroPhoto = e.photos && (e.photos.front || e.photos.rear || e.photos.left || e.photos.right);

  return `
    <div class="equip-card" style="${borderStyle}" data-nav="equipment-detail" data-equip="${e.id}">
      <div class="equip-hero ${isBd ? 'hero-bd' : ''}">
        ${heroPhoto
          ? `<img src="${heroPhoto}" alt="${e.name}">`
          : `<div class="equip-hero-placeholder">${equipIcon(e.type)}</div>`}
        <div class="equip-hero-status">
          ${isBd ? '<span class="bd-pulse-dot"></span>' : ''}
          ${pill(label, color)}
        </div>
      </div>
      <div class="equip-card-content">
        <div>
          <div class="equip-name">${e.name}</div>
          <div class="equip-meta"><span class="code">${e.code}</span> · ${e.location}</div>
        </div>
        <div class="equip-card-body">
          <div class="equip-stat-row"><span class="equip-stat-label">Make & model</span><span class="equip-stat-val">${e.make} ${e.model}</span></div>
          <div class="equip-stat-row"><span class="equip-stat-label">Operating hrs</span><span class="equip-stat-val">${e.hours.toLocaleString()} hrs</span></div>

          ${isBd && activeBd ? `
            <div style="margin-top:8px;background:var(--bd-bg);border-radius:var(--r-sm);padding:8px;">
              <div style="font-size:11px;font-weight:600;color:var(--bd-text);margin-bottom:3px;">Active breakdown · ${activeBd.time} by ${activeBd.reportedBy}</div>
              <div style="font-size:11px;color:var(--bd-text);opacity:0.85;line-height:1.4;">${activeBd.description.slice(0,70)}${activeBd.description.length>70?'…':''}</div>
            </div>
          ` : job ? `
            <div style="margin-top:8px;padding-top:6px;border-top:0.5px solid var(--border);">
              <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;">Next service</div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                ${pill(job.type, 'info')}
                ${job.basis === 'hour'
                  ? pill(`${job.currentHours.toLocaleString()} / ${job.dueHours.toLocaleString()} hrs`, color)
                  : pill(fmtDate(job.dueDate), color)}
              </div>
            </div>
          ` : `
            <div style="margin-top:8px;padding-top:6px;border-top:0.5px solid var(--border);font-size:11px;color:var(--ok-text);">
              No upcoming jobs scheduled
            </div>
          `}
        </div>
        <button class="btn btn-sm bd-report-btn" style="color:var(--bd-text);border-color:var(--bd-border);background:var(--bd-bg);align-self:flex-end;"
          data-action="report-breakdown" data-equip="${e.id}"
          onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Report breakdown
        </button>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   7. EQUIPMENT DETAIL
   ═══════════════════════════════════════════════════════════ */

function renderEquipmentDetail() {
  const e = EQUIPMENT.find(eq => eq.id === S.selectedEquipment);
  if (!e) return `<div class="empty-state"><div class="empty-state-title">Equipment not found</div></div>`;

  const eStatus = effectiveEquipmentStatus(e);
  const color = statusColor(eStatus);
  const label = statusLabel(eStatus);
  const fuelLog = fuelMonthlyFor(e.id);
  const maxFuel = Math.max(...fuelLog);
  const equip_jobs  = JOBS.filter(j => j.equipId === e.id);
  const equip_hist  = HISTORY.filter(h => h.equipId === e.id);
  const equip_parts = equipParts(e.id);
  const equip_bds   = BREAKDOWNS.filter(b => b.equipId === e.id);
  const equip_fuel  = FUEL_ENTRIES.filter(f => f.equipId === e.id);
  const activeBd    = equip_bds.find(b => b.status === 'active');
  const isBd        = eStatus === 'breakdown';

  return `
    <div>
      <button class="btn-back" data-nav="equipment">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Equipment
      </button>

      <div class="page-hd">
        <div class="page-hd-left">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="font-size:20px;font-weight:600;">${e.name}</div>
            <span class="code" style="font-size:13px;">${e.code}</span>
            ${isBd ? '<span class="bd-pulse-dot"></span>' : ''}
            ${pill(label, color)}
          </div>
          <div class="page-sub">${e.make} ${e.model} · ${e.fuel} · ${e.location} · ${e.hours.toLocaleString()} op hrs</div>
        </div>
        <div class="page-hd-right">
          <button class="btn bd-report-btn" data-action="report-breakdown" data-equip="${e.id}" style="color:var(--bd-text);border-color:var(--bd-border);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Report breakdown
          </button>
          <button class="btn admin-only" data-action="edit-equipment" data-equip="${e.id}">Edit details</button>
          <button class="btn admin-only" data-action="delete-equipment" data-equip="${e.id}"
            style="color:var(--danger-text);border-color:var(--danger-border);">Delete</button>
          <button class="btn btn-primary admin-only" data-action="schedule-for-equipment" data-equip="${e.id}">Schedule service</button>
        </div>
      </div>

      ${activeBd ? `
        <div class="bd-active-banner mb-16" style="padding:14px 16px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span class="bd-pulse-dot"></span>
              <strong style="font-size:13px;">Active breakdown — equipment out of service</strong>
            </div>
            <div style="font-size:12px;opacity:0.9;line-height:1.5;margin-bottom:8px;">${activeBd.description}</div>
            <div style="display:flex;gap:10px;font-size:11px;opacity:0.8;flex-wrap:wrap;">
              <span>Reported by <strong>${activeBd.reportedBy}</strong></span>
              <span>·</span>
              <span>${fmtDate(activeBd.date)} at ${activeBd.time}</span>
              <span>·</span>
              ${bdSeverityPill(activeBd.severity)}
            </div>
          </div>
          <button class="btn admin-only" data-action="resolve-breakdown" data-bd="${activeBd.id}"
            style="background:var(--bd-text);border-color:var(--bd-text);color:white;white-space:nowrap;flex-shrink:0;">
            Mark resolved
          </button>
        </div>
      ` : ''}

      <div class="grid-2-1">
        <div>
          <div class="card mb-12">
            <div class="section-hd-title mb-12">Specifications</div>
            <div class="spec-grid">
              <div class="spec-item"><div class="spec-label">Make & model</div><div class="spec-val">${e.make} ${e.model}</div></div>
              <div class="spec-item"><div class="spec-label">Equipment code</div><div class="spec-val"><span class="code">${e.code}</span></div></div>
              <div class="spec-item"><div class="spec-label">Fuel type</div><div class="spec-val">${e.fuel}</div></div>
              <div class="spec-item"><div class="spec-label">Capacity</div><div class="spec-val">${e.capacity}</div></div>
              <div class="spec-item"><div class="spec-label">Engine model</div><div class="spec-val">${e.engine}</div></div>
              <div class="spec-item"><div class="spec-label">Location</div><div class="spec-val">${e.location}</div></div>
              <div class="spec-item"><div class="spec-label">Type</div><div class="spec-val">${e.type}</div></div>
              <div class="spec-item"><div class="spec-label">Date of purchase</div><div class="spec-val">${fmtDate(e.purchase)}</div></div>
              <div class="spec-item"><div class="spec-label">Operating hours</div><div class="spec-val">${e.hours.toLocaleString()} hrs</div></div>
            </div>
          </div>

          <div class="card mb-12 admin-only">
            <div class="section-hd mb-12">
              <div class="section-hd-title">Fuel consumption · ${e.fuel.toLowerCase()} · last 6 months</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="fs-11 text-3">litres</span>
                ${e.fuel !== 'Electric' ? `<button class="btn btn-sm admin-only" data-action="log-fuel" data-equip="${e.id}">+ Log fuel</button>` : ''}
              </div>
            </div>
            ${e.fuel === 'Electric' ? `<div style="font-size:12px;color:var(--text-3);">Electric equipment — fuel logging not applicable.</div>` : `
            <div class="bar-chart" style="grid-template-columns:repeat(6,1fr);">
              ${fuelLog.map((v,i) => `
                <div class="bar-col">
                  <div class="bar-val">${v.toLocaleString()}</div>
                  <div class="bar ${i===5?'bar-active':''}" style="height:${Math.round(v/maxFuel*100)}%;background:${i===5?'var(--accent)':'var(--info-bg)'}"></div>
                  <div class="bar-lbl">${MONTHS[i]}</div>
                </div>
              `).join('')}
            </div>
            <div class="chart-footer">
              <span>6-mo total · <strong style="color:var(--text-1)">${fuelLog.reduce((a,b)=>a+b,0).toLocaleString()} L</strong></span>
              <span>Monthly avg · <strong style="color:var(--text-1)">${Math.round(fuelLog.reduce((a,b)=>a+b,0)/6).toLocaleString()} L</strong></span>
            </div>
            ${equip_fuel.length > 0 ? `
              <div style="margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);margin-bottom:8px;">Recent fill-ups</div>
                <div class="table-wrap" style="border-radius:var(--r-md);">
                  <table>
                    <thead><tr><th>Date</th><th>Litres</th><th>Op. hours</th><th>Cost</th><th>By</th></tr></thead>
                    <tbody>
                      ${equip_fuel.slice(0,5).map(f => `
                        <tr>
                          <td>${fmtDate(f.date)}</td>
                          <td><strong>${f.litres.toLocaleString()} L</strong></td>
                          <td>${f.operatingHours ? f.operatingHours.toLocaleString() + ' hrs' : '—'}</td>
                          <td>${f.totalCost ? fmtRM(f.totalCost) : f.pricePerLitre ? `RM ${f.pricePerLitre}/L` : '—'}</td>
                          <td>${f.refuelledBy || '—'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                ${equip_fuel.length > 5 ? `<div style="font-size:11px;color:var(--text-3);margin-top:6px;">${equip_fuel.length - 5} older entries not shown</div>` : ''}
              </div>
            ` : ''}
            `}
          </div>

          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Parts used · this equipment</div>
              <button class="btn btn-sm admin-only" data-action="add-equip-part" data-equip="${e.id}">+ Add part</button>
            </div>
            ${equip_parts.length === 0 ? `<div style="font-size:12px;color:var(--text-3);">${S.role === 'admin' ? 'No parts on record. Click "+ Add part" to register parts used by this equipment.' : 'No parts on record — ask an administrator to register parts for this equipment.'}</div>` : `
              <div class="table-wrap" style="border-radius:var(--r-md);">
                <table>
                  <thead>
                    <tr><th>Part name</th><th>Part number</th><th>Qty / job</th><th>Stock</th><th class="admin-only"></th></tr>
                  </thead>
                  <tbody>
                    ${equip_parts.map(ep => {
                      const p = ep.part;
                      const stockPill =
                        p.stock === 0 ? pill('Out of stock','danger') :
                        p.stock < ep.qty ? pill(`Only ${p.stock} · need ${ep.qty}`,'danger') :
                        p.stock <= p.minStock ? pill(`Low (${p.stock})`,'warning') :
                        pill(`${p.stock} ${p.unit}`,'ok');
                      return `
                        <tr>
                          <td>${p.name}</td>
                          <td><span class="code">${p.code}</span></td>
                          <td style="text-align:center;">${ep.qty} ${p.unit}</td>
                          <td>${stockPill}</td>
                          <td class="admin-only" style="text-align:right;">
                            <div class="kebab-menu" data-kebab-id="ep-${e.id}-${p.id}" style="display:inline-flex;">
                              <button class="kebab-btn" data-kebab-toggle="ep-${e.id}-${p.id}" aria-label="More actions">
                                <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                              </button>
                              <div class="kebab-dropdown">
                                <button class="kebab-item" data-action="edit-equip-part" data-equip="${e.id}" data-part="${p.id}">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                  Edit qty
                                </button>
                                <button class="kebab-item kebab-item-danger" data-action="remove-equip-part" data-equip="${e.id}" data-part="${p.id}">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                  Remove
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <div>
          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Equipment photos</div>
              <span style="font-size:11px;color:var(--text-3);">${e.photos ? Object.values(e.photos).filter(Boolean).length : 0} / 4 uploaded</span>
            </div>
            <div class="photo-grid">
              ${['front','rear','left','right'].map(a => {
                const src = e.photos ? e.photos[a] : null;
                const label = a.charAt(0).toUpperCase() + a.slice(1);
                return src ? `
                  <div class="photo-box photo-filled" data-action="view-photo" data-src="${src}" data-label="${e.name} · ${label}" style="cursor:zoom-in;overflow:hidden;position:relative;padding:0;">
                    <img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);display:block;">
                    <div class="photo-angle-tag">${label}</div>
                  </div>
                ` : `
                <div class="photo-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>${label}</span>
                </div>
              `;
              }).join('')}
            </div>
          </div>

          <div class="card">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Maintenance schedule</div>
              <div class="view-toggle">
                <button class="${S.equipMaintView==='list'?'active':''}" data-equip-maint-view="list" title="List view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                <button class="${S.equipMaintView==='calendar'?'active':''}" data-equip-maint-view="calendar" title="Calendar view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
              </div>
            </div>
            ${S.equipMaintView === 'calendar' ? `
              ${renderCalendar(buildMaintEvents(equip_jobs, equip_hist, equip_bds), S.calMonth)}
            ` : `
              ${equip_jobs.length === 0 ? `<div style="font-size:12px;color:var(--text-3);">No scheduled jobs.</div>` :
                equip_jobs.map((j,i) => `
                  <div class="card-click" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;${i>0?'border-top:0.5px solid var(--border)':''}"
                    data-nav="job" data-job="${j.id}">
                    <div>
                      <div style="font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px;">
                        ${j.type}
                        ${pill(statusLabel(j.status), statusColor(j.status))}
                      </div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:2px;">
                        ${j.basis==='time' ? `Due ${fmtDate(j.dueDate)}` : `Due at ${j.dueHours.toLocaleString()} hrs (now ${j.currentHours.toLocaleString()})`}
                      </div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:12px;font-weight:500;">${fmtRM(j.estCost)}</div>
                      <div style="font-size:11px;color:var(--text-3);">est. cost</div>
                    </div>
                  </div>
                `).join('')
              }
            `}
          </div>

          <div class="card admin-only">
            <div class="section-hd-title mb-8">Maintenance history</div>
            ${equip_hist.length === 0 ? `<div style="font-size:12px;color:var(--text-3);">No history on record.</div>` :
              equip_hist.slice(0,5).map((h,i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;${i>0?'border-top:0.5px solid var(--border)':''}">
                  <div style="min-width:0;flex:1;">
                    <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.type}</div>
                    <div style="font-size:11px;color:var(--text-3);">${fmtDate(h.date)} · ${h.duration || '—'}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;">
                    <div style="font-size:12px;font-weight:500;">${fmtRM(h.cost||0)}</div>
                    <div style="font-size:11px;color:var(--text-3);">${h.tech || '—'}</div>
                  </div>
                </div>
              `).join('')
            }
            ${equip_hist.length > 5 ? `<a href="#" data-nav="history" style="display:block;font-size:11px;color:var(--accent);text-decoration:none;margin-top:8px;">View all ${equip_hist.length} records →</a>` : ''}
          </div>

          <div class="card admin-only" style="${equip_bds.length>0?'border-color:var(--bd-border);':''}">
            <div class="section-hd mb-8">
              <div class="section-hd-title" style="${equip_bds.filter(b=>b.status==='active').length>0?'color:var(--bd-text);':''}">
                Breakdown history
              </div>
              ${equip_bds.filter(b=>b.status==='active').length > 0
                ? `<span class="pill pill-breakdown" style="display:flex;align-items:center;gap:5px;"><span class="bd-pulse-dot" style="width:6px;height:6px;"></span>Active</span>`
                : `<span style="font-size:11px;color:var(--text-3);">${equip_bds.length} total</span>`}
            </div>
            ${equip_bds.length === 0
              ? `<div style="font-size:12px;color:var(--text-3);">No breakdowns on record.</div>`
              : equip_bds.map((b, i) => `
                  <div style="padding:10px 0;${i>0?'border-top:0.5px solid var(--border)':''}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:5px;">
                      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                        ${b.status === 'active'
                          ? `<span class="bd-pulse-dot"></span><span style="font-size:12px;font-weight:600;color:var(--bd-text);">Active</span>`
                          : `<span style="font-size:12px;font-weight:600;color:var(--ok-text);">Resolved</span>`}
                        ${bdSeverityPill(b.severity)}
                      </div>
                      <span style="font-size:11px;color:var(--text-3);white-space:nowrap;">${fmtDate(b.date)} ${b.time}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-1);line-height:1.5;margin-bottom:4px;">${b.description}</div>
                    <div style="font-size:11px;color:var(--text-3);">Reported by ${b.reportedBy}</div>
                    ${b.status === 'resolved' ? `
                      <div style="margin-top:6px;padding:7px 10px;background:var(--ok-bg);border-radius:var(--r-sm);font-size:11px;color:var(--ok-text);margin-bottom:6px;">
                        <strong>Resolved ${fmtDate(b.resolvedDate)}</strong> by ${b.resolvedBy}
                        ${b.resolutionNotes ? `<div style="margin-top:2px;opacity:0.85;">${b.resolutionNotes}</div>` : ''}
                      </div>
                      <div class="kebab-menu admin-only" data-kebab-id="bdh-r-${b.id}">
                        <button class="kebab-btn" data-kebab-toggle="bdh-r-${b.id}" aria-label="More actions">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                        </button>
                        <div class="kebab-dropdown">
                          <button class="kebab-item" data-action="edit-breakdown" data-bd="${b.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Edit report
                          </button>
                          <button class="kebab-item kebab-item-danger" data-action="delete-breakdown" data-bd="${b.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ` : `
                      <div style="margin-top:6px;display:flex;gap:6px;align-items:center;">
                        <button class="btn btn-sm admin-only" data-action="resolve-breakdown" data-bd="${b.id}"
                          style="background:var(--bd-text);border-color:var(--bd-text);color:white;">
                          Mark resolved
                        </button>
                        <div class="kebab-menu admin-only" data-kebab-id="bdh-a-${b.id}">
                          <button class="kebab-btn" data-kebab-toggle="bdh-a-${b.id}" aria-label="More actions">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                          </button>
                          <div class="kebab-dropdown">
                            <button class="kebab-item" data-action="edit-breakdown" data-bd="${b.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              Edit report
                            </button>
                            <button class="kebab-item kebab-item-danger" data-action="delete-breakdown" data-bd="${b.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    `}
                  </div>
                `).join('')
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   8. MAINTENANCE LIST
   ═══════════════════════════════════════════════════════════ */

function renderMaintenance() {
  const all      = JOBS;
  const overdue  = all.filter(j => effectiveStatus(j) === 'overdue');
  const upcoming = all.filter(j => effectiveStatus(j) === 'upcoming');
  const inprog   = all.filter(j => effectiveStatus(j) === 'inprogress');
  const filtered = S.maintFilter === 'all' ? all :
                   S.maintFilter === 'overdue' ? overdue :
                   S.maintFilter === 'upcoming' ? upcoming : inprog;

  const isCal = S.maintView === 'calendar';

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Maintenance</div>
          <div class="page-sub">${overdue.length} overdue · ${upcoming.length} upcoming · ${inprog.length} in progress</div>
        </div>
        <div class="page-hd-right">
          <div class="view-toggle">
            <button class="${S.maintView==='list'?'active':''}" data-maint-view="list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              List
            </button>
            <button class="${S.maintView==='calendar'?'active':''}" data-maint-view="calendar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendar
            </button>
          </div>
          <button class="btn btn-primary admin-only" data-nav="schedule">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Schedule job
          </button>
        </div>
      </div>

      ${isCal ? `
        ${renderCalendar(buildMaintEvents(JOBS, HISTORY, BREAKDOWNS), S.calMonth)}
      ` : `
        <div class="filter-tabs mb-16">
          <button class="filter-tab ${S.maintFilter==='all'?'active':''}" data-mfilter="all">
            All <span class="fc fc-neutral">${all.length}</span>
          </button>
          <button class="filter-tab ${S.maintFilter==='overdue'?'active':''}" data-mfilter="overdue">
            Overdue <span class="fc fc-danger">${overdue.length}</span>
          </button>
          <button class="filter-tab ${S.maintFilter==='upcoming'?'active':''}" data-mfilter="upcoming">
            Upcoming <span class="fc fc-warning">${upcoming.length}</span>
          </button>
          <button class="filter-tab ${S.maintFilter==='inprogress'?'active':''}" data-mfilter="inprogress">
            In progress <span class="fc fc-ok">${inprog.length}</span>
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
            <div class="empty-state-title">All clear</div>
            <div class="empty-state-sub">No jobs in this category</div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${filtered.map(j => renderJobCard(j)).join('')}
          </div>
        `}
      `}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   9. ACTIVE JOB
   ═══════════════════════════════════════════════════════════ */

function renderJob() {
  const j = JOBS.find(x => x.id === S.selectedJob);
  if (!j) return `<div class="empty-state"><div class="empty-state-title">Job not found</div></div>`;

  const isFac = j.entityType === 'facility';
  const cl = getTemplate(j.checklistId);
  const items = cl ? cl.items : [];
  const done  = items.filter(i => S.checks[i.id]).length;
  const pct   = items.length ? Math.round(done / items.length * 100) : 0;
  const allDone = items.length > 0 && done === items.length;

  const pstat = isFac ? { parts: [], blocked: 0, low: 0, total: 0 } : jobPartsSummary(j);

  return `
    <div>
      <button class="btn-back" data-nav="maintenance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Maintenance
      </button>

      <div class="page-hd">
        <div class="page-hd-left">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="font-size:18px;font-weight:600;">${j.equipName} · ${j.type}</div>
            <span class="code" style="font-size:12px;">${j.equipCode}</span>
          </div>
          <div class="page-sub">${j.location} · started ${j.started ? fmtDate(j.started) : 'not started'}</div>
        </div>
        <div class="page-hd-right" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          ${j.status === 'inprogress' ? `
            <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--info-bg);color:var(--info-text);border-radius:var(--r-md);font-size:12px;font-weight:600;">
              <span style="width:7px;height:7px;border-radius:50%;background:var(--info-text);"></span>
              In progress${j.started ? ` · started ${fmtDate(j.started)}` : ''}
            </div>
            <button class="btn btn-sm" data-action="revert-job" data-job="${j.id}" title="Revert to upcoming" style="font-size:11px;color:var(--text-3);">
              Revert
            </button>
          ` : `
            <button class="btn" data-action="start-job" data-job="${j.id}" style="background:var(--info-bg);color:var(--info-text);border-color:var(--info-text);font-weight:600;">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:11px;height:11px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start job
            </button>
          `}
          <button class="btn admin-only" data-action="edit-job" data-job="${j.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            Edit
          </button>
          <button class="btn admin-only" data-action="delete-job" data-job="${j.id}" style="color:var(--danger-text);border-color:var(--danger-border);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6"/></svg>
            Delete
          </button>
        </div>
      </div>

      ${pstat.blocked > 0 ? `
        <div class="alert-banner alert-danger mb-12" style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:13px;margin-bottom:2px;">Job blocked · parts not available</div>
            <div style="font-size:12px;opacity:0.9;">${pstat.blocked} required part${pstat.blocked>1?'s':''} out of stock or insufficient. Order from supplier before completing this job.</div>
          </div>
        </div>
      ` : pstat.low > 0 ? `
        <div class="alert-banner alert-warning mb-12" style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:13px;margin-bottom:2px;">Parts running low</div>
            <div style="font-size:12px;opacity:0.9;">${pstat.low} part${pstat.low>1?'s':''} at or below minimum stock. Reorder soon.</div>
          </div>
        </div>
      ` : ''}

      <div class="card mb-12" style="${allDone ? 'background:var(--ok-bg);border-color:var(--ok-border)' : ''}">
        <div class="flex-between mb-8">
          <span style="font-size:12px;font-weight:500;color:${allDone?'var(--ok-text)':'var(--text-2)'}">
            ${allDone ? '✓ All checks complete · Semua pemeriksaan selesai' : 'Progress'}
          </span>
          <span style="font-size:13px;font-weight:600;">${done} / ${items.length} · ${pct}%</span>
        </div>
        <div class="progress">
          <div class="progress-fill" style="width:${pct}%;background:${allDone?'var(--ok-text)':'var(--accent)'};transition:width 0.5s;"></div>
        </div>
      </div>

      <div class="grid-2">
        <div>
          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">${cl ? cl.name : 'Checklist'} <span style="font-weight:400;color:var(--text-3);font-size:11px;">(${items.length} items)</span></div>
              <span style="font-size:10px;color:var(--text-3);">BM · EN subtitle</span>
            </div>
            ${items.length === 0 ? `
              <div class="alert-banner alert-warning" style="font-size:12px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <div>No checklist template attached to this job.${S.role === 'admin' ? ` Technician will need to use a custom checklist, or <a href="#" data-nav="maintenance" style="color:inherit;font-weight:600;">re-schedule with a template →</a>` : ' Please proceed using a manual inspection — notify an administrator if a checklist template is needed.'}</div>
              </div>
            ` : items.map(i => `
              <div class="cl-item ${S.checks[i.id] ? 'done' : ''}" data-check="${i.id}">
                <div class="cl-check ${S.checks[i.id] ? 'checked' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="cl-text">
                  <div class="cl-bm">${i.bm}</div>
                  <div class="cl-en">${i.en}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          ${isFac ? '' : `
          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Parts readiness · ${pstat.total} required</div>
              ${pstat.blocked > 0 ? `<span class="pill pill-danger">${pstat.blocked} blocked</span>`
                : pstat.low > 0 ? `<span class="pill pill-warning">${pstat.low} low</span>`
                : pstat.total > 0 ? `<span class="pill pill-ok">All in stock</span>`
                : `<span style="font-size:11px;color:var(--text-3);">—</span>`}
            </div>
            ${pstat.total === 0 ? `
              <div style="font-size:12px;color:var(--text-3);">No parts consumed — inspection only.</div>
            ` : pstat.parts.map((rp,i) => {
              const p = rp.part;
              const statusPill =
                rp.status === 'out'          ? pill('Out of stock', 'danger') :
                rp.status === 'insufficient' ? pill(`Only ${p.stock} · need ${rp.qty}`, 'danger') :
                rp.status === 'low'          ? pill(`Low · ${p.stock} left`, 'warning') :
                                               pill(`${p.stock} in stock`, 'ok');
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;${i>0?'border-top:0.5px solid var(--border)':''}">
                  <div style="min-width:0;flex:1;">
                    <div style="font-size:12px;font-weight:500;">${p.name}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                      <span class="code">${p.code}</span>
                      <span style="font-size:11px;color:var(--text-3);">need × ${rp.qty} ${p.unit}</span>
                    </div>
                  </div>
                  <div style="flex-shrink:0;margin-left:8px;">${statusPill}</div>
                </div>
              `;
            }).join('')}
            ${pstat.blocked > 0 ? `
              <div class="alert-banner alert-danger mt-8" style="font-size:11.5px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>Cannot complete job until blocked parts are restocked. Order from supplier by part number.</div>
              </div>
            ` : ''}
          </div>
          `}

          <div class="card mb-12">
            <div class="section-hd-title mb-8">Job details</div>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              <div class="flex-between"><span class="text-3">${isFac?'Facility':'Equipment'}</span><span>${j.equipName}</span></div>
              <div class="flex-between"><span class="text-3">Service type</span><span>${j.type}</span></div>
              <div class="flex-between"><span class="text-3">Trigger basis</span><span>${j.basis === 'hour' ? 'Hour-based' : 'Time-based'}</span></div>
              <div class="flex-between"><span class="text-3">Due</span><span>${j.basis==='hour' ? (j.dueHours||0).toLocaleString()+' hrs' : fmtDate(j.dueDate)}</span></div>
              <div class="flex-between"><span class="text-3">Est. cost</span><span style="font-weight:500;">${fmtRM(j.estCost)}</span></div>
            </div>
          </div>

          ${allDone ? (pstat.blocked > 0 ? `
            <div class="card" style="background:var(--danger-bg);border-color:var(--danger-border);">
              <div class="flex-between">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--danger-text);">Cannot complete · parts missing</div>
                  <div style="font-size:11px;color:var(--danger-text);margin-top:2px;">${pstat.blocked} required part${pstat.blocked>1?'s':''} must be restocked first</div>
                </div>
                <button class="btn" style="background:var(--neutral-bg);color:var(--text-3);cursor:not-allowed;" disabled>
                  Blocked
                </button>
              </div>
            </div>
          ` : `
            <div class="card" style="background:var(--ok-bg);border-color:var(--ok-border);">
              <div class="flex-between">
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--ok-text);">Ready to complete</div>
                  <div style="font-size:11px;color:var(--ok-text);margin-top:2px;">Total cost ${fmtRM(j.estCost)}</div>
                </div>
                <button class="btn btn-success" style="background:#0f6e56;border-color:#0f6e56;color:white;" data-action="complete-job" data-job="${j.id}">
                  Mark complete
                </button>
              </div>
            </div>
          `) : ''}
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   10. SCHEDULE JOB
   ═══════════════════════════════════════════════════════════ */

function renderSchedule() {
  if (!S.scheduleForm) S.scheduleForm = freshScheduleForm();
  const sf = S.scheduleForm;
  const isFacility = sf.entityType === 'facility';
  const e  = (!isFacility && sf.equipId)    ? EQUIPMENT.find(x => x.id === sf.equipId) : null;
  const f  = (isFacility  && sf.facilityId) ? getFacility(sf.facilityId)                : null;
  const selectedEntity = e || f;
  const eqp = e ? equipParts(e.id) : [];

  // Derived: any ticked part that's out or insufficient?
  const tickedStatus = sf.requiredPartIds.map(pid => {
    const ep = eqp.find(x => x.partId === pid);
    if (!ep) return null;
    const p = ep.part;
    if (p.stock === 0)          return { part: p, qty: ep.qty, status: 'out' };
    if (p.stock < ep.qty)       return { part: p, qty: ep.qty, status: 'insufficient' };
    if (p.stock <= p.minStock)  return { part: p, qty: ep.qty, status: 'low' };
    return { part: p, qty: ep.qty, status: 'ok' };
  }).filter(Boolean);
  const blockedCount = tickedStatus.filter(t => t.status === 'out' || t.status === 'insufficient').length;
  const lowCount     = tickedStatus.filter(t => t.status === 'low').length;

  let availableTemplates = [];
  if (isFacility && f)       availableTemplates = activeTemplatesFor(null, sf.type, 'facility', f.type);
  else if (!isFacility && e) availableTemplates = activeTemplatesFor(e.type, sf.type, 'equipment');
  const checklistOptions = [
    { id: '', label: selectedEntity ? (availableTemplates.length === 0 ? 'No template matches — create one in PM Templates' : 'Select template…') : `Select ${isFacility?'facility':'equipment'} first…` },
    ...availableTemplates.map(t => ({ id: t.id, label: `${t.name} (${t.items.length} items)` })),
  ];

  return `
    <div>
      <button class="btn-back" data-nav="maintenance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Maintenance
      </button>

      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">${sf.editJobId ? 'Edit Job' : 'Schedule New Job'}</div>
          <div class="page-sub">${sf.editJobId ? 'Update the details of an existing job' : 'Jadual kerja baru · create a maintenance job'}</div>
        </div>
      </div>

      <div class="grid-3-1">
        <div>
          <div class="card mb-12">
            <div class="section-hd-title mb-12">Job details</div>
            <div class="form-grid">
              <div class="span-2 field">
                <label class="field-label">Schedule for</label>
                <div class="view-toggle" style="display:inline-flex;">
                  <button type="button" class="${!isFacility?'active':''}" data-sched-entity="equipment">Equipment</button>
                  <button type="button" class="${isFacility?'active':''}" data-sched-entity="facility">Facility</button>
                </div>
              </div>
              ${isFacility ? `
                <div class="span-2 field">
                  <label class="field-label">Facility <span class="req">*</span></label>
                  <select class="input" data-sched-field="facilityId">
                    <option value="">Select facility…</option>
                    ${FACILITIES.filter(x => x.status === 'active').map(x => `<option value="${x.id}" ${x.id===sf.facilityId?'selected':''}>${x.name} · ${x.type} · ${x.location}</option>`).join('')}
                  </select>
                </div>
              ` : `
                <div class="span-2 field">
                  <label class="field-label">Equipment <span class="req">*</span></label>
                  <select class="input" data-sched-field="equipId">
                    <option value="">Select equipment…</option>
                    ${EQUIPMENT.map(x => `<option value="${x.id}" ${x.id===sf.equipId?'selected':''}>${x.code} · ${x.name} · ${x.make} ${x.model} · ${x.location}</option>`).join('')}
                  </select>
                </div>
              `}
              <div class="field">
                <label class="field-label">Maintenance type</label>
                <select class="input" data-sched-field="type">
                  ${[...SERVICE_TYPES_FIXED, 'Custom'].map(t => `<option ${sf.type===t?'selected':''}>${t}</option>`).join('')}
                </select>
                ${sf.type === 'Custom' ? `
                  <input class="input" data-sched-field="customType" value="${sf.customType || ''}" placeholder="e.g. Overhaul · Engine Rebuild" style="margin-top:6px;">
                ` : ''}
              </div>
              <div class="field">
                <label class="field-label">Trigger basis</label>
                ${isFacility ? `
                  <input class="input" value="Time-based" disabled style="opacity:0.7;">
                  <div class="field-hint">Facilities are always scheduled by date.</div>
                ` : `
                  <select class="input" data-sched-field="basis">
                    <option value="time" ${sf.basis==='time'?'selected':''}>Time-based</option>
                    <option value="hour" ${sf.basis==='hour'?'selected':''}>Hour-based</option>
                  </select>
                `}
              </div>
              ${sf.basis === 'time' ? `
                <div class="field">
                  <label class="field-label">Due date <span class="req">*</span></label>
                  <input class="input" type="date" value="${sf.dueDate}" data-sched-field="dueDate">
                </div>
              ` : `
                <div class="field">
                  <label class="field-label">Due at (op. hours) <span class="req">*</span></label>
                  <input class="input" type="number" min="0" step="1" placeholder="e.g. 3500" value="${sf.dueHours}" data-sched-field="dueHours">
                </div>
              `}
              <div class="field">
                <label class="field-label">Estimated cost (RM)</label>
                <input class="input" type="number" min="0" step="1" placeholder="e.g. 485" value="${sf.estCost}" data-sched-field="estCost">
                ${!isFacility && e ? (() => {
                  const partsEstimate = sf.requiredPartIds.reduce((sum, pid) => {
                    const ep = eqp.find(x => x.partId === pid);
                    if (!ep) return sum;
                    return sum + ((ep.part.price || 0) * (ep.qty || 1));
                  }, 0);
                  return `<div class="field-hint">Parts subtotal: <strong>${fmtRM(partsEstimate)}</strong> (auto, from selected parts × price). Add labor on top.</div>`;
                })() : ''}
              </div>
              <div class="field">
                <label class="field-label">Checklist template</label>
                <select class="input" data-sched-field="checklistId">
                  ${checklistOptions.map(c => `<option value="${c.id}" ${c.id===sf.checklistId?'selected':''}>${c.label}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          ${isFacility ? '' : `
          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Required parts</div>
              ${e ? `<span style="font-size:11px;color:var(--text-3);">${sf.requiredPartIds.length} of ${eqp.length} selected</span>` : ''}
            </div>
            ${!e ? `
              <div style="font-size:12px;color:var(--text-3);padding:8px 0;">Select equipment first to see its parts.</div>
            ` : eqp.length === 0 ? `
              <div class="alert-banner alert-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <div>This equipment has no parts configured. <a href="#" data-nav="equipment-detail" data-equip="${e.id}" style="color:inherit;font-weight:600;">Add parts on the equipment profile →</a></div>
              </div>
            ` : `
              <div style="font-size:11px;color:var(--text-3);margin-bottom:8px;">
                Tick the parts this job will consume. Stock is checked against inventory.
              </div>
              <div style="display:flex;flex-direction:column;gap:0;">
                ${eqp.map((ep, i) => {
                  const p = ep.part;
                  const checked = sf.requiredPartIds.includes(ep.partId);
                  const stockPill =
                    p.stock === 0 ? pill('Out of stock','danger') :
                    p.stock < ep.qty ? pill(`Only ${p.stock} · need ${ep.qty}`,'danger') :
                    p.stock <= p.minStock ? pill(`Low (${p.stock})`,'warning') :
                    pill(`${p.stock} ${p.unit}`,'ok');
                  return `
                    <label style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;${i>0?'border-top:0.5px solid var(--border)':''}">
                      <input type="checkbox" data-sched-part="${ep.partId}" ${checked?'checked':''} style="width:16px;height:16px;cursor:pointer;flex-shrink:0;">
                      <div style="flex:1;min-width:0;">
                        <div style="font-size:12px;font-weight:500;">${p.name}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                          <span class="code">${p.code}</span>
                          <span style="font-size:11px;color:var(--text-3);">× ${ep.qty} ${p.unit}</span>
                        </div>
                      </div>
                      <div style="flex-shrink:0;">${stockPill}</div>
                    </label>
                  `;
                }).join('')}
              </div>
              ${blockedCount > 0 ? `
                <div class="alert-banner alert-danger mt-8" style="font-size:12px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div><strong>Job will be blocked by parts shortage.</strong> ${blockedCount} part${blockedCount>1?'s':''} not in stock — order from supplier before the job starts.</div>
                </div>
              ` : lowCount > 0 ? `
                <div class="alert-banner alert-warning mt-8" style="font-size:12px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  <div>${lowCount} part${lowCount>1?'s':''} at/below minimum stock. Reorder soon.</div>
                </div>
              ` : ''}
            `}
          </div>
          `}

          <div class="card mb-12">
            <div class="section-hd-title mb-8">Notes</div>
            <textarea class="input" rows="3" placeholder="Any additional notes…" data-sched-field="notes">${sf.notes}</textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn" data-action="cancel-schedule">Cancel</button>
            <button class="btn btn-primary" data-action="save-schedule">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ${sf.editJobId ? 'Save changes' : 'Schedule job'}
            </button>
          </div>
        </div>

        <div>
          <div class="alert-banner alert-info mb-12">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <div>Parts ticked below will be auto-checked against inventory. Operator at the selected location will receive alerts 3 days before the due date.</div>
          </div>

          <div class="card">
            <div class="section-hd-title mb-8">Job summary</div>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              <div class="flex-between"><span class="text-3">${isFacility?'Facility':'Equipment'}</span><span>${selectedEntity ? selectedEntity.name : '—'}</span></div>
              <div class="flex-between"><span class="text-3">Type</span><span>${sf.type}</span></div>
              <div class="flex-between"><span class="text-3">Trigger</span><span>${sf.basis === 'time' ? 'Time-based' : 'Hour-based'}</span></div>
              <div class="flex-between"><span class="text-3">Due</span><span>${sf.basis === 'time' ? (sf.dueDate ? fmtDate(sf.dueDate) : '—') : (sf.dueHours ? sf.dueHours + ' hrs' : '—')}</span></div>
              <div class="flex-between"><span class="text-3">Est. cost</span><span style="font-weight:500;">${sf.estCost ? 'RM ' + sf.estCost : '—'}</span></div>
              <div class="flex-between"><span class="text-3">Parts needed</span><span>${sf.requiredPartIds.length}</span></div>
              ${blockedCount > 0 ? `<div class="flex-between" style="color:var(--danger-text);font-weight:500;"><span>Parts blocked</span><span>${blockedCount}</span></div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   11. HISTORY
   ═══════════════════════════════════════════════════════════ */

function renderHistory() {
  const tab         = S.historyTab         || 'maintenance';
  const period      = S.historyPeriod      || '3m';
  const assetFilter = S.historyAssetFilter || 'all';
  const search      = (S.histSearch || '').toLowerCase();

  // Period cutoff — everything >= cutoff date is "in period"
  const now = new Date();
  const cutoffMap = {
    '1w': new Date(now.getTime() - 7   * 86400000),
    '1m': new Date(now.getTime() - 30  * 86400000),
    '3m': new Date(now.getTime() - 90  * 86400000),
    '1y': new Date(now.getTime() - 365 * 86400000),
  };
  const cutoff = cutoffMap[period] ? cutoffMap[period].toISOString().slice(0, 10) : null;
  const inPeriod = (dateStr) => !cutoff || (dateStr || '') >= cutoff;

  // Pre-filter each dataset by period (used for counts + the active tab view)
  const maintAll = HISTORY.filter(h => inPeriod(h.date));
  const bdAll    = BREAKDOWNS.filter(b => inPeriod(b.date));
  const fuelAll  = FUEL_ENTRIES.filter(f => inPeriod(f.date));

  // Tab-specific list: further filter by search + asset type
  let list;
  if (tab === 'breakdowns') {
    list = bdAll.filter(b => !search ||
      b.equipName.toLowerCase().includes(search) ||
      (b.equipCode || '').toLowerCase().includes(search) ||
      (b.description || '').toLowerCase().includes(search) ||
      (b.reportedBy  || '').toLowerCase().includes(search));
  } else if (tab === 'fuel') {
    list = fuelAll.filter(f => !search ||
      f.equipName.toLowerCase().includes(search) ||
      (f.equipCode   || '').toLowerCase().includes(search) ||
      (f.refuelledBy || '').toLowerCase().includes(search));
  } else {
    list = maintAll;
    if (assetFilter !== 'all') list = list.filter(h => (h.entityType || 'equipment') === assetFilter);
    if (search) list = list.filter(h =>
      h.equipName.toLowerCase().includes(search) ||
      (h.equipCode || '').toLowerCase().includes(search) ||
      h.type.toLowerCase().includes(search) ||
      (h.tech || '').toLowerCase().includes(search));
  }

  const periodLabel = {
    'all': 'all time', '1w': 'last 7 days', '1m': 'last month',
    '3m': 'last 3 months', '1y': 'last year',
  }[period];

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">History</div>
          <div class="page-sub">All maintenance, breakdown, and fuel records · ${periodLabel}</div>
        </div>
        <div class="page-hd-right">
          <button class="btn admin-only" data-action="export-history-csv">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div class="filter-tabs mb-16">
        <button class="filter-tab ${tab==='maintenance'?'active':''}" data-history-tab="maintenance">
          Maintenance <span class="fc fc-neutral">${maintAll.length}</span>
        </button>
        <button class="filter-tab ${tab==='breakdowns'?'active':''}" data-history-tab="breakdowns">
          Breakdowns <span class="fc ${bdAll.some(b => b.status==='active') ? 'fc-danger' : 'fc-neutral'}">${bdAll.length}</span>
        </button>
        <button class="filter-tab ${tab==='fuel'?'active':''}" data-history-tab="fuel">
          Fuel logs <span class="fc fc-neutral">${fuelAll.length}</span>
        </button>
      </div>

      <div class="toolbar mb-12">
        <label class="toolbar-search" style="max-width:300px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="hist-search" placeholder="Search…" value="${S.histSearch||''}" autocomplete="off">
        </label>
        <select class="filter-select" id="hist-period">
          <option value="all" ${period==='all'?'selected':''}>All time</option>
          <option value="1w"  ${period==='1w' ?'selected':''}>Last 7 days</option>
          <option value="1m"  ${period==='1m' ?'selected':''}>Last month</option>
          <option value="3m"  ${period==='3m' ?'selected':''}>Last 3 months</option>
          <option value="1y"  ${period==='1y' ?'selected':''}>Last year</option>
        </select>
        ${tab === 'maintenance' ? `
          <select class="filter-select" id="hist-asset-filter">
            <option value="all"       ${assetFilter==='all'      ?'selected':''}>All assets</option>
            <option value="equipment" ${assetFilter==='equipment'?'selected':''}>Equipment only</option>
            <option value="facility"  ${assetFilter==='facility' ?'selected':''}>Facilities only</option>
          </select>
        ` : ''}
      </div>

      ${tab === 'maintenance' ? renderHistMaintenance(list) :
        tab === 'breakdowns'  ? renderHistBreakdowns(list)  :
                                 renderHistFuel(list)}
    </div>
  `;
}

/* ─── History · Maintenance tab ─── */
function renderHistMaintenance(list) {
  const totalCost  = list.reduce((s,h) => s + (h.cost||0), 0);
  const totalParts = list.reduce((s,h) => s + (h.partsCost||0), 0);
  const totalLabor = list.reduce((s,h) => s + (h.laborCost||0), 0);
  const avgCost    = list.length ? Math.round(totalCost / list.length) : 0;
  const eqCount    = list.filter(h => (h.entityType||'equipment') === 'equipment').length;
  const facCount   = list.filter(h => h.entityType === 'facility').length;

  if (list.length === 0) {
    return `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <div class="empty-state-title">No maintenance records</div>
      <div class="empty-state-sub">Nothing completed in the selected period. Try widening the date range or clearing filters.</div>
    </div>`;
  }

  return `
    <div class="grid-4 mb-16 admin-only">
      <div class="kpi-card kpi-default"><div class="kpi-label">Jobs completed</div><div class="kpi-value">${list.length}</div><div class="kpi-sub">${eqCount} equip · ${facCount} facility</div></div>
      <div class="kpi-card kpi-info"><div class="kpi-label">Total spend</div><div class="kpi-value" style="font-size:20px;">${fmtRM(totalCost)}</div><div class="kpi-sub">P ${fmtRM(totalParts)} · L ${fmtRM(totalLabor)}</div></div>
      <div class="kpi-card kpi-default"><div class="kpi-label">Avg cost / job</div><div class="kpi-value" style="font-size:20px;">${fmtRM(avgCost)}</div><div class="kpi-sub">per completion</div></div>
      <div class="kpi-card kpi-success"><div class="kpi-label">Parts consumed</div><div class="kpi-value">${list.reduce((s,h)=>s+(h.parts||0),0)}</div><div class="kpi-sub">line items total</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Asset</th><th>Service</th><th>Duration</th><th>Parts</th><th>Cost</th><th>Technician</th></tr>
        </thead>
        <tbody>
          ${list.map(h => {
            const isFac = h.entityType === 'facility';
            return `
              <tr>
                <td style="white-space:nowrap;color:var(--text-2);">${fmtDate(h.date)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="pill ${isFac?'pill-info':'pill-neutral'}" style="font-size:9.5px;padding:2px 0;min-width:68px;justify-content:center;flex-shrink:0;">${isFac?'Facility':'Equipment'}</span>
                    <div style="min-width:0;">
                      <div style="font-weight:500;">${h.equipName}</div>
                      ${h.equipCode ? `<span class="code">${h.equipCode}</span>` : ''}
                    </div>
                  </div>
                </td>
                <td>${h.type}</td>
                <td style="color:var(--text-2);">${h.duration || '—'}</td>
                <td style="text-align:center;">${h.parts||0}</td>
                <td style="font-weight:500;" title="Parts: ${fmtRM(h.partsCost||0)} · Labor: ${fmtRM(h.laborCost||0)} · Misc: ${fmtRM(h.miscCost||0)}">
                  ${fmtRM(h.cost)}
                  ${(h.partsCost || h.laborCost || h.miscCost) ? `<div style="font-size:10px;color:var(--text-3);font-weight:400;margin-top:2px;">P ${fmtRM(h.partsCost||0)} · L ${fmtRM(h.laborCost||0)}${h.miscCost ? ' · M ' + fmtRM(h.miscCost) : ''}</div>` : ''}
                </td>
                <td style="color:var(--text-2);">${h.tech || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ─── History · Breakdowns tab ─── */
function renderHistBreakdowns(list) {
  const active   = list.filter(b => b.status === 'active').length;
  const resolved = list.filter(b => b.status === 'resolved').length;
  const avgResolveDays = (() => {
    const r = list.filter(b => b.status === 'resolved' && b.date && b.resolvedDate);
    if (r.length === 0) return null;
    const total = r.reduce((s,b) => s + Math.max(0, (new Date(b.resolvedDate) - new Date(b.date)) / 86400000), 0);
    return Math.round(total / r.length);
  })();
  const byEquip = {};
  list.forEach(b => { byEquip[b.equipName] = (byEquip[b.equipName] || 0) + 1; });
  const worst = Object.entries(byEquip).sort((a,b) => b[1] - a[1])[0];

  if (list.length === 0) {
    return `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
      <div class="empty-state-title">No breakdowns recorded</div>
      <div class="empty-state-sub">Nothing was reported in the selected period — fleet kept operational.</div>
    </div>`;
  }

  return `
    <div class="grid-4 mb-16 admin-only">
      <div class="kpi-card ${active>0?'kpi-danger':'kpi-default'}"><div class="kpi-label">Total breakdowns</div><div class="kpi-value">${list.length}</div><div class="kpi-sub">${active} active · ${resolved} resolved</div></div>
      <div class="kpi-card kpi-default"><div class="kpi-label">Avg time to resolve</div><div class="kpi-value" style="font-size:22px;">${avgResolveDays == null ? '—' : `${avgResolveDays}d`}</div><div class="kpi-sub">from report to fix</div></div>
      <div class="kpi-card kpi-warning"><div class="kpi-label">Most breakdowns</div><div class="kpi-value" style="font-size:14px;line-height:1.3;">${worst ? worst[0] : '—'}</div><div class="kpi-sub">${worst ? worst[1] + ' report' + (worst[1]>1?'s':'') : 'no data'}</div></div>
      <div class="kpi-card kpi-info"><div class="kpi-label">Critical</div><div class="kpi-value">${list.filter(b => b.severity === 'critical').length}</div><div class="kpi-sub">severity · any status</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date · Time</th><th>Equipment</th><th>Severity</th><th>Status</th><th>Reported by</th><th>Resolved by</th><th>Description</th></tr>
        </thead>
        <tbody>
          ${list.map(b => `
            <tr>
              <td style="white-space:nowrap;color:var(--text-2);">${fmtDate(b.date)} <span style="color:var(--text-3);">· ${b.time || ''}</span></td>
              <td>
                <div style="font-weight:500;">${b.equipName}</div>
                ${b.equipCode ? `<span class="code">${b.equipCode}</span>` : ''}
              </td>
              <td>${bdSeverityPill(b.severity)}</td>
              <td>${b.status === 'active' ? pill('Active','danger') : pill('Resolved','ok')}</td>
              <td style="color:var(--text-2);">${b.reportedBy || '—'}</td>
              <td style="color:var(--text-2);">${b.resolvedBy || '—'}</td>
              <td style="color:var(--text-2);max-width:320px;">
                <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${(b.description||'').replace(/"/g,'&quot;')}">${b.description || '—'}</div>
                ${b.resolutionNotes ? `<div style="font-size:10.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${b.resolutionNotes.replace(/"/g,'&quot;')}">→ ${b.resolutionNotes}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ─── History · Fuel tab ─── */
function renderHistFuel(list) {
  const totalLitres = list.reduce((s,f) => s + (f.litres || 0), 0);
  const totalCost   = list.reduce((s,f) => s + (f.totalCost != null ? f.totalCost : (f.litres || 0) * (f.pricePerLitre || 0)), 0);
  const avgPrice    = totalLitres > 0 ? totalCost / totalLitres : 0;
  const byEquip = {};
  list.forEach(f => {
    const k = f.equipName;
    byEquip[k] = byEquip[k] || { litres: 0, cost: 0 };
    byEquip[k].litres += (f.litres || 0);
    byEquip[k].cost   += (f.totalCost != null ? f.totalCost : (f.litres || 0) * (f.pricePerLitre || 0));
  });
  const top = Object.entries(byEquip).sort((a,b) => b[1].litres - a[1].litres)[0];

  if (list.length === 0) {
    return `<div class="empty-state">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><path d="M3 22h12V2H3v20zM15 8h3a2 2 0 012 2v8a2 2 0 01-2 2M9 8V4M9 12h.01"/></svg>
      <div class="empty-state-title">No fuel logged</div>
      <div class="empty-state-sub">No refuel entries in the selected period.</div>
    </div>`;
  }

  return `
    <div class="grid-4 mb-16 admin-only">
      <div class="kpi-card kpi-default"><div class="kpi-label">Total litres</div><div class="kpi-value">${Math.round(totalLitres).toLocaleString()}</div><div class="kpi-sub">${list.length} refuel${list.length>1?'s':''}</div></div>
      <div class="kpi-card kpi-info"><div class="kpi-label">Total fuel cost</div><div class="kpi-value" style="font-size:20px;">${fmtRM(Math.round(totalCost))}</div><div class="kpi-sub">avg RM ${avgPrice.toFixed(2)}/L</div></div>
      <div class="kpi-card kpi-warning"><div class="kpi-label">Top consumer</div><div class="kpi-value" style="font-size:14px;line-height:1.3;">${top ? top[0] : '—'}</div><div class="kpi-sub">${top ? Math.round(top[1].litres) + ' L · ' + fmtRM(Math.round(top[1].cost)) : 'no data'}</div></div>
      <div class="kpi-card kpi-default"><div class="kpi-label">Avg per refuel</div><div class="kpi-value" style="font-size:20px;">${list.length ? Math.round(totalLitres/list.length) : 0} L</div><div class="kpi-sub">${list.length ? fmtRM(Math.round(totalCost/list.length)) : 'RM 0'}</div></div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Date</th><th>Equipment</th><th>Litres</th><th>Price/L</th><th>Total cost</th><th>Op. hours</th><th>Refuelled by</th></tr>
        </thead>
        <tbody>
          ${list.map(f => {
            const cost = f.totalCost != null ? f.totalCost : (f.litres || 0) * (f.pricePerLitre || 0);
            return `
              <tr>
                <td style="white-space:nowrap;color:var(--text-2);">${fmtDate(f.date)}</td>
                <td>
                  <div style="font-weight:500;">${f.equipName}</div>
                  ${f.equipCode ? `<span class="code">${f.equipCode}</span>` : ''}
                </td>
                <td style="text-align:center;font-weight:500;">${(f.litres||0).toLocaleString()} L</td>
                <td style="color:var(--text-2);">${f.pricePerLitre != null ? 'RM ' + f.pricePerLitre.toFixed(2) : '—'}</td>
                <td style="font-weight:500;">${fmtRM(Math.round(cost))}</td>
                <td style="color:var(--text-2);">${f.operatingHours != null ? f.operatingHours.toLocaleString() : '—'}</td>
                <td style="color:var(--text-2);">${f.refuelledBy || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   12. PARTS
   ═══════════════════════════════════════════════════════════ */

function renderParts() {
  // Only show parts that are actually used by at least one equipment
  // Show all parts in the catalog; unused ones are visually flagged in the "Used by" column.
  const categories = [...new Set(PARTS.map(p => p.cat))].sort();
  const inUseCount = PARTS.filter(p => partUsedBy(p.id).length > 0).length;
  let list = PARTS;
  if (S.partsSearch) {
    const q = S.partsSearch.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }
  if (S.partsFilter !== 'all') {
    if (S.partsFilter === 'low')  list = list.filter(p => p.stock > 0 && p.stock <= p.minStock);
    if (S.partsFilter === 'out')  list = list.filter(p => p.stock === 0);
    else if (categories.includes(S.partsFilter)) list = list.filter(p => p.cat === S.partsFilter);
  }
  // Equipment filter — show only parts linked to a specific equipment
  if (S.partsEquipFilter && S.partsEquipFilter !== 'all') {
    const eq = EQUIPMENT.find(e => e.id === S.partsEquipFilter);
    if (eq && Array.isArray(eq.parts)) {
      const linkedPartIds = new Set(eq.parts.map(ep => ep.partId));
      list = list.filter(p => linkedPartIds.has(p.id));
    } else {
      list = [];
    }
  }

  const outCount  = PARTS.filter(p => p.stock === 0).length;
  const lowCount  = PARTS.filter(p => p.stock > 0 && p.stock <= p.minStock).length;

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Parts & Inventory</div>
          <div class="page-sub">${PARTS.length} total · ${inUseCount} in use · ${outCount} out of stock · ${lowCount} low</div>
        </div>
        <div class="page-hd-right">
          <button class="btn btn-primary admin-only" data-action="add-part-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add part
          </button>
        </div>
      </div>

      ${outCount > 0 || lowCount > 0 ? `
        <div class="alert-banner alert-warning mb-16">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div>
            <strong>${outCount} part${outCount!==1?'s':''} out of stock</strong> and <strong>${lowCount} below minimum stock level.</strong>
            ${S.role === 'admin'
              ? 'Use the <strong>Order</strong> button on each row to reorder from the supplier.'
              : 'Please inform an administrator to reorder from the supplier.'}
          </div>
        </div>
      ` : ''}

      <div class="toolbar mb-12">
        <label class="toolbar-search" style="max-width:280px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="parts-search" placeholder="Search parts…" value="${S.partsSearch}" autocomplete="off">
        </label>
        <select class="filter-select" id="parts-filter">
          <option value="all" ${S.partsFilter==='all'?'selected':''}>All categories</option>
          <option value="out" ${S.partsFilter==='out'?'selected':''}>Out of stock</option>
          <option value="low" ${S.partsFilter==='low'?'selected':''}>Low stock</option>
          ${categories.map(c => `<option value="${c}" ${S.partsFilter===c?'selected':''}>${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="parts-equip-filter" title="Show parts linked to a specific equipment">
          <option value="all" ${(!S.partsEquipFilter || S.partsEquipFilter==='all')?'selected':''}>All equipment</option>
          ${EQUIPMENT.map(e => `<option value="${e.id}" ${S.partsEquipFilter===e.id?'selected':''}>${e.code} · ${e.name}</option>`).join('')}
        </select>
      </div>

      ${list.length === 0 ? (PARTS.length === 0 ? renderEmptyZero({
          iconSvg: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>`,
          title: 'No parts in the catalog',
          message: 'Track spare parts used during service — stock levels, minimum reorder points, supplier codes. Attach parts to equipment so jobs know what to deduct.',
          ctaHtml: S.role === 'admin' ? `<button class="btn btn-primary" data-action="add-part-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add your first part
          </button>` : '',
        }) : `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <div class="empty-state-title">No parts match</div>
          <div class="empty-state-sub">Adjust your search or filters — or pick a different equipment.</div>
        </div>`) : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Part name</th>
              <th>Part number</th>
              <th>Category</th>
              <th>Unit price</th>
              <th>Stock</th>
              <th>Min. stock</th>
              <th>Used by</th>
              <th>Stock status</th>
              <th class="admin-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(p => {
              const stockStatus = p.stock === 0 ? ['Out of stock','danger'] : p.stock <= p.minStock ? [`Low (${p.stock})`,'warning'] : [`In stock (${p.stock})`,'ok'];
              const users = partUsedBy(p.id);
              return `
                <tr>
                  <td style="font-weight:500;">${p.name}</td>
                  <td><span class="code">${p.code}</span></td>
                  <td style="color:var(--text-2);">${p.cat}</td>
                  <td>RM ${p.price}</td>
                  <td style="text-align:center;">${p.stock} ${p.unit}</td>
                  <td style="text-align:center;color:var(--text-3);">${p.minStock} ${p.unit}</td>
                  <td title="${users.map(u=>u.name).join(', ')}">
                    ${users.length === 0
                      ? `<span style="color:var(--text-4);font-style:italic;">Unused</span>`
                      : (() => {
                          const chip = u => `<a class="equip-chip" href="#" data-nav="equipment-detail" data-equip="${u.id}" title="${u.name}" style="display:inline-block;padding:2px 6px;border:0.5px solid var(--border-2);border-radius:4px;background:var(--neutral-bg);font-size:10.5px;font-family:var(--font-mono);color:var(--text-2);text-decoration:none;margin:1px 2px 1px 0;">${u.code}</a>`;
                          if (users.length <= 2) return users.map(chip).join('');
                          return users.slice(0,2).map(chip).join('') +
                            `<a href="#" data-action="view-part-compat" data-part="${p.id}" style="font-size:10.5px;color:var(--accent);text-decoration:none;margin-left:2px;">+${users.length - 2} more</a>`;
                        })()
                    }
                  </td>
                  <td>${pill(stockStatus[0], stockStatus[1])}</td>
                  <td class="admin-only">
                    <div style="display:flex;gap:6px;align-items:center;justify-content:flex-end;">
                      <button class="btn btn-sm" data-action="update-stock" data-part="${p.id}">Update stock</button>
                      <a class="btn btn-sm btn-primary" href="https://shopee.com.my/search?keyword=${encodeURIComponent(p.name + ' ' + p.code)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
                        Order
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:11px;height:11px"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                      <div class="kebab-menu" data-kebab-id="part-${p.id}">
                        <button class="kebab-btn" data-kebab-toggle="part-${p.id}" aria-label="More actions">
                          <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                        </button>
                        <div class="kebab-dropdown">
                          <button class="kebab-item" data-action="edit-part-item" data-part="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Edit part
                          </button>
                          <button class="kebab-item kebab-item-danger" data-action="delete-part-item" data-part="${p.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                            Delete part
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   12a. FACILITIES
   ═══════════════════════════════════════════════════════════ */

function renderFacilities() {
  const q = (S.facilitySearch || '').toLowerCase();
  const filterLoc  = S.facilityFilterLocation || 'all';
  const filterType = S.facilityFilterType || 'all';
  const locations = [...new Set(FACILITIES.map(f => f.location))].sort();

  let list = FACILITIES;
  if (q)                       list = list.filter(f => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
  if (filterLoc  !== 'all')    list = list.filter(f => f.location === filterLoc);
  if (filterType !== 'all')    list = list.filter(f => f.type === filterType);

  const activeCount = FACILITIES.filter(f => f.status === 'active').length;
  const totalUnits  = FACILITIES.reduce((s, f) => s + (f.quantity || 1), 0);

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Facilities</div>
          <div class="page-sub">${FACILITIES.length} facilities · ${totalUnits} total units · ${activeCount} active</div>
        </div>
        <div class="page-hd-right">
          <button class="btn btn-primary admin-only" data-action="add-facility">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add facility
          </button>
        </div>
      </div>

      <div class="toolbar mb-12">
        <label class="toolbar-search" style="max-width:280px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="facility-search" placeholder="Search facilities…" value="${S.facilitySearch || ''}" autocomplete="off">
        </label>
        <select class="filter-select" id="facility-filter-loc">
          <option value="all" ${filterLoc==='all'?'selected':''}>All locations</option>
          ${locations.map(l => `<option value="${l}" ${filterLoc===l?'selected':''}>${l}</option>`).join('')}
        </select>
        <select class="filter-select" id="facility-filter-type">
          <option value="all" ${filterType==='all'?'selected':''}>All types</option>
          ${FACILITY_TYPES.map(t => `<option value="${t}" ${filterType===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>

      ${list.length === 0 ? (FACILITIES.length === 0 ? renderEmptyZero({
          iconSvg: `<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>`,
          title: 'No facilities yet',
          message: 'Track fixed workshop infrastructure like air compressors, overhead cranes, fans, and lighting — each with its own monthly check schedule.',
          ctaHtml: S.role === 'admin' ? `<button class="btn btn-primary" data-action="add-facility">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add your first facility
          </button>` : '',
        }) : `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>
          <div class="empty-state-title">No facilities match</div>
          <div class="empty-state-sub">Adjust filters or add a new facility.</div>
        </div>
      `) : `
        <div class="grid-3">
          ${list.map(f => {
            const upcoming = JOBS.filter(j => j.entityType === 'facility' && j.entityId === f.id);
            const history  = HISTORY.filter(h => h.entityType === 'facility' && h.entityId === f.id);
            const nextJob  = upcoming.sort((a,b) => (a.dueDate||'') < (b.dueDate||'') ? -1 : 1)[0];
            const lastHist = history.sort((a,b) => a.date < b.date ? 1 : -1)[0];
            return `
              <div class="equip-card" data-nav="facility-detail" data-facility="${f.id}">
                <div class="equip-hero">
                  ${f.photo
                    ? `<img src="${f.photo}" alt="${f.name}">`
                    : `<div class="equip-hero-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg></div>`}
                  <div class="equip-hero-status">
                    ${pill(f.status==='active'?'Active':'Retired', f.status==='active'?'ok':'neutral')}
                  </div>
                </div>
                <div class="equip-card-content">
                  <div>
                    <div class="equip-name">${f.name}</div>
                    <div class="equip-meta">${f.type} · ${f.location}</div>
                  </div>
                  <div class="equip-card-body">
                    <div class="equip-stat-row"><span class="equip-stat-label">Quantity</span><span class="equip-stat-val">${f.quantity} unit${f.quantity>1?'s':''}</span></div>
                    <div class="equip-stat-row"><span class="equip-stat-label">Installed</span><span class="equip-stat-val">${f.installedDate ? fmtDate(f.installedDate) : '—'}</span></div>
                    <div class="equip-stat-row"><span class="equip-stat-label">Last checked</span><span class="equip-stat-val">${lastHist ? fmtDate(lastHist.date) : 'Never'}</span></div>
                    ${nextJob ? `
                      <div style="margin-top:8px;padding-top:6px;border-top:0.5px solid var(--border);">
                        <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;">Next check</div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                          ${pill(nextJob.type, 'info')}
                          ${pill(nextJob.dueDate ? fmtDate(nextJob.dueDate) : 'TBD', statusColor(nextJob.status))}
                        </div>
                      </div>
                    ` : `
                      <div style="margin-top:8px;padding-top:6px;border-top:0.5px solid var(--border);font-size:11px;color:var(--text-3);">
                        No scheduled check
                      </div>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function renderFacilityDetail() {
  const f = getFacility(S.selectedFacility);
  if (!f) return `<div class="empty-state"><div class="empty-state-title">Facility not found</div></div>`;

  const fac_jobs = JOBS.filter(j => j.entityType === 'facility' && j.entityId === f.id);
  const fac_hist = HISTORY.filter(h => h.entityType === 'facility' && h.entityId === f.id);

  return `
    <div>
      <button class="btn-back" data-nav="facilities">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to Facilities
      </button>

      <div class="page-hd">
        <div class="page-hd-left">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div class="page-title" style="margin:0;">${f.name}</div>
            ${pill(f.status==='active'?'Active':'Retired', f.status==='active'?'ok':'neutral')}
          </div>
          <div class="page-sub">${f.type} · ${f.location} · ${f.quantity} unit${f.quantity>1?'s':''}</div>
        </div>
        <div class="page-hd-right">
          <button class="btn admin-only" data-action="edit-facility" data-facility="${f.id}">Edit details</button>
          <button class="btn admin-only" data-action="delete-facility" data-facility="${f.id}"
            style="color:var(--danger-text);border-color:var(--danger-border);">Delete</button>
          <button class="btn btn-primary admin-only" data-action="schedule-for-facility" data-facility="${f.id}">Schedule check</button>
        </div>
      </div>

      <div class="grid-2-1">
        <div>
          <div class="card mb-12">
            <div class="section-hd-title mb-12">Facility info</div>
            <div class="spec-grid">
              <div class="spec-item"><div class="spec-label">Type</div><div class="spec-val">${f.type}</div></div>
              <div class="spec-item"><div class="spec-label">Location</div><div class="spec-val">${f.location}</div></div>
              <div class="spec-item"><div class="spec-label">Quantity</div><div class="spec-val">${f.quantity} unit${f.quantity>1?'s':''}</div></div>
              <div class="spec-item"><div class="spec-label">Installed</div><div class="spec-val">${f.installedDate ? fmtDate(f.installedDate) : '—'}</div></div>
              <div class="spec-item span-2"><div class="spec-label">Notes</div><div class="spec-val">${f.notes || '—'}</div></div>
            </div>
          </div>

          <div class="card mb-12">
            <div class="section-hd mb-8">
              <div class="section-hd-title">Maintenance schedule</div>
              <div class="view-toggle">
                <button class="${S.equipMaintView==='list'?'active':''}" data-equip-maint-view="list" title="List view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                <button class="${S.equipMaintView==='calendar'?'active':''}" data-equip-maint-view="calendar" title="Calendar view">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
              </div>
            </div>
            ${S.equipMaintView === 'calendar' ? `
              ${renderCalendar(buildMaintEvents(fac_jobs, fac_hist, []), S.calMonth)}
            ` : `
              ${fac_jobs.length === 0 ? `<div style="font-size:12px;color:var(--text-3);">No scheduled checks.</div>` :
                fac_jobs.map((j,i) => `
                  <div class="card-click" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;${i>0?'border-top:0.5px solid var(--border)':''}"
                    data-nav="job" data-job="${j.id}">
                    <div>
                      <div style="font-size:12px;font-weight:500;display:flex;align-items:center;gap:6px;">
                        ${j.type}
                        ${pill(statusLabel(j.status), statusColor(j.status))}
                      </div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:2px;">Due ${fmtDate(j.dueDate)}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:12px;font-weight:500;">${fmtRM(j.estCost||0)}</div>
                      <div style="font-size:11px;color:var(--text-3);">est. cost</div>
                    </div>
                  </div>
                `).join('')
              }
            `}
          </div>

          <div class="card">
            <div class="section-hd-title mb-8">Check history</div>
            ${fac_hist.length === 0 ? `<div style="font-size:12px;color:var(--text-3);">No history on record.</div>` :
              fac_hist.slice(0,5).map((h,i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;${i>0?'border-top:0.5px solid var(--border)':''}">
                  <div style="min-width:0;flex:1;">
                    <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${h.type}</div>
                    <div style="font-size:11px;color:var(--text-3);">${fmtDate(h.date)} · ${h.duration || '—'}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;">
                    <div style="font-size:12px;font-weight:500;">${fmtRM(h.cost||0)}</div>
                    <div style="font-size:11px;color:var(--text-3);">${h.tech || '—'}</div>
                  </div>
                </div>
              `).join('')
            }
            ${fac_hist.length > 5 ? `<a href="#" data-nav="history" style="display:block;font-size:11px;color:var(--accent);text-decoration:none;margin-top:8px;">View all ${fac_hist.length} records →</a>` : ''}
          </div>
        </div>

        <div>
          <div class="card mb-12">
            <div class="section-hd-title mb-8">Photo</div>
            ${f.photo ? `
              <div class="photo-box photo-filled" data-action="view-photo" data-src="${f.photo}" data-label="${f.name}" style="cursor:zoom-in;overflow:hidden;position:relative;padding:0;aspect-ratio:4/3;">
                <img src="${f.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);display:block;">
              </div>
            ` : `
              <div class="photo-box" style="aspect-ratio:4/3;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                <span>No photo uploaded</span>
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   12b. PM TEMPLATES
   ═══════════════════════════════════════════════════════════ */

function renderTemplates() {
  const q = (S.templateSearch || '').toLowerCase();
  const filterEquip   = S.templateFilterEquip   || 'all';
  const filterService = S.templateFilterService || 'all';
  const filterStatus  = S.templateFilterStatus  || 'all';

  let list = TEMPLATES;
  if (q)                       list = list.filter(t => t.name.toLowerCase().includes(q));
  if (filterEquip   !== 'all') list = list.filter(t => t.equipmentType === filterEquip);
  if (filterService !== 'all') list = list.filter(t => t.serviceType   === filterService);
  if (filterStatus  !== 'all') list = list.filter(t => t.status        === filterStatus);

  const activeCount   = TEMPLATES.filter(t => t.status === 'active').length;
  const inactiveCount = TEMPLATES.filter(t => t.status === 'inactive').length;

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">PM Templates</div>
          <div class="page-sub">${TEMPLATES.length} templates · ${activeCount} active · ${inactiveCount} inactive</div>
        </div>
        <div class="page-hd-right">
          <button class="btn btn-primary admin-only" data-action="add-template">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add template
          </button>
        </div>
      </div>

      <div class="toolbar mb-12">
        <label class="toolbar-search" style="max-width:280px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="template-search" placeholder="Search templates…" value="${S.templateSearch || ''}" autocomplete="off">
        </label>
        <select class="filter-select" id="template-filter-equip">
          <option value="all" ${filterEquip==='all'?'selected':''}>All equipment types</option>
          ${EQUIPMENT_TYPES_FOR_TEMPLATE.map(t => `<option value="${t}" ${filterEquip===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="template-filter-service">
          <option value="all" ${filterService==='all'?'selected':''}>All service types</option>
          ${SERVICE_TYPES_FIXED.map(t => `<option value="${t}" ${filterService===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="template-filter-status">
          <option value="all"      ${filterStatus==='all'?'selected':''}>All statuses</option>
          <option value="active"   ${filterStatus==='active'?'selected':''}>Active</option>
          <option value="inactive" ${filterStatus==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>

      ${list.length === 0 ? (TEMPLATES.length === 0 ? renderEmptyZero({
          iconSvg: `<path d="M9 11H3v10h6V11zM21 3h-6v18h6V3zM15 7H9v4h6V7z"/>`,
          title: 'No PM templates yet',
          message: 'Templates are reusable checklists (BM + EN) technicians follow during service. Build them once; jobs inherit them automatically.',
          ctaHtml: S.role === 'admin' ? `<button class="btn btn-primary" data-action="add-template">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create your first template
          </button>` : '',
        }) : `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><path d="M9 11H3v10h6V11zM21 3h-6v18h6V3zM15 7H9v4h6V7z"/></svg>
          <div class="empty-state-title">No templates match</div>
          <div class="empty-state-sub">Adjust filters or add a new template.</div>
        </div>`) : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Equipment type</th>
                <th>Service type</th>
                <th>Items</th>
                <th>Status</th>
                <th class="admin-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(t => {
                const inUseJobs = JOBS.filter(j => j.checklistId === t.id).length;
                return `
                  <tr>
                    <td style="font-weight:500;">
                      <a href="#" data-action="view-template" data-template="${t.id}" style="color:var(--accent);text-decoration:none;">${t.name}</a>
                      ${inUseJobs > 0 ? ` <span class="pill pill-info" style="margin-left:6px;">${inUseJobs} active</span>` : ''}
                    </td>
                    <td style="color:var(--text-2);">${t.equipmentType}</td>
                    <td style="color:var(--text-2);">${t.serviceType}</td>
                    <td style="text-align:center;">${t.items.length}</td>
                    <td>${t.status === 'active' ? pill('Active','ok') : pill('Inactive','neutral')}</td>
                    <td class="admin-only">
                      <div style="display:flex;gap:6px;align-items:center;justify-content:flex-end;">
                        <button class="btn btn-sm" data-action="toggle-template" data-template="${t.id}">
                          ${t.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <div class="kebab-menu" data-kebab-id="tpl-${t.id}">
                          <button class="kebab-btn" data-kebab-toggle="tpl-${t.id}" aria-label="More actions">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                          </button>
                          <div class="kebab-dropdown">
                            <button class="kebab-item" data-action="edit-template" data-template="${t.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              Edit template
                            </button>
                            <button class="kebab-item" data-action="duplicate-template" data-template="${t.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                              Duplicate
                            </button>
                            <button class="kebab-item kebab-item-danger" data-action="delete-template" data-template="${t.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   13. REPORTS
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   USERS · Administration page (admin-only)
   ═══════════════════════════════════════════════════════════ */

function renderUsers() {
  // Access control — ops users can't view this page even if they navigate directly
  if (S.role !== 'admin') {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      <div class="empty-state-title">Admin access required</div>
      <div class="empty-state-sub">User management is restricted to administrators.</div>
    </div>`;
  }

  const q = (S.userSearch || '').toLowerCase();
  const filterRole   = S.userFilterRole   || 'all';
  const filterStatus = S.userFilterStatus || 'all';

  let list = USERS;
  if (q)                       list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  if (filterRole   !== 'all')  list = list.filter(u => u.role === filterRole);
  if (filterStatus !== 'all')  list = list.filter(u => (filterStatus === 'active' ? u.active !== false : u.active === false));

  const adminCount  = USERS.filter(u => u.role === 'admin').length;
  const opsCount    = USERS.filter(u => u.role === 'ops').length;
  const activeCount = USERS.filter(u => u.active !== false).length;

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Users</div>
          <div class="page-sub">${USERS.length} accounts · ${adminCount} admin · ${opsCount} operator · ${activeCount} active</div>
        </div>
        <div class="page-hd-right">
          <button class="btn btn-primary" data-action="add-user">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add user
          </button>
        </div>
      </div>

      <div class="toolbar mb-12">
        <label class="toolbar-search" style="max-width:280px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="search" id="user-search" placeholder="Search users…" value="${S.userSearch || ''}" autocomplete="off">
        </label>
        <select class="filter-select" id="user-filter-role">
          <option value="all"   ${filterRole==='all'?'selected':''}>All roles</option>
          <option value="admin" ${filterRole==='admin'?'selected':''}>Admin</option>
          <option value="ops"   ${filterRole==='ops'?'selected':''}>Operator</option>
        </select>
        <select class="filter-select" id="user-filter-status">
          <option value="all"      ${filterStatus==='all'?'selected':''}>All statuses</option>
          <option value="active"   ${filterStatus==='active'?'selected':''}>Active</option>
          <option value="inactive" ${filterStatus==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>

      ${list.length === 0 ? `
        <div class="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div class="empty-state-title">No users match</div>
          <div class="empty-state-sub">Adjust filters or add a new user.</div>
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:48px;"></th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(u => {
                const isSelf = S.user && S.user.id === u.id;
                const isActive = u.active !== false;
                return `
                  <tr>
                    <td>
                      <div class="sb-avatar" style="width:34px;height:34px;font-size:12px;${u.role==='admin'?'background:var(--ok-bg);color:var(--ok-text);':'background:var(--info-bg);color:var(--info-text);'}">${u.avatar || u.name.slice(0,2).toUpperCase()}</div>
                    </td>
                    <td style="font-weight:500;">
                      ${u.name}
                      ${isSelf ? ` <span class="pill pill-info" style="margin-left:6px;">You</span>` : ''}
                    </td>
                    <td style="color:var(--text-2);">${u.email}</td>
                    <td>${u.role === 'admin' ? pill('Admin','ok') : pill('Operator','info')}</td>
                    <td>${isActive ? pill('Active','ok') : pill('Inactive','neutral')}</td>
                    <td>
                      <div style="display:flex;gap:6px;align-items:center;justify-content:flex-start;">
                        <button class="btn btn-sm" data-action="toggle-user-active" data-user="${u.id}" ${isSelf?'disabled title="Cannot deactivate yourself"':''}>
                          ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <div class="kebab-menu" data-kebab-id="user-${u.id}">
                          <button class="kebab-btn" data-kebab-toggle="user-${u.id}" aria-label="More actions">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                          </button>
                          <div class="kebab-dropdown">
                            <button class="kebab-item" data-action="edit-user" data-user="${u.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              Edit user
                            </button>
                            <button class="kebab-item" data-action="reset-user-password" data-user="${u.id}">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                              Reset password
                            </button>
                            ${!isSelf ? `
                              <button class="kebab-item kebab-item-danger" data-action="delete-user" data-user="${u.id}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                Delete user
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}

      <div style="margin-top:12px;padding:10px 14px;background:var(--neutral-bg);border-radius:var(--r-md);font-size:11px;color:var(--text-3);">
        <strong style="color:var(--text-2);">Note:</strong> passwords are stored as plain text in this prototype.
        Once the database is wired up with PHP, they'll be hashed securely on the server.
      </div>
    </div>
  `;
}

function renderReports() {
  // Real monthly spend — grouped from HISTORY, last 6 months based on today
  const now = new Date();
  const monthBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const iso  = d.toISOString().slice(0,10);
    const isoN = next.toISOString().slice(0,10);
    const bucket = HISTORY.filter(h => h.date >= iso && h.date < isoN);
    monthBuckets.push({
      label:      d.toLocaleString('en-US', { month: 'short' }),
      spend:      bucket.reduce((s,h) => s + (h.cost||0), 0),
      jobs:       bucket.length,
      isCurrent:  i === 0,
    });
  }
  const monthlySpend = monthBuckets.map(m => m.spend);
  const maxSpend     = Math.max(...monthlySpend, 1);
  const totalSpend   = monthlySpend.reduce((a,b) => a+b, 0);
  const avgSpend     = Math.round(totalSpend / 6);
  const thisMonthSpend = monthBuckets[5].spend;
  const prevMonthSpend = monthBuckets[4].spend;
  const monthDelta     = prevMonthSpend === 0 ? 0 : Math.round((thisMonthSpend - prevMonthSpend) / prevMonthSpend * 100);

  // Cost by asset (equipment + facility)
  const byEquip = EQUIPMENT.map(e => ({
    name: e.name, code: e.code, type: 'equipment',
    total: HISTORY.filter(h => h.entityType === 'equipment' && (h.entityId === e.id || h.equipId === e.id)).reduce((s,h) => s+(h.cost||0), 0),
    jobs:  HISTORY.filter(h => h.entityType === 'equipment' && (h.entityId === e.id || h.equipId === e.id)).length,
  })).filter(x => x.total > 0);
  const byFacility = FACILITIES.map(f => ({
    name: f.name, code: f.type, type: 'facility',
    total: HISTORY.filter(h => h.entityType === 'facility' && h.entityId === f.id).reduce((s,h) => s+(h.cost||0), 0),
    jobs:  HISTORY.filter(h => h.entityType === 'facility' && h.entityId === f.id).length,
  })).filter(x => x.total > 0);
  const byAsset = [...byEquip, ...byFacility].sort((a,b) => b.total - a.total);
  const maxAssetCost = Math.max(...byAsset.map(x => x.total), 1);

  // Service type breakdown — dynamic, includes any custom types found in history
  const serviceTypes = [...new Set([...SERVICE_TYPES_FIXED, ...HISTORY.map(h => h.type)])];
  const typeStats = serviceTypes.map(t => ({
    type: t,
    count: HISTORY.filter(h => h.type === t).length,
    cost:  HISTORY.filter(h => h.type === t).reduce((s,h) => s+(h.cost||0), 0),
  })).filter(x => x.count > 0);

  // Breakdown stats
  const bdActive   = BREAKDOWNS.filter(b => b.status === 'active');
  const bdResolved = BREAKDOWNS.filter(b => b.status === 'resolved');
  const avgResolutionDays = bdResolved.length === 0 ? 0 : Math.round(
    bdResolved.reduce((s,b) => {
      const d1 = new Date(b.date);
      const d2 = new Date(b.resolvedDate);
      return s + Math.max(0, (d2 - d1) / 86400000);
    }, 0) / bdResolved.length
  );
  const bdByEquip = {};
  BREAKDOWNS.forEach(b => { bdByEquip[b.equipName] = (bdByEquip[b.equipName] || 0) + 1; });
  const topBdEquip = Object.entries(bdByEquip).sort((a,b) => b[1] - a[1])[0];

  // Totals
  const totalHist  = HISTORY.length;
  const grandSpend = HISTORY.reduce((s,h) => s+(h.cost||0), 0);
  const avgCost    = totalHist === 0 ? 0 : Math.round(grandSpend / totalHist);
  const mostActive = byAsset[0];

  // Service cost breakdown (parts vs labor vs misc)
  const totalPartsSpend = HISTORY.reduce((s,h) => s + (h.partsCost || 0), 0);
  const totalLaborSpend = HISTORY.reduce((s,h) => s + (h.laborCost || 0), 0);
  const totalMiscSpend  = HISTORY.reduce((s,h) => s + (h.miscCost  || 0), 0);
  const hasBreakdown    = (totalPartsSpend + totalLaborSpend + totalMiscSpend) > 0;

  // Fuel consumption stats
  const fuelCostOf = f => f.totalCost != null ? f.totalCost : (f.litres || 0) * (f.pricePerLitre || 0);
  const totalFuelCost  = FUEL_ENTRIES.reduce((s,f) => s + fuelCostOf(f), 0);
  const totalLitres    = FUEL_ENTRIES.reduce((s,f) => s + (f.litres || 0), 0);
  const thisMonthFuel  = FUEL_ENTRIES.filter(f => {
    const d = new Date(f.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s,f) => s + fuelCostOf(f), 0);
  const fuelByEquip = EQUIPMENT.map(e => {
    const entries = FUEL_ENTRIES.filter(f => f.equipId === e.id);
    return {
      name:    e.name,
      code:    e.code,
      litres:  entries.reduce((s,f) => s + (f.litres || 0), 0),
      cost:    entries.reduce((s,f) => s + fuelCostOf(f), 0),
      entries: entries.length,
    };
  }).filter(x => x.cost > 0).sort((a,b) => b.cost - a.cost);
  const maxFuelCost = Math.max(...fuelByEquip.map(x => x.cost), 1);

  return `
    <div>
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">Reports</div>
          <div class="page-sub">Maintenance cost & activity analytics · ${now.toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'})}</div>
        </div>
        <div class="page-hd-right">
          <button class="btn" data-action="export-report">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      <div class="grid-4 mb-16">
        <div class="kpi-card kpi-info">
          <div class="kpi-label">Total spend</div>
          <div class="kpi-value" style="font-size:18px;">${fmtRM(grandSpend)}</div>
          <div class="kpi-sub">${hasBreakdown
            ? `P ${fmtRM(totalPartsSpend)} · L ${fmtRM(totalLaborSpend)}${totalMiscSpend > 0 ? ' · M ' + fmtRM(totalMiscSpend) : ''}`
            : `${totalHist} jobs · all time`}</div>
        </div>
        <div class="kpi-card kpi-default">
          <div class="kpi-label">${now.toLocaleString('en-US',{month:'long'})} spend</div>
          <div class="kpi-value" style="font-size:18px;">${fmtRM(thisMonthSpend)}</div>
          <div class="kpi-sub">${monthDelta === 0 ? 'same as last month' : monthDelta > 0 ? `↑ ${monthDelta}% vs last month` : `↓ ${Math.abs(monthDelta)}% vs last month`}</div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Avg cost / job</div>
          <div class="kpi-value" style="font-size:18px;">${fmtRM(avgCost)}</div>
          <div class="kpi-sub">per completion</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Most serviced</div>
          <div class="kpi-value" style="font-size:13px;line-height:1.3;">${mostActive?.name || '—'}</div>
          <div class="kpi-sub">${mostActive ? `${mostActive.jobs} jobs · ${fmtRM(mostActive.total)}` : 'no data'}</div>
        </div>
      </div>

      <div class="grid-2 mb-16">
        <div class="card">
          <div class="section-hd mb-12">
            <div class="section-hd-title">Monthly spend · last 6 months</div>
            <span class="fs-11 text-3">RM</span>
          </div>
          ${totalSpend === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No maintenance costs recorded in the last 6 months.</div>
          ` : `
            <div class="bar-chart" style="grid-template-columns:repeat(6,1fr);">
              ${monthBuckets.map(m => `
                <div class="bar-col">
                  <div class="bar-val">${m.spend === 0 ? '—' : 'RM '+(m.spend/1000).toFixed(1)+'k'}</div>
                  <div class="bar ${m.isCurrent?'bar-active':''}" style="height:${Math.round(m.spend/maxSpend*100)}%;background:${m.isCurrent?'var(--accent)':'var(--info-bg)'}"></div>
                  <div class="bar-lbl">${m.label}</div>
                </div>
              `).join('')}
            </div>
            <div class="chart-footer">
              <span>6-mo total · <strong style="color:var(--text-1)">${fmtRM(totalSpend)}</strong></span>
              <span>Monthly avg · <strong style="color:var(--text-1)">${fmtRM(avgSpend)}</strong></span>
            </div>
          `}
        </div>

        <div class="card">
          <div class="section-hd mb-12">
            <div class="section-hd-title">Cost by asset · all time</div>
            <span class="fs-11 text-3">${byEquip.length} equip · ${byFacility.length} facility</span>
          </div>
          ${byAsset.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No maintenance history yet.</div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${byAsset.slice(0, 10).map(x => `
                <div>
                  <div class="flex-between mb-4">
                    <span style="font-size:12px;display:flex;align-items:center;gap:6px;">
                      <span class="pill ${x.type==='facility'?'pill-info':'pill-ok'}" style="font-size:9.5px;padding:1px 6px;">${x.type==='facility'?'Facility':'Equipment'}</span>
                      ${x.name}
                    </span>
                    <span style="font-size:12px;font-weight:500;">${fmtRM(x.total)} · ${x.jobs}j</span>
                  </div>
                  <div class="progress" style="height:5px;">
                    <div class="progress-fill" style="width:${Math.round(x.total/maxAssetCost*100)}%;background:${x.type==='facility'?'var(--info-text)':'var(--accent)'};"></div>
                  </div>
                </div>
              `).join('')}
              ${byAsset.length > 10 ? `<div style="font-size:11px;color:var(--text-3);text-align:center;padding-top:4px;">+${byAsset.length - 10} more assets</div>` : ''}
            </div>
          `}
        </div>
      </div>

      <div class="grid-2 mb-16">
        <div class="card">
          <div class="section-hd-title mb-12">Service type breakdown</div>
          ${typeStats.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No completed services yet.</div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${typeStats.map(t => {
                const totalJobs = totalHist || 1;
                const pct = Math.round(t.count / totalJobs * 100);
                return `
                  <div>
                    <div class="flex-between mb-4">
                      <span style="font-size:12px;font-weight:500;">${t.type}</span>
                      <span style="font-size:12px;color:var(--text-3);">${t.count} job${t.count>1?'s':''} · ${fmtRM(t.cost)}</span>
                    </div>
                    <div class="progress" style="height:5px;">
                      <div class="progress-fill" style="width:${pct}%;background:var(--info-text);"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <div class="section-hd mb-12">
            <div class="section-hd-title">Breakdown statistics</div>
            <span class="fs-11 text-3">${BREAKDOWNS.length} total</span>
          </div>
          ${BREAKDOWNS.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No breakdowns on record.</div>
          ` : `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div style="background:var(--bd-bg);border-radius:var(--r-md);padding:10px 12px;">
                <div style="font-size:11px;color:var(--bd-text);font-weight:500;">Active</div>
                <div style="font-size:22px;font-weight:700;color:var(--bd-text);">${bdActive.length}</div>
              </div>
              <div style="background:var(--ok-bg);border-radius:var(--r-md);padding:10px 12px;">
                <div style="font-size:11px;color:var(--ok-text);font-weight:500;">Resolved</div>
                <div style="font-size:22px;font-weight:700;color:var(--ok-text);">${bdResolved.length}</div>
              </div>
            </div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:6px;">
              <div class="flex-between"><span class="text-3">Avg resolution time</span><span style="font-weight:500;">${avgResolutionDays} day${avgResolutionDays===1?'':'s'}</span></div>
              <div class="flex-between"><span class="text-3">Most affected</span><span style="font-weight:500;">${topBdEquip ? `${topBdEquip[0]} (${topBdEquip[1]})` : '—'}</span></div>
              <div class="flex-between"><span class="text-3">Critical severity</span><span style="font-weight:500;">${BREAKDOWNS.filter(b=>b.severity==='critical').length}</span></div>
              <div class="flex-between"><span class="text-3">High severity</span><span style="font-weight:500;">${BREAKDOWNS.filter(b=>b.severity==='high').length}</span></div>
            </div>
          `}
        </div>
      </div>

      <div class="grid-2 mb-16">
        <div class="card">
          <div class="section-hd mb-12">
            <div class="section-hd-title">Fuel consumption</div>
            <span class="fs-11 text-3">${FUEL_ENTRIES.length} refuels logged</span>
          </div>
          ${FUEL_ENTRIES.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No fuel entries recorded yet.</div>
          ` : `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div style="background:var(--info-bg);border-radius:var(--r-md);padding:10px 12px;">
                <div style="font-size:11px;color:var(--info-text);font-weight:500;">Total fuel spend</div>
                <div style="font-size:22px;font-weight:700;color:var(--info-text);">${fmtRM(Math.round(totalFuelCost))}</div>
              </div>
              <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:10px 12px;">
                <div style="font-size:11px;color:var(--text-3);font-weight:500;">Total litres used</div>
                <div style="font-size:22px;font-weight:700;color:var(--text-1);">${totalLitres.toLocaleString()} L</div>
              </div>
            </div>
            <div style="font-size:12px;display:flex;flex-direction:column;gap:6px;">
              <div class="flex-between"><span class="text-3">${now.toLocaleString('en-US',{month:'long'})} fuel spend</span><span style="font-weight:500;">${fmtRM(Math.round(thisMonthFuel))}</span></div>
              <div class="flex-between"><span class="text-3">Avg cost / litre</span><span style="font-weight:500;">${totalLitres > 0 ? 'RM ' + (totalFuelCost / totalLitres).toFixed(2) : '—'}</span></div>
              <div class="flex-between"><span class="text-3">Combined operating cost</span><span style="font-weight:500;color:var(--accent);">${fmtRM(Math.round(grandSpend + totalFuelCost))}</span></div>
            </div>
            <div style="font-size:10.5px;color:var(--text-4);margin-top:10px;padding-top:8px;border-top:0.5px dashed var(--border);">
              Combined = maintenance spend + fuel cost
            </div>
          `}
        </div>

        <div class="card">
          <div class="section-hd mb-12">
            <div class="section-hd-title">Top fuel users</div>
            <span class="fs-11 text-3">all time</span>
          </div>
          ${fuelByEquip.length === 0 ? `
            <div style="text-align:center;padding:40px 20px;font-size:12px;color:var(--text-3);">No fuel entries to analyse.</div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${fuelByEquip.slice(0,6).map(e => `
                <div>
                  <div class="flex-between mb-4">
                    <span style="font-size:12px;">${e.name}</span>
                    <span style="font-size:12px;font-weight:500;">${fmtRM(Math.round(e.cost))} · ${e.litres.toLocaleString()}L</span>
                  </div>
                  <div class="progress" style="height:5px;">
                    <div class="progress-fill" style="width:${Math.round(e.cost/maxFuelCost*100)}%;background:var(--info-text);"></div>
                  </div>
                </div>
              `).join('')}
              ${fuelByEquip.length > 6 ? `<div style="font-size:11px;color:var(--text-3);text-align:center;padding-top:4px;">+${fuelByEquip.length - 6} more equipment</div>` : ''}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function monthSpendCurrent() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  return HISTORY.filter(h => h.date >= first).reduce((s,h) => s+(h.cost||0), 0);
}

/* ═══════════════════════════════════════════════════════════
   15. BREAKDOWN MANAGEMENT
   ═══════════════════════════════════════════════════════════ */

function renderBreakdownCard(b) {
  const equip = EQUIPMENT.find(e => e.id === b.equipId);
  return `
    <div class="card card-click" style="border-color:var(--bd-border);border-left:3px solid var(--bd-text);"
      data-nav="equipment-detail" data-equip="${b.equipId}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="bd-pulse-dot"></span>
          <span style="font-weight:500;font-size:14px;">${b.equipName}</span>
          <span class="code">${b.equipCode}</span>
          ${bdSeverityPill(b.severity)}
        </div>
        <span style="font-size:11px;color:var(--text-3);white-space:nowrap;">${equip ? equip.location : ''}</span>
      </div>
      <div style="font-size:12px;color:var(--bd-text);line-height:1.5;margin-bottom:8px;">${b.description}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--text-3);">
        <span>Reported by <strong style="color:var(--text-2)">${b.reportedBy}</strong> · ${fmtDate(b.date)} at ${b.time}</span>
        <div style="display:flex;gap:6px;align-items:center;" onclick="event.stopPropagation()">
          <button class="btn btn-sm admin-only" data-action="resolve-breakdown" data-bd="${b.id}"
            style="background:var(--bd-text);border-color:var(--bd-text);color:white;">
            Mark resolved
          </button>
          <div class="kebab-menu admin-only" data-kebab-id="bdcard-${b.id}">
            <button class="kebab-btn" data-kebab-toggle="bdcard-${b.id}" aria-label="More actions">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
            </button>
            <div class="kebab-dropdown">
              <button class="kebab-item" data-action="edit-breakdown" data-bd="${b.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit report
              </button>
              <button class="kebab-item kebab-item-danger" data-action="delete-breakdown" data-bd="${b.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
