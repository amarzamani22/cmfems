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
  return renderOperatorOverview();
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
  // Coming-up = time-based due in next 7 days OR hour-based meter within threshold.
  // Without the hour-based branch, hour-tracked jobs (excavators etc.) only surface
  // once they're already overdue — operators should see them approaching, not after.
  const weekJobs     = JOBS.filter(j => {
    if (!isJobDueSoon(j)) return false;
    if (j.basis === 'time' && j.dueDate === today) return false;  // shown in "Due today"
    return true;
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
      dueTxt = diff > 0 ? `Overdue ${diff} hrs` : diff === 0 ? 'Due now' : `Due in ${-diff} hrs`;
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
            <span>Coming up</span>
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
          <div class="op-allclear-sub">No overdue jobs, no breakdowns, nothing coming up.</div>
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
   JOB CARD COMPONENT
   ═══════════════════════════════════════════════════════════ */
function renderJobCard(j) {
  const eStatus = effectiveStatus(j);
  const color = eStatus === 'overdue' ? 'danger' : eStatus === 'inprogress' ? 'info' : eStatus === 'upcoming' ? (j.priority === 'high' ? 'warning' : 'neutral') : 'neutral';
  let dueText = '';
  if (j.basis === 'hour') {
    const diff = j.currentHours - j.dueHours;
    dueText = diff > 0 ? `Overdue ${diff} hrs` : diff === 0 ? 'Due now' : `Due in ${-diff} hrs`;
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
          ${(j.recurrence && j.recurrence !== 'none') ? pill(`🔄 ${RECURRENCE_LABELS[j.recurrence] || j.recurrence}`, 'neutral') : (j.recurrenceHours && j.recurrenceHours > 0) ? pill(`🔄 Every ${j.recurrenceHours.toLocaleString()} hrs`, 'neutral') : ''}
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

  // Sort — applied after filtering
  const statusOrder = { breakdown: 0, overdue: 1, warning: 2, ok: 3 };
  const sortKey = S.equipSort || 'name';
  filtered = [...filtered].sort((a, b) => {
    if (sortKey === 'code')   return a.code.localeCompare(b.code);
    if (sortKey === 'type')   return (a.type || '').localeCompare(b.type || '') || a.name.localeCompare(b.name);
    if (sortKey === 'status') return (statusOrder[effectiveEquipmentStatus(a)] ?? 9) - (statusOrder[effectiveEquipmentStatus(b)] ?? 9) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);   // default: by name
  });

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
        <select class="filter-select" id="equip-sort" title="Sort">
          <option value="name"   ${S.equipSort==='name'  ?'selected':''}>Sort: Name</option>
          <option value="code"   ${S.equipSort==='code'  ?'selected':''}>Sort: Code</option>
          <option value="type"   ${S.equipSort==='type'  ?'selected':''}>Sort: Type</option>
          <option value="status" ${S.equipSort==='status'?'selected':''}>Sort: Status (worst first)</option>
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
          ${e.tracksHours
            ? `<div class="equip-stat-row"><span class="equip-stat-label">Operating hrs</span><span class="equip-stat-val">${e.hours.toLocaleString()} hrs</span></div>`
            : `<div class="equip-stat-row"><span class="equip-stat-label">Scheduling</span><span class="equip-stat-val">Calendar time</span></div>`}

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
          <div class="page-sub">${e.make} ${e.model} · ${e.fuel} · ${e.location}${e.tracksHours ? ` · ${e.hours.toLocaleString()} op hrs` : ' · calendar-time scheduling'}</div>
        </div>
        <div class="page-hd-right">
          ${e.tracksHours ? `
          <button class="btn" data-action="update-hours" data-equip="${e.id}" style="color:var(--info-text);border-color:var(--info-text);background:var(--info-bg);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:13px;height:13px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Update hours
          </button>` : ''}
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
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span class="bd-pulse-dot"></span>
              <strong style="font-size:13px;">Active breakdown — equipment out of service</strong>
            </div>
            <div style="font-size:12px;opacity:0.9;line-height:1.5;margin-bottom:8px;">${activeBd.description}</div>
            ${activeBd.photo ? `
              <img src="${activeBd.photo}" alt="Breakdown photo"
                data-action="view-photo" data-src="${activeBd.photo}" data-label="Breakdown · ${e.name}"
                style="display:block;max-width:240px;width:100%;max-height:160px;object-fit:cover;border-radius:var(--r-md);cursor:zoom-in;margin-bottom:8px;">
            ` : ''}
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
              <div class="spec-item"><div class="spec-label">Scheduling</div><div class="spec-val">${e.tracksHours ? 'Operating hours' : 'Calendar time'}</div></div>
              ${e.tracksHours ? `<div class="spec-item"><div class="spec-label">Operating hours</div><div class="spec-val">${e.hours.toLocaleString()} hrs</div></div>` : ''}
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
  let filtered  = S.maintFilter === 'all' ? all :
                   S.maintFilter === 'overdue' ? overdue :
                   S.maintFilter === 'upcoming' ? upcoming : inprog;

  // Secondary filters (location / service type / trigger basis) — narrow the status-tab result.
  const mf = S.maintFilters || { location: 'all', type: 'all', basis: 'all' };
  if (mf.location !== 'all') filtered = filtered.filter(j => j.location === mf.location);
  if (mf.type     !== 'all') filtered = filtered.filter(j => j.type === mf.type);
  if (mf.basis    !== 'all') filtered = filtered.filter(j => (j.basis || 'time') === mf.basis);

  // Distinct values for the dropdowns — built off all jobs so options stay stable when filtering.
  const locations = [...new Set(all.map(j => j.location).filter(Boolean))].sort();
  const types     = [...new Set(all.map(j => j.type).filter(Boolean))].sort();

  // Sort
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const dueScore = (j) => {
    if (j.basis === 'time' && j.dueDate) return new Date(j.dueDate).getTime();
    if (j.basis === 'hour' && j.dueHours != null) return Number.MAX_SAFE_INTEGER - (j.dueHours - (j.currentHours||0));
    return Number.MAX_SAFE_INTEGER;
  };
  const sortKey = S.maintSort || 'due';
  filtered = [...filtered].sort((a, b) => {
    if (sortKey === 'priority')  return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (sortKey === 'type')      return (a.type || '').localeCompare(b.type || '');
    if (sortKey === 'equipment') return (a.equipName || '').localeCompare(b.equipName || '');
    return dueScore(a) - dueScore(b);   // default: earliest due first
  });

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
        <div class="filter-tabs mb-12">
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

        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;" class="mb-16">
          <select class="filter-select" id="maint-filter-location">
            <option value="all" ${mf.location==='all'?'selected':''}>All locations</option>
            ${locations.map(l => `<option value="${l}" ${mf.location===l?'selected':''}>${l}</option>`).join('')}
          </select>
          <select class="filter-select" id="maint-filter-type">
            <option value="all" ${mf.type==='all'?'selected':''}>All service types</option>
            ${types.map(t => `<option value="${t}" ${mf.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <select class="filter-select" id="maint-filter-basis">
            <option value="all"  ${mf.basis==='all' ?'selected':''}>All triggers</option>
            <option value="time" ${mf.basis==='time'?'selected':''}>Time-based</option>
            <option value="hour" ${mf.basis==='hour'?'selected':''}>Hour-based</option>
          </select>
          <select class="filter-select" id="maint-sort" title="Sort">
            <option value="due"       ${(S.maintSort||'due')==='due'       ?'selected':''}>Sort: Due (earliest)</option>
            <option value="priority"  ${S.maintSort==='priority' ?'selected':''}>Sort: Priority</option>
            <option value="type"      ${S.maintSort==='type'     ?'selected':''}>Sort: Service type</option>
            <option value="equipment" ${S.maintSort==='equipment'?'selected':''}>Sort: Equipment name</option>
          </select>
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:36px;height:36px;opacity:0.4;flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
            <div class="empty-state-title">All clear</div>
            <div class="empty-state-sub">No jobs match the current filters</div>
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
  const isStarted = j.status === 'inprogress';

  // Equipment thumbnail so operators recognise the machine visually
  let thumb = '';
  if (isFac) {
    const f = FACILITIES.find(x => x.id === j.entityId);
    thumb = f && f.photo ? `<img src="${f.photo}" alt="${j.equipName}">` :
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/></svg>`;
  } else {
    const eq = EQUIPMENT.find(x => x.id === (j.entityId || j.equipId));
    const photo = eq && eq.photos && (eq.photos.front || eq.photos.rear || eq.photos.left || eq.photos.right);
    thumb = photo ? `<img src="${photo}" alt="${j.equipName}">` : equipIcon(eq && eq.type);
  }

  return `
    <div class="op-job">
      <button class="btn-back" data-nav="maintenance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back
      </button>

      <div class="op-job-hero">
        <div class="op-job-thumb">${thumb}</div>
        <div class="op-job-hero-text">
          <div class="op-job-equip">${j.equipName}</div>
          <div class="op-job-type">${j.type}</div>
          <div class="op-job-loc">${j.location}${j.basis === 'time' && j.dueDate ? ` · Due ${fmtDate(j.dueDate)}` : j.basis === 'hour' ? ` · Due at ${(j.dueHours||0).toLocaleString()} hrs` : ''}</div>
        </div>
      </div>

      ${pstat.blocked > 0 ? `
        <div class="op-alert op-alert-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="width:24px;height:24px;flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <div class="op-alert-title">Parts not available</div>
            <div class="op-alert-sub">${pstat.blocked} required part${pstat.blocked>1?'s':''} missing. Cannot complete job.</div>
          </div>
        </div>
      ` : ''}

      ${!isStarted ? `
        <button class="op-big-btn op-big-btn-start" data-action="start-job" data-job="${j.id}">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:22px;height:22px"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>START JOB</span>
        </button>
      ` : `
        <div class="op-status-bar">
          <div>
            <div class="op-status-label">In progress</div>
            <div class="op-status-sub">Started ${j.started ? fmtDate(j.started) : 'today'}</div>
          </div>
          <button class="op-revert-btn" data-action="revert-job" data-job="${j.id}" title="Revert to upcoming">Revert</button>
        </div>
      `}

      ${items.length > 0 ? `
        <div class="op-progress">
          <div class="op-progress-row">
            <span>${allDone && isStarted ? '✓ All done' : 'Checklist'}</span>
            <span class="op-progress-count">${done} / ${items.length}</span>
          </div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${allDone && isStarted ?'var(--ok-text)':'var(--accent)'};transition:width 0.5s;"></div></div>
        </div>

        <div class="cl-cards">
          ${items.map((i, idx) => {
            const checked = S.checks[i.id] && isStarted;
            const cls = ['cl-card', checked ? 'cl-card-done' : '', !isStarted ? 'cl-card-locked' : ''].filter(Boolean).join(' ');
            return `
              <div class="${cls}" ${isStarted ? `data-check="${i.id}"` : ''} ${!isStarted ? 'title="Press Start job first to enable the checklist"' : ''}>
                <div class="cl-card-num">${idx + 1}</div>
                <div class="cl-card-box">
                  ${!isStarted
                    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`
                    : checked
                      ? `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
                      : ''}
                </div>
                <div class="cl-card-text">
                  <div class="cl-card-bm">${i.bm}</div>
                  <div class="cl-card-en">${i.en}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="op-alert op-alert-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="width:24px;height:24px;flex-shrink:0;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div>
            <div class="op-alert-title">No checklist for this job</div>
            <div class="op-alert-sub">Inform an administrator if a checklist is needed.</div>
          </div>
        </div>
      `}

      ${allDone && isStarted && pstat.blocked === 0 ? `
        <button class="op-big-btn op-big-btn-complete" data-action="complete-job" data-job="${j.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" style="width:22px;height:22px"><polyline points="20 6 9 17 4 12"/></svg>
          <span>MARK COMPLETE</span>
        </button>
      ` : allDone && isStarted && pstat.blocked > 0 ? `
        <button class="op-big-btn op-big-btn-blocked" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:22px;height:22px"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>BLOCKED · PARTS MISSING</span>
        </button>
      ` : ''}
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

  // Sort
  const facSortKey = S.facilitySort || 'name';
  list = [...list].sort((a, b) => {
    if (facSortKey === 'type')     return (a.type || '').localeCompare(b.type || '') || a.name.localeCompare(b.name);
    if (facSortKey === 'location') return (a.location || '').localeCompare(b.location || '') || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });

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
        <select class="filter-select" id="facility-sort" title="Sort">
          <option value="name"     ${(S.facilitySort||'name')==='name'    ?'selected':''}>Sort: Name</option>
          <option value="type"     ${S.facilitySort==='type'    ?'selected':''}>Sort: Type</option>
          <option value="location" ${S.facilitySort==='location'?'selected':''}>Sort: Location</option>
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


