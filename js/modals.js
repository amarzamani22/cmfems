/* ══════════════════════════════════════════════════════
   modals.js — all modal open/save/remove functions, event wiring, init
   ══════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   14. EDIT / DELETE EQUIPMENT
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   FACILITY MODALS
   ═══════════════════════════════════════════════════════════ */

function openFacilityEditor(facilityId) {
  const editing = facilityId ? getFacility(facilityId) : null;
  const locations = [...new Set([...EQUIPMENT.map(e => e.location), ...FACILITIES.map(f => f.location)])].sort();
  const draft = editing
    ? { ...editing }
    : { id:null, name:'', type:FACILITY_TYPES[0], location:locations[0]||'HQ', quantity:1, installedDate:'', notes:'', status:'active', photo:null };

  document.getElementById('modal-box').style.maxWidth = '520px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">${editing ? 'Edit Facility' : 'Add New Facility'}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Register a facility for routine inspection</div>
      </div>
      <button class="icon-btn" id="fe-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Name <span class="req">*</span></label>
        <input class="input" id="fe-name" value="${esc(draft.name)}" placeholder="e.g. Air Compressor - Workshop Bay 1" autocomplete="off">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Type <span class="req">*</span></label>
          <select class="input" id="fe-type">
            ${FACILITY_TYPES.map(t => `<option value="${t}" ${draft.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Location <span class="req">*</span></label>
          <input class="input" id="fe-loc" list="fe-loc-list" value="${esc(draft.location)}" placeholder="e.g. AATF 1">
          <datalist id="fe-loc-list">
            ${locations.map(l => `<option value="${l}">`).join('')}
          </datalist>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Quantity</label>
          <input class="input" type="number" id="fe-qty" min="1" step="1" value="${draft.quantity}">
          <div class="field-hint">Use 1 for single items, higher for groups (e.g. 6 fire extinguishers)</div>
        </div>
        <div class="field">
          <label class="field-label">Installed date</label>
          <input class="input" type="date" id="fe-date" value="${draft.installedDate || ''}">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Notes</label>
        <textarea class="input" id="fe-notes" rows="2" placeholder="Optional context — size, brand, serial, etc.">${esc(draft.notes || '')}</textarea>
      </div>
      <div class="field">
        <label class="field-label">Status</label>
        <div class="view-toggle">
          <button type="button" class="${draft.status==='active'?'active':''}" id="fe-status-active">Active</button>
          <button type="button" class="${draft.status==='retired'?'active':''}" id="fe-status-retired">Retired</button>
        </div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="fe-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="fe-save">${editing ? 'Save changes' : 'Add facility'}</button>
    </div>
  `;

  document.getElementById('fe-close').onclick  = closeModal;
  document.getElementById('fe-cancel').onclick = closeModal;
  document.getElementById('fe-status-active').onclick  = () => { draft.status = 'active';  document.getElementById('fe-status-active').classList.add('active');  document.getElementById('fe-status-retired').classList.remove('active'); };
  document.getElementById('fe-status-retired').onclick = () => { draft.status = 'retired'; document.getElementById('fe-status-retired').classList.add('active'); document.getElementById('fe-status-active').classList.remove('active'); };

  document.getElementById('fe-save').onclick = () => {
    const name = document.getElementById('fe-name').value.trim();
    const type = document.getElementById('fe-type').value;
    const loc  = document.getElementById('fe-loc').value.trim();
    const qty  = parseInt(document.getElementById('fe-qty').value) || 1;
    const date = document.getElementById('fe-date').value;
    const notes = document.getElementById('fe-notes').value.trim();
    if (!name) { document.getElementById('fe-name').focus(); toast('Name required', 'error'); return; }
    if (!loc)  { document.getElementById('fe-loc').focus();  toast('Location required', 'error'); return; }

    if (editing) {
      const f = getFacility(editing.id);
      f.name = name; f.type = type; f.location = loc; f.quantity = qty;
      f.installedDate = date || null; f.notes = notes; f.status = draft.status;
      toast('Facility updated');
    } else {
      FACILITIES.push({
        id: 'fac-' + Date.now(),
        name, type, location: loc, quantity: qty,
        installedDate: date || null, notes,
        status: draft.status, photo: null,
      });
      toast('Facility added');
    }
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    setTimeout(() => render(), 200);
  };
}

function openDeleteFacility(facilityId) {
  const f = getFacility(facilityId);
  if (!f) return;
  const jobsUsing = JOBS.filter(j => j.entityType === 'facility' && j.entityId === f.id);
  const histUsing = HISTORY.filter(h => h.entityType === 'facility' && h.entityId === f.id);

  document.getElementById('modal-box').style.maxWidth = '440px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Delete Facility?</div>
      <button class="icon-btn" id="df-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:10px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:12px;">
        <div style="font-weight:600;font-size:14px;">${f.name}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${f.type} · ${f.location} · ${f.quantity} unit${f.quantity>1?'s':''}</div>
      </div>
      <p style="font-size:13px;color:var(--text-2);margin:0;">
        Permanently remove this facility and all associated records:
      </p>
      <ul style="font-size:12px;color:var(--text-2);margin:0;padding-left:18px;line-height:2;">
        ${jobsUsing.length > 0 ? `<li>${jobsUsing.length} scheduled job${jobsUsing.length>1?'s':''}</li>` : ''}
        ${histUsing.length > 0 ? `<li>${histUsing.length} history record${histUsing.length>1?'s':''}</li>` : ''}
        ${jobsUsing.length === 0 && histUsing.length === 0 ? '<li>No associated records</li>' : ''}
      </ul>
      <p style="font-size:12px;color:var(--danger-text);font-weight:500;margin:0;">This action cannot be undone.</p>
    </div>
    <div class="modal-ft">
      <button class="btn" id="df-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="df-confirm">Delete facility</button>
    </div>
  `;

  document.getElementById('df-close').onclick  = closeModal;
  document.getElementById('df-cancel').onclick = closeModal;
  document.getElementById('df-confirm').onclick = () => {
    const name = f.name;
    // Cascade: remove jobs + history referencing this facility
    for (let i = JOBS.length - 1;    i >= 0; i--) if (JOBS[i].entityType    === 'facility' && JOBS[i].entityId    === f.id) JOBS.splice(i, 1);
    for (let i = HISTORY.length - 1; i >= 0; i--) if (HISTORY[i].entityType === 'facility' && HISTORY[i].entityId === f.id) HISTORY.splice(i, 1);
    FACILITIES.splice(FACILITIES.indexOf(f), 1);
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${name} removed`, 'warn');
    go('facilities');
  };
}

/* ═══════════════════════════════════════════════════════════
   PM TEMPLATE MODALS
   ═══════════════════════════════════════════════════════════ */

function openViewTemplate(templateId) {
  const t = getTemplate(templateId);
  if (!t) return;
  const jobsUsing = JOBS.filter(j => j.checklistId === t.id).length;

  document.getElementById('modal-box').style.maxWidth = '560px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">${t.name}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:2px;">
          ${t.entityType === 'facility' ? 'Facility' : 'Equipment'} · ${t.equipmentType || t.facilityType || '—'} · ${t.serviceType}
          ${t.status === 'inactive' ? ` · <span style="color:var(--text-3);">Inactive</span>` : ''}
        </div>
      </div>
      <button class="icon-btn" id="vt-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:10px 14px;display:flex;flex-direction:column;gap:4px;font-size:12px;">
        <div class="flex-between"><span class="text-3">Status</span><span>${t.status === 'active' ? pill('Active','ok') : pill('Inactive','neutral')}</span></div>
        <div class="flex-between"><span class="text-3">Checklist items</span><span style="font-weight:500;">${t.items.length}</span></div>
        <div class="flex-between"><span class="text-3">Currently in use</span><span>${jobsUsing > 0 ? `${jobsUsing} active job${jobsUsing>1?'s':''}` : '—'}</span></div>
      </div>

      <div>
        <div class="ae-section-label" style="margin-bottom:8px;">Checklist items</div>
        ${t.items.length === 0 ? `
          <div style="font-size:12px;color:var(--text-3);padding:8px 0;">No items in this template.</div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${t.items.map((item, i) => `
              <div style="display:flex;gap:10px;align-items:flex-start;padding:8px 10px;background:var(--card-bg);border:0.5px solid var(--border);border-radius:var(--r-md);">
                <span style="font-size:11px;font-weight:600;color:var(--text-3);padding-top:1px;min-width:20px;">${i+1}.</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12.5px;color:var(--text-1);line-height:1.45;">${esc(item.bm)}</div>
                  ${item.en ? `<div style="font-size:11px;color:var(--text-3);margin-top:2px;line-height:1.4;">${esc(item.en)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="vt-close-btn">Close</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary admin-only" id="vt-edit">Edit template</button>
    </div>
  `;

  document.getElementById('vt-close').onclick     = closeModal;
  document.getElementById('vt-close-btn').onclick = closeModal;
  document.getElementById('vt-edit').onclick = () => {
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    setTimeout(() => openTemplateEditor(templateId), 100);
  };
  applyAdminVisibility();
}

function openTemplateEditor(templateId) {
  const editing = templateId ? getTemplate(templateId) : null;
  S.templateDraft = editing
    ? { id: editing.id, name: editing.name, equipmentType: editing.equipmentType, serviceType: editing.serviceType, customServiceType: '', status: editing.status, items: editing.items.map(i => ({ ...i })) }
    : { id: null, name: '', equipmentType: 'Forklift', serviceType: 'Minor Service', customServiceType: '', status: 'active', items: [] };
  document.getElementById('modal-box').style.maxWidth = '640px';
  openModal('');
  renderTemplateEditor();
}

function renderTemplateEditor() {
  const d = S.templateDraft;
  const isEdit = !!d.id;
  const isCustom = !SERVICE_TYPES_FIXED.includes(d.serviceType);

  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">${isEdit ? 'Edit Template' : 'Add New Template'}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Maintenance checklist template</div>
      </div>
      <button class="icon-btn" id="tpl-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Template name <span class="req">*</span></label>
        <input class="input" id="tpl-name" value="${esc(d.name)}" placeholder="e.g. Forklift · Minor Service" autocomplete="off">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Equipment type <span class="req">*</span></label>
          <select class="input" id="tpl-equip">
            ${EQUIPMENT_TYPES_FOR_TEMPLATE.map(t => `<option value="${t}" ${d.equipmentType===t?'selected':''}>${t}</option>`).join('')}
          </select>
          <div class="field-hint">"Any" = applies to all equipment types</div>
        </div>
        <div class="field">
          <label class="field-label">Service type <span class="req">*</span></label>
          <select class="input" id="tpl-service">
            ${SERVICE_TYPES_FIXED.map(t => `<option value="${t}" ${d.serviceType===t?'selected':''}>${t}</option>`).join('')}
            <option value="__custom__" ${isCustom?'selected':''}>Custom…</option>
          </select>
          ${isCustom ? `<input class="input" id="tpl-service-custom" value="${esc(d.serviceType === '__custom__' ? d.customServiceType : d.serviceType)}" placeholder="e.g. Engine Overhaul" style="margin-top:6px;">` : ''}
        </div>
      </div>

      <div class="field">
        <label class="field-label">Status</label>
        <div class="view-toggle">
          <button type="button" class="${d.status==='active'?'active':''}" data-tpl-status="active">Active</button>
          <button type="button" class="${d.status==='inactive'?'active':''}" data-tpl-status="inactive">Inactive</button>
        </div>
        <div class="field-hint">Inactive templates are hidden from the Schedule form but historical jobs still link to them.</div>
      </div>

      <div>
        <div class="ae-section-label" style="display:flex;justify-content:space-between;align-items:center;">
          <span>Checklist items · ${d.items.length}</span>
          <button class="btn btn-sm" id="tpl-add-item">+ Add item</button>
        </div>
        ${d.items.length === 0 ? `
          <div style="font-size:12px;color:var(--text-3);padding:8px 0;">No items yet. Click "+ Add item" to start building the checklist.</div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${d.items.map((item, i) => `
              <div style="display:flex;gap:8px;align-items:flex-start;padding:8px;background:var(--neutral-bg);border-radius:var(--r-md);">
                <span style="font-size:11px;color:var(--text-3);font-weight:600;padding-top:8px;min-width:18px;">${i+1}.</span>
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                  <input class="input" data-tpl-item-bm="${i}" value="${esc(item.bm)}" placeholder="Bahasa Malaysia (e.g. Tukar minyak enjin)">
                  <input class="input" data-tpl-item-en="${i}" value="${esc(item.en)}" placeholder="English (e.g. Change engine oil)">
                </div>
                <button class="btn btn-sm" data-tpl-remove-item="${i}"
                  style="color:var(--danger-text);border-color:var(--danger-border);padding:4px 8px;">×</button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="tpl-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="tpl-save">${isEdit ? 'Save changes' : 'Create template'}</button>
    </div>
  `;

  document.getElementById('tpl-close').onclick  = () => { S.templateDraft = null; closeModal(); document.getElementById('modal-box').style.maxWidth=''; };
  document.getElementById('tpl-cancel').onclick = () => { S.templateDraft = null; closeModal(); document.getElementById('modal-box').style.maxWidth=''; };

  // Sync simple fields on input
  document.getElementById('tpl-name').addEventListener('input', e => d.name = e.target.value);
  document.getElementById('tpl-equip').addEventListener('change', e => d.equipmentType = e.target.value);
  document.getElementById('tpl-service').addEventListener('change', e => {
    if (e.target.value === '__custom__') {
      d.serviceType = '__custom__';
    } else {
      d.serviceType = e.target.value;
      d.customServiceType = '';
    }
    renderTemplateEditor();
  });
  const customInp = document.getElementById('tpl-service-custom');
  if (customInp) customInp.addEventListener('input', e => d.customServiceType = e.target.value);

  // Status toggle
  document.querySelectorAll('[data-tpl-status]').forEach(btn => {
    btn.addEventListener('click', () => { d.status = btn.dataset.tplStatus; renderTemplateEditor(); });
  });

  // Item editing
  document.querySelectorAll('[data-tpl-item-bm]').forEach(inp => {
    inp.addEventListener('input', e => { d.items[+inp.dataset.tplItemBm].bm = e.target.value; });
  });
  document.querySelectorAll('[data-tpl-item-en]').forEach(inp => {
    inp.addEventListener('input', e => { d.items[+inp.dataset.tplItemEn].en = e.target.value; });
  });
  document.querySelectorAll('[data-tpl-remove-item]').forEach(btn => {
    btn.addEventListener('click', () => { d.items.splice(+btn.dataset.tplRemoveItem, 1); renderTemplateEditor(); });
  });

  document.getElementById('tpl-add-item').onclick = () => {
    d.items.push({ id: 'i-' + Date.now() + '-' + d.items.length, bm: '', en: '' });
    renderTemplateEditor();
  };

  document.getElementById('tpl-save').onclick = () => {
    const name = d.name.trim();
    if (!name) { document.getElementById('tpl-name').focus(); toast('Template name required', 'error'); return; }

    const finalServiceType = d.serviceType === '__custom__' ? d.customServiceType.trim() : d.serviceType;
    if (!finalServiceType) { toast('Service type required', 'error'); return; }

    // Clean up items: drop any with both fields empty
    const items = d.items.filter(i => i.bm.trim() || i.en.trim()).map(i => ({ id: i.id, bm: i.bm.trim(), en: i.en.trim() }));
    if (items.length === 0) { toast('Add at least one checklist item', 'error'); return; }

    if (d.id) {
      const t = getTemplate(d.id);
      t.name = name;
      t.equipmentType = d.equipmentType;
      t.serviceType = finalServiceType;
      t.status = d.status;
      t.items = items;
      toast('Template updated');
    } else {
      TEMPLATES.push({
        id: 'tpl-' + Date.now(),
        name, equipmentType: d.equipmentType, serviceType: finalServiceType, status: d.status, items,
      });
      toast('Template created');
    }

    S.templateDraft = null;
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    setTimeout(() => render(), 200);
  };
}

function duplicateTemplate(templateId) {
  const t = getTemplate(templateId);
  if (!t) return;
  TEMPLATES.push({
    id: 'tpl-' + Date.now(),
    name: t.name + ' (Copy)',
    equipmentType: t.equipmentType,
    serviceType: t.serviceType,
    status: 'active',
    items: t.items.map(i => ({ ...i, id: 'i-' + Date.now() + '-' + Math.random().toString(36).slice(2,6) })),
  });
  toast(`Duplicated · ${t.name}`);
  render();
}

function toggleTemplateStatus(templateId) {
  const t = getTemplate(templateId);
  if (!t) return;
  t.status = t.status === 'active' ? 'inactive' : 'active';
  toast(`${t.name} · ${t.status}`);
  render();
}

function openDeleteTemplate(templateId) {
  const t = getTemplate(templateId);
  if (!t) return;
  const jobsUsing = JOBS.filter(j => j.checklistId === t.id);

  document.getElementById('modal-box').style.maxWidth = '440px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Delete Template?</div>
      <button class="icon-btn" id="dt-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:10px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:12px;">
        <div style="font-weight:600;font-size:14px;">${t.name}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${t.equipmentType} · ${t.serviceType} · ${t.items.length} items</div>
      </div>
      ${jobsUsing.length > 0 ? `
        <div class="alert-banner alert-warning" style="font-size:12px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div><strong>${jobsUsing.length} active job${jobsUsing.length>1?'s':''}</strong> currently use this template. Those jobs will lose their checklist. Consider <strong>Deactivate</strong> instead.</div>
        </div>
      ` : `<p style="font-size:12px;color:var(--text-3);margin:0;">Not used by any active job.</p>`}
      <p style="font-size:12px;color:var(--danger-text);font-weight:500;margin:0;">This action cannot be undone.</p>
    </div>
    <div class="modal-ft">
      <button class="btn" id="dt-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="dt-confirm">Delete template</button>
    </div>
  `;

  document.getElementById('dt-close').onclick  = closeModal;
  document.getElementById('dt-cancel').onclick = closeModal;
  document.getElementById('dt-confirm').onclick = () => {
    const name = t.name;
    // Remove from jobs that reference it (set to null so job still exists, just has no template)
    JOBS.forEach(j => { if (j.checklistId === t.id) j.checklistId = null; });
    TEMPLATES.splice(TEMPLATES.indexOf(t), 1);
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${name} deleted`, 'warn');
    setTimeout(() => render(), 200);
  };
}

function openUpdateStock(partId) {
  const p = PARTS.find(x => x.id === partId);
  if (!p) return;
  const users = partUsedBy(p.id);

  document.getElementById('modal-box').style.maxWidth = '460px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Update Stock</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${p.name} · ${p.code}</div>
      </div>
      <button class="icon-btn" id="us-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:10px 12px;font-size:12px;display:flex;flex-direction:column;gap:4px;">
        <div class="flex-between"><span class="text-3">Current stock</span><span style="font-weight:600;">${p.stock} ${p.unit}</span></div>
        <div class="flex-between"><span class="text-3">Minimum level</span><span>${p.minStock} ${p.unit}</span></div>
        <div class="flex-between"><span class="text-3">Used by</span><span>${users.length} equipment</span></div>
      </div>

      <div class="field">
        <label class="field-label">Action</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--border-2);border-radius:var(--r-md);cursor:pointer;font-size:12px;">
            <input type="radio" name="us-mode" value="add" checked>
            <span><strong>+ Add stock</strong><br><span style="color:var(--text-3);font-size:10.5px;">Received new order</span></span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--border-2);border-radius:var(--r-md);cursor:pointer;font-size:12px;">
            <input type="radio" name="us-mode" value="set">
            <span><strong>Set total</strong><br><span style="color:var(--text-3);font-size:10.5px;">Manual recount / adjust</span></span>
          </label>
        </div>
      </div>

      <div class="field">
        <label class="field-label" id="us-qty-label">Quantity to add <span class="req">*</span></label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input class="input" type="number" id="us-qty" min="0" step="1" placeholder="0" style="max-width:160px;">
          <span style="font-size:12px;color:var(--text-3);">${p.unit}</span>
          <span id="us-preview" style="font-size:12px;color:var(--text-3);margin-left:6px;"></span>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Note <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
        <input class="input" id="us-note" placeholder="e.g. Received from Shopee order SH-2026-04" autocomplete="off">
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="us-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="us-save">Update stock</button>
    </div>
  `;

  document.getElementById('us-close').onclick  = closeModal;
  document.getElementById('us-cancel').onclick = closeModal;

  const qtyInput = document.getElementById('us-qty');
  const qtyLabel = document.getElementById('us-qty-label');
  const preview  = document.getElementById('us-preview');

  function updatePreview() {
    const mode = document.querySelector('input[name="us-mode"]:checked').value;
    const qty  = parseFloat(qtyInput.value) || 0;
    if (mode === 'add') {
      qtyLabel.innerHTML = 'Quantity to add <span class="req">*</span>';
      preview.textContent = qty > 0 ? `→ ${p.stock + qty} ${p.unit}` : '';
    } else {
      qtyLabel.innerHTML = 'New total stock <span class="req">*</span>';
      preview.textContent = qtyInput.value !== '' ? `was ${p.stock} ${p.unit}` : '';
    }
  }

  document.querySelectorAll('input[name="us-mode"]').forEach(r => r.addEventListener('change', updatePreview));
  qtyInput.addEventListener('input', updatePreview);

  document.getElementById('us-save').onclick = () => {
    const mode = document.querySelector('input[name="us-mode"]:checked').value;
    const qty  = parseFloat(qtyInput.value);
    if (isNaN(qty) || qty < 0) { qtyInput.focus(); toast('Enter a valid quantity', 'error'); return; }
    if (mode === 'add' && qty === 0) { qtyInput.focus(); toast('Quantity must be more than 0', 'error'); return; }

    const oldStock = p.stock;
    if (mode === 'add') p.stock += qty;
    else                p.stock  = qty;

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${p.name} stock updated · ${oldStock} → ${p.stock} ${p.unit}`);
    setTimeout(() => render(), 200);
  };
}

function openEditPartInCatalog(partId) {
  const p = PARTS.find(x => x.id === partId);
  if (!p) return;

  document.getElementById('modal-box').style.maxWidth = '520px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Edit Part · ${p.name}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Stock is managed separately via Update stock</div>
      </div>
      <button class="icon-btn" id="epc-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Part name <span class="req">*</span></label>
        <input class="input" id="epc-name" value="${p.name}" autocomplete="off">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Part code / number <span class="req">*</span></label>
          <input class="input" id="epc-code" value="${p.code}" autocomplete="off" style="text-transform:uppercase;">
        </div>
        <div class="field">
          <label class="field-label">Category <span class="req">*</span></label>
          <input class="input" id="epc-cat" list="epc-cat-list" value="${p.cat}" autocomplete="off">
          <datalist id="epc-cat-list">
            ${[...new Set(PARTS.map(x => x.cat))].sort().map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Unit</label>
          <select class="input" id="epc-unit">
            <option value="pcs" ${p.unit==='pcs'?'selected':''}>pcs</option>
            <option value="L"   ${p.unit==='L'  ?'selected':''}>L</option>
            <option value="set" ${p.unit==='set'?'selected':''}>set</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Unit price (RM)</label>
          <input class="input" id="epc-price" type="number" min="0" step="0.01" value="${p.price}">
        </div>
        <div class="field">
          <label class="field-label">Minimum stock</label>
          <input class="input" id="epc-min" type="number" min="0" step="1" value="${p.minStock}">
        </div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="epc-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="epc-save">Save changes</button>
    </div>
  `;

  document.getElementById('epc-close').onclick  = closeModal;
  document.getElementById('epc-cancel').onclick = closeModal;
  document.getElementById('epc-save').onclick = () => {
    const name  = document.getElementById('epc-name').value.trim();
    const code  = document.getElementById('epc-code').value.trim().toUpperCase();
    const cat   = document.getElementById('epc-cat').value.trim();
    const unit  = document.getElementById('epc-unit').value;
    const price = parseFloat(document.getElementById('epc-price').value) || 0;
    const minSt = parseInt(document.getElementById('epc-min').value) || 0;

    if (!name) { document.getElementById('epc-name').focus(); toast('Part name required', 'error'); return; }
    if (!code) { document.getElementById('epc-code').focus(); toast('Part code required', 'error'); return; }
    if (!cat)  { document.getElementById('epc-cat').focus();  toast('Category required',  'error'); return; }
    // Check code collision against other parts (not self)
    if (PARTS.some(x => x.id !== p.id && x.code.toUpperCase() === code)) {
      document.getElementById('epc-code').focus();
      toast(`Part code "${code}" already exists on another part`, 'error');
      return;
    }

    p.name     = name;
    p.code     = code;
    p.cat      = cat;
    p.unit     = unit;
    p.price    = price;
    p.minStock = minSt;

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Part updated');
    setTimeout(() => render(), 200);
  };
}

function openDeletePartFromCatalog(partId) {
  const p = PARTS.find(x => x.id === partId);
  if (!p) return;
  const usingEquipment = partUsedBy(p.id);
  const usingJobs = JOBS.filter(j => j.requiredPartIds && j.requiredPartIds.includes(p.id));

  document.getElementById('modal-box').style.maxWidth = '460px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Delete Part from Catalog?</div>
      <button class="icon-btn" id="dpc-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:12px;">
        <div style="font-weight:600;font-size:14px;">${p.name}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${p.code} · ${p.cat} · ${p.stock} ${p.unit} in stock</div>
      </div>
      <p style="font-size:13px;color:var(--text-2);margin:0;">
        Permanently remove this part from the catalog.
      </p>
      ${usingEquipment.length > 0 || usingJobs.length > 0 ? `
        <ul style="font-size:12px;color:var(--text-2);margin:0;padding-left:18px;line-height:2;">
          ${usingEquipment.length > 0 ? `<li>Also removed from ${usingEquipment.length} equipment (${usingEquipment.slice(0,3).map(e=>e.name).join(', ')}${usingEquipment.length>3?'…':''})</li>` : ''}
          ${usingJobs.length > 0 ? `<li>Also removed from ${usingJobs.length} scheduled job${usingJobs.length>1?'s':''}</li>` : ''}
        </ul>
      ` : '<p style="font-size:12px;color:var(--text-3);margin:0;">Not used by any equipment or job.</p>'}
      <p style="font-size:12px;color:var(--danger-text);font-weight:500;margin:0;">This action cannot be undone.</p>
    </div>
    <div class="modal-ft">
      <button class="btn" id="dpc-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="dpc-confirm">
        Delete part
      </button>
    </div>
  `;

  document.getElementById('dpc-close').onclick  = closeModal;
  document.getElementById('dpc-cancel').onclick = closeModal;
  document.getElementById('dpc-confirm').onclick = () => {
    const name = p.name;
    // Remove from all equipment's parts lists
    EQUIPMENT.forEach(e => {
      if (e.parts) e.parts = e.parts.filter(ep => ep.partId !== p.id);
    });
    // Remove from all jobs' requiredPartIds
    JOBS.forEach(j => {
      if (j.requiredPartIds) j.requiredPartIds = j.requiredPartIds.filter(pid => pid !== p.id);
    });
    // Remove from catalog
    PARTS.splice(PARTS.indexOf(p), 1);

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${name} removed from catalog`, 'warn');
    setTimeout(() => render(), 200);
  };
}

function openAddPartToCatalog(onSaved) {
  document.getElementById('modal-box').style.maxWidth = '520px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Add New Part to Catalog</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Register a new part in the inventory catalog</div>
      </div>
      <button class="icon-btn" id="apc-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Part name <span class="req">*</span></label>
        <input class="input" id="apc-name" placeholder="e.g. Engine Oil Filter" autocomplete="off">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Part code / number <span class="req">*</span></label>
          <input class="input" id="apc-code" placeholder="e.g. T-1637" autocomplete="off" style="text-transform:uppercase;">
        </div>
        <div class="field">
          <label class="field-label">Category <span class="req">*</span></label>
          <input class="input" id="apc-cat" list="apc-cat-list" placeholder="e.g. Filter" autocomplete="off">
          <datalist id="apc-cat-list">
            ${[...new Set(PARTS.map(p => p.cat))].sort().map(c => `<option value="${c}">`).join('')}
          </datalist>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Unit</label>
          <select class="input" id="apc-unit">
            <option value="pcs">pcs</option>
            <option value="L">L</option>
            <option value="set">set</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Unit price (RM)</label>
          <input class="input" id="apc-price" type="number" min="0" step="0.01" placeholder="e.g. 45">
        </div>
        <div class="field">
          <label class="field-label">Initial stock</label>
          <input class="input" id="apc-stock" type="number" min="0" step="1" placeholder="0">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Minimum stock level</label>
        <input class="input" id="apc-min" type="number" min="0" step="1" placeholder="e.g. 2">
        <div class="field-hint">System alerts when stock drops to or below this level.</div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="apc-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="apc-save">Add to catalog</button>
    </div>
  `;

  document.getElementById('apc-close').onclick  = closeModal;
  document.getElementById('apc-cancel').onclick = closeModal;
  document.getElementById('apc-save').onclick = () => {
    const name  = document.getElementById('apc-name').value.trim();
    const code  = document.getElementById('apc-code').value.trim().toUpperCase();
    const cat   = document.getElementById('apc-cat').value.trim();
    const unit  = document.getElementById('apc-unit').value;
    const price = parseFloat(document.getElementById('apc-price').value) || 0;
    const stock = parseInt(document.getElementById('apc-stock').value) || 0;
    const minSt = parseInt(document.getElementById('apc-min').value) || 0;

    if (!name) { document.getElementById('apc-name').focus(); toast('Part name required', 'error'); return; }
    if (!code) { document.getElementById('apc-code').focus(); toast('Part code required', 'error'); return; }
    if (!cat)  { document.getElementById('apc-cat').focus();  toast('Category required',  'error'); return; }
    if (PARTS.some(p => p.code.toUpperCase() === code)) {
      document.getElementById('apc-code').focus();
      toast(`Part code "${code}" already exists`, 'error');
      return;
    }

    const newPart = {
      id: 'p-' + Date.now(),
      name, code, cat, unit, price,
      stock, minStock: minSt,
    };
    PARTS.push(newPart);

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${name} added to catalog`);

    if (typeof onSaved === 'function') {
      setTimeout(() => onSaved(newPart.id), 200);
    } else {
      setTimeout(() => render(), 200);
    }
  };
}

function openAddEquipmentPart(equipId, preselectPartId) {
  const e = EQUIPMENT.find(eq => eq.id === equipId);
  if (!e) return;
  if (!e.parts) e.parts = [];
  const alreadyIds = new Set(e.parts.map(ep => ep.partId));
  const available  = PARTS.filter(p => !alreadyIds.has(p.id));

  document.getElementById('modal-box').style.maxWidth = '480px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Add Part to ${e.name}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Register a part used by this equipment</div>
      </div>
      <button class="icon-btn" id="aep-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      ${available.length === 0 ? `
        <div class="alert-banner alert-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <div>All parts in the catalog are already registered to this equipment.</div>
        </div>
      ` : `
        <div class="field">
          <label class="field-label">Select part <span class="req">*</span></label>
          <select class="input" id="aep-part">
            <option value="">Select from catalog…</option>
            ${available.map(p => `<option value="${p.id}" data-unit="${p.unit}" ${p.id===preselectPartId?'selected':''}>${p.name} · ${p.code} (${p.cat})</option>`).join('')}
          </select>
          <div class="field-hint">
            Part not in catalog? <a href="#" id="aep-new-catalog-link" style="color:var(--accent);font-weight:500;text-decoration:none;">+ Add new part to catalog →</a>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Quantity per job <span class="req">*</span></label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input class="input" type="number" id="aep-qty" min="0.1" step="0.1" placeholder="e.g. 1" style="max-width:160px;">
            <span id="aep-unit" style="font-size:12px;color:var(--text-3);">${preselectPartId ? (PARTS.find(p=>p.id===preselectPartId)?.unit || '—') : '—'}</span>
          </div>
          <div class="field-hint">How many of this part is consumed in a typical service?</div>
        </div>
      `}
    </div>
    <div class="modal-ft">
      <button class="btn" id="aep-cancel">Cancel</button>
      <div style="flex:1"></div>
      ${available.length === 0
        ? `<button class="btn btn-primary" id="aep-close-ok">OK</button>`
        : `<button class="btn btn-primary" id="aep-save">Add part</button>`}
    </div>
  `;

  document.getElementById('aep-close').onclick  = closeModal;
  document.getElementById('aep-cancel').onclick = closeModal;
  const okBtn = document.getElementById('aep-close-ok');
  if (okBtn) okBtn.onclick = closeModal;

  if (available.length > 0) {
    const sel  = document.getElementById('aep-part');
    const unit = document.getElementById('aep-unit');
    sel.addEventListener('change', () => {
      const opt = sel.options[sel.selectedIndex];
      unit.textContent = opt && opt.dataset.unit ? opt.dataset.unit : '—';
    });

    // Escape hatch: admin wants to add a brand-new part to catalog
    document.getElementById('aep-new-catalog-link').onclick = (ev) => {
      ev.preventDefault();
      openAddPartToCatalog((newPartId) => {
        // After saving to catalog, re-open this modal with the new part preselected
        openAddEquipmentPart(equipId, newPartId);
      });
    };

    document.getElementById('aep-save').onclick = () => {
      const partId = sel.value;
      const qty    = parseFloat(document.getElementById('aep-qty').value);
      if (!partId)          { sel.focus(); toast('Select a part', 'error'); return; }
      if (!qty || qty <= 0) { document.getElementById('aep-qty').focus(); toast('Enter a valid quantity', 'error'); return; }
      e.parts.push({ partId, qty });
      closeModal();
      document.getElementById('modal-box').style.maxWidth = '';
      toast('Part added to equipment');
      setTimeout(() => render(), 200);
    };
  }
}

function openEditEquipmentPart(equipId, partId) {
  const e = EQUIPMENT.find(eq => eq.id === equipId);
  if (!e || !e.parts) return;
  const ep = e.parts.find(x => x.partId === partId);
  const part = PARTS.find(p => p.id === partId);
  if (!ep || !part) return;

  document.getElementById('modal-box').style.maxWidth = '440px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Edit Part Quantity</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${e.name} · ${part.name}</div>
      </div>
      <div style="margin-left:auto;">
        <button class="icon-btn" id="eep-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:10px 12px;font-size:12px;">
        <div class="flex-between"><span class="text-3">Part</span><span style="font-weight:500;">${part.name}</span></div>
        <div class="flex-between"><span class="text-3">Code</span><span class="code">${part.code}</span></div>
        <div class="flex-between"><span class="text-3">Current stock</span><span>${part.stock} ${part.unit}</span></div>
      </div>
      <div class="field">
        <label class="field-label">Quantity per job <span class="req">*</span></label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input class="input" type="number" id="eep-qty" min="0.1" step="0.1" value="${ep.qty}" style="max-width:160px;">
          <span style="font-size:12px;color:var(--text-3);">${part.unit}</span>
        </div>
        <div class="field-hint">How many of this part is consumed in a typical service?</div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="eep-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="eep-save">Save changes</button>
    </div>
  `;

  document.getElementById('eep-close').onclick  = closeModal;
  document.getElementById('eep-cancel').onclick = closeModal;
  document.getElementById('eep-save').onclick = () => {
    const qty = parseFloat(document.getElementById('eep-qty').value);
    if (!qty || qty <= 0) { document.getElementById('eep-qty').focus(); toast('Enter a valid quantity', 'error'); return; }
    if (qty === ep.qty) { closeModal(); document.getElementById('modal-box').style.maxWidth = ''; return; }
    ep.qty = qty;
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Quantity updated');
    setTimeout(() => render(), 200);
  };
}

function removeEquipmentPart(equipId, partId) {
  const e = EQUIPMENT.find(eq => eq.id === equipId);
  if (!e || !e.parts) return;
  const part = PARTS.find(p => p.id === partId);
  const partName = part ? part.name : 'part';
  // Check if any job currently requires this part
  const jobsReferencing = JOBS.filter(j => j.equipId === equipId && j.requiredPartIds && j.requiredPartIds.includes(partId));

  document.getElementById('modal-box').style.maxWidth = '440px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Remove Part?</div>
      <button class="icon-btn" id="rep-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--text-2);margin:0 0 10px;">
        Remove <strong>${partName}</strong> from <strong>${e.name}</strong>?
      </p>
      ${jobsReferencing.length > 0 ? `
        <p style="font-size:12px;color:var(--warn-text);margin:0;">
          ⚠ ${jobsReferencing.length} active job${jobsReferencing.length>1?'s':''} reference${jobsReferencing.length>1?'':'s'} this part. It will also be removed from those jobs.
        </p>
      ` : ''}
    </div>
    <div class="modal-ft">
      <button class="btn" id="rep-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="rep-confirm">
        Remove
      </button>
    </div>
  `;

  document.getElementById('rep-close').onclick  = closeModal;
  document.getElementById('rep-cancel').onclick = closeModal;
  document.getElementById('rep-confirm').onclick = () => {
    e.parts = e.parts.filter(ep => ep.partId !== partId);
    // Cascade: remove from any job's requiredPartIds too
    JOBS.forEach(j => {
      if (j.equipId === equipId && j.requiredPartIds) {
        j.requiredPartIds = j.requiredPartIds.filter(pid => pid !== partId);
      }
    });
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Part removed', 'warn');
    setTimeout(() => render(), 200);
  };
}

function openDeleteEquipment(equipId) {
  const e = EQUIPMENT.find(eq => eq.id === equipId);
  if (!e) return;
  const jobCount      = JOBS.filter(j => j.equipId === equipId).length;
  const histCount     = HISTORY.filter(h => h.equipId === equipId).length;
  const bdCount       = BREAKDOWNS.filter(b => b.equipId === equipId).length;
  const fuelCount     = FUEL_ENTRIES.filter(f => f.equipId === equipId).length;
  document.getElementById('modal-box').style.maxWidth = '460px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Delete Equipment?</div>
      <button class="icon-btn" id="deq-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:12px;">
        <div style="font-weight:600;font-size:14px;">${e.name}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${e.code} · ${e.type} · ${e.location}</div>
      </div>
      <p style="font-size:13px;color:var(--text-2);margin:0;">
        Permanently remove this equipment and all associated records:
      </p>
      <ul style="font-size:12px;color:var(--text-2);margin:0;padding-left:18px;line-height:2;">
        ${jobCount   > 0 ? `<li>${jobCount} maintenance job${jobCount>1?'s':''}</li>` : ''}
        ${histCount  > 0 ? `<li>${histCount} history record${histCount>1?'s':''}</li>` : ''}
        ${bdCount    > 0 ? `<li>${bdCount} breakdown report${bdCount>1?'s':''}</li>` : ''}
        ${fuelCount  > 0 ? `<li>${fuelCount} fuel log entr${fuelCount>1?'ies':'y'}</li>` : ''}
        ${[jobCount,histCount,bdCount,fuelCount].every(n=>n===0) ? '<li>No associated records</li>' : ''}
      </ul>
      <p style="font-size:12px;color:var(--danger-text);font-weight:500;margin:0;">This action cannot be undone.</p>
    </div>
    <div class="modal-ft">
      <button class="btn" id="deq-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="deq-confirm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        Delete equipment
      </button>
    </div>
  `;

  document.getElementById('deq-close').onclick  = closeModal;
  document.getElementById('deq-cancel').onclick = closeModal;
  document.getElementById('deq-confirm').onclick = () => {
    const name = e.name;
    EQUIPMENT.splice(EQUIPMENT.indexOf(e), 1);
    // Remove all associated records
    [JOBS, HISTORY, BREAKDOWNS, FUEL_ENTRIES].forEach(arr => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].equipId === equipId) arr.splice(i, 1);
      }
    });
    delete FUEL_LOGS[equipId];
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${name} removed`, 'warn');
    go('equipment');
  };
}

function openEditEquipment(equipId) {
  const e = EQUIPMENT.find(eq => eq.id === equipId);
  if (!e) return;
  // Working copy of photos so cancel discards unsaved uploads
  S.editEquipPhotos = { front:null, rear:null, left:null, right:null, ...(e.photos || {}) };
  document.getElementById('modal-box').style.maxWidth = '620px';
  renderEditEquipmentModal(e);
}

function renderEditEquipmentModal(e) {
  const angles = ['front','rear','left','right'];
  openModal(`
    <div class="modal-hd">
      <div class="modal-title">Edit Equipment · ${e.name}</div>
      <button class="icon-btn" id="close-modal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="form-grid">
        <div class="field"><label class="field-label">Equipment name</label><input class="input ee-input" data-field="name" value="${e.name}"></div>
        <div class="field"><label class="field-label">Equipment code</label><input class="input ee-input" data-field="code" value="${e.code}"></div>
        <div class="field">
          <label class="field-label">Type</label>
          <select class="input ee-input" data-field="type">
            <option ${e.type==='Forklift'?'selected':''}>Forklift</option>
            <option ${e.type==='Excavator'?'selected':''}>Excavator</option>
            <option ${e.type==='Skid Steer'?'selected':''}>Skid Steer</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Location</label>
          <select class="input ee-input" data-field="location">
            ${['HQ','AATF 1','AATF 2','Seremban Store'].map(l=>`<option ${e.location===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="field-label">Make</label><input class="input ee-input" data-field="make" value="${e.make}"></div>
        <div class="field"><label class="field-label">Model</label><input class="input ee-input" data-field="model" value="${e.model}"></div>
        <div class="field"><label class="field-label">Engine model</label><input class="input ee-input" data-field="engine" value="${e.engine}"></div>
        <div class="field"><label class="field-label">Fuel type</label>
          <select class="input ee-input" data-field="fuel">
            ${['Diesel','Petrol','Electric','LPG'].map(f=>`<option ${e.fuel===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label class="field-label">Capacity</label><input class="input ee-input" data-field="capacity" value="${e.capacity}"></div>
        <div class="field"><label class="field-label">Operating hours</label><input class="input ee-input" data-field="hours" type="number" value="${e.hours}"></div>
        <div class="field"><label class="field-label">Date of purchase</label><input class="input ee-input" data-field="purchase" type="date" value="${e.purchase || ''}"></div>
      </div>

      <div class="sep"></div>
      <div class="ae-section-label" style="margin-top:2px;">Equipment photos · 4 angles</div>
      <div class="photo-grid">
        ${angles.map(a => {
          const src = S.editEquipPhotos[a];
          const label = a.charAt(0).toUpperCase() + a.slice(1);
          return `
            <div class="photo-box ae-photo-box ee-photo-box" data-angle="${a}" style="cursor:pointer;overflow:hidden;position:relative;">
              ${src
                ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);position:absolute;inset:0;">
                   <div class="photo-replace-overlay">
                     <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                   </div>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:22px;height:22px"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 9h18"/></svg>
                   <span style="font-size:11px;color:var(--text-3);margin-top:2px;">${label}</span>`}
              <input type="file" accept="image/*" class="ee-photo-input" data-angle="${a}" style="display:none;">
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="close-modal-btn">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-primary" id="ee-save-btn">Save changes</button>
    </div>
  `);

  document.getElementById('close-modal').onclick     = closeModal;
  document.getElementById('close-modal-btn').onclick = closeModal;

  document.querySelectorAll('.ee-photo-box').forEach(box => {
    box.addEventListener('click', () => box.querySelector('.ee-photo-input').click());
    box.querySelector('.ee-photo-input').addEventListener('change', ev => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        S.editEquipPhotos[ev.target.dataset.angle] = evt.target.result;
        renderEditEquipmentModal(e);
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById('ee-save-btn').onclick = () => {
    const get = (f) => document.querySelector(`.ee-input[data-field="${f}"]`).value;
    e.name     = get('name').trim();
    e.code     = get('code').trim().toUpperCase();
    e.type     = get('type');
    e.location = get('location');
    e.make     = get('make').trim();
    e.model    = get('model').trim();
    e.engine   = get('engine').trim();
    e.fuel     = get('fuel');
    e.capacity = get('capacity').trim();
    e.hours    = parseInt(get('hours')) || 0;
    e.purchase = get('purchase') || null;
    e.photos   = { ...S.editEquipPhotos };
    S.editEquipPhotos = null;
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Equipment updated');
    setTimeout(() => render(), 200);
  };
}

function openPhotoLightbox(src, label) {
  document.getElementById('modal-box').style.maxWidth = '800px';
  openModal(`
    <div class="modal-hd" style="border-bottom:none;padding-bottom:0;">
      <div class="modal-title" style="font-size:13px;">${label || 'Photo'}</div>
      <button class="icon-btn" id="pl-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="padding-top:8px;">
      <img src="${src}" style="width:100%;height:auto;max-height:70vh;object-fit:contain;border-radius:var(--r-md);display:block;background:var(--neutral-bg);">
    </div>
  `);
  document.getElementById('pl-close').onclick = () => {
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
  };
}

/* ═══════════════════════════════════════════════════════════
   14b. CLOSE JOB (MARK COMPLETE)
   ═══════════════════════════════════════════════════════════ */

function openCloseJob(jobId) {
  const j = JOBS.find(x => x.id === jobId);
  if (!j) return;
  const isFac = j.entityType === 'facility';
  const e = isFac ? getFacility(j.entityId) : EQUIPMENT.find(x => x.id === (j.entityId || j.equipId));
  if (!e) return;
  const parts = isFac ? [] : jobRequiredParts(j);
  const today = new Date().toISOString().slice(0, 10);

  document.getElementById('modal-box').style.maxWidth = '540px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Close Job · ${e.name}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${j.type} · record completion details</div>
      </div>
      <button class="icon-btn" id="cj-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:10px 12px;font-size:12px;display:flex;flex-direction:column;gap:4px;">
        <div class="flex-between"><span class="text-3">${isFac?'Facility':'Equipment'}</span><span style="font-weight:500;">${e.name}${isFac?(' · '+e.type):(' · '+e.code)}</span></div>
        <div class="flex-between"><span class="text-3">Service type</span><span>${j.type}</span></div>
        <div class="flex-between"><span class="text-3">Location</span><span>${j.location}</span></div>
        <div class="flex-between"><span class="text-3">Estimated cost</span><span>${fmtRM(j.estCost)}</span></div>
      </div>

      <div class="field">
        <label class="field-label">Technician <span class="req">*</span></label>
        <input class="input" id="cj-tech" placeholder="Who performed the work?" autocomplete="off">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Date completed <span class="req">*</span></label>
          <input class="input" type="date" id="cj-date" value="${today}">
        </div>
        <div class="field">
          <label class="field-label">Duration</label>
          <div style="display:flex;gap:6px;align-items:center;">
            <input class="input" type="number" id="cj-hrs" placeholder="2" min="0" step="1" style="width:70px;">
            <span style="font-size:12px;color:var(--text-3);">h</span>
            <input class="input" type="number" id="cj-min" placeholder="15" min="0" max="59" step="1" style="width:70px;">
            <span style="font-size:12px;color:var(--text-3);">m</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Actual cost (RM) <span class="req">*</span></label>
          <input class="input" type="number" id="cj-cost" value="${j.estCost || ''}" min="0" step="1">
        </div>
        ${isFac ? '' : j.basis === 'hour' ? `
          <div class="field">
            <label class="field-label">Meter reading (op. hrs) <span class="req">*</span></label>
            <input class="input" type="number" id="cj-meter" value="${e.hours}" min="${e.hours}" step="1">
            <div class="field-hint">Current reading: ${e.hours.toLocaleString()} hrs · cannot go backwards</div>
          </div>
        ` : `
          <div class="field">
            <label class="field-label">Meter reading (op. hrs) <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
            <input class="input" type="number" id="cj-meter" placeholder="${e.hours}" min="${e.hours}" step="1">
            <div class="field-hint">Current: ${e.hours.toLocaleString()} hrs · update if different</div>
          </div>
        `}
      </div>

      ${parts.length > 0 ? `
        <div>
          <div class="ae-section-label">Parts consumed — stock will be deducted</div>
          <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:4px 12px;font-size:11.5px;">
            ${parts.map((rp, i) => {
              const p = rp.part;
              const after = Math.max(0, p.stock - rp.qty);
              const willBeLow = after <= p.minStock;
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;${i>0?'border-top:0.5px solid var(--border)':''}">
                  <span>${p.name} <span class="code">${p.code}</span></span>
                  <span>
                    <strong>− ${rp.qty} ${p.unit}</strong>
                    <span style="color:var(--text-3);margin-left:6px;">${p.stock} → ${after}</span>
                    ${willBeLow && after > 0 ? `<span class="pill pill-warning" style="margin-left:6px;">Low after</span>` : ''}
                    ${after === 0 ? `<span class="pill pill-danger" style="margin-left:6px;">Out after</span>` : ''}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="field">
        <label class="field-label">Notes <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
        <textarea class="input" id="cj-notes" rows="2" placeholder="What was done? Any issues encountered?"></textarea>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="cj-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--ok-text);border-color:var(--ok-text);color:white;font-weight:600;" id="cj-confirm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>
        Close job
      </button>
    </div>
  `;

  document.getElementById('cj-close').onclick  = closeModal;
  document.getElementById('cj-cancel').onclick = closeModal;
  document.getElementById('cj-confirm').onclick = () => {
    const tech  = document.getElementById('cj-tech').value.trim();
    const date  = document.getElementById('cj-date').value;
    const hrs   = parseInt(document.getElementById('cj-hrs').value) || 0;
    const min   = parseInt(document.getElementById('cj-min').value) || 0;
    const cost  = parseFloat(document.getElementById('cj-cost').value);
    const meterField = document.getElementById('cj-meter');
    const meter = meterField && meterField.value !== '' ? parseInt(meterField.value) : null;
    const notes = document.getElementById('cj-notes').value.trim();

    if (!tech) { document.getElementById('cj-tech').focus(); toast('Technician name required', 'error'); return; }
    if (!date) { document.getElementById('cj-date').focus(); toast('Completion date required', 'error'); return; }
    if (isNaN(cost) || cost < 0) { document.getElementById('cj-cost').focus(); toast('Enter a valid cost', 'error'); return; }
    if (j.basis === 'hour' && (meter === null || meter < e.hours)) {
      meterField.focus();
      toast(`Meter reading must be ≥ ${e.hours}`, 'error');
      return;
    }

    const duration = (hrs > 0 || min > 0)
      ? `${hrs}h ${String(min).padStart(2,'0')}m`
      : '—';

    HISTORY.unshift({
      id:        'h-' + Date.now(),
      entityType: isFac ? 'facility' : 'equipment',
      entityId:   isFac ? e.id : (j.entityId || j.equipId),
      equipId:   isFac ? null : (j.entityId || j.equipId),
      equipCode: j.equipCode,
      equipName: j.equipName,
      type:      j.type,
      date,
      duration,
      cost:      Math.round(cost),
      parts:     parts.length,
      tech,
      status:    'completed',
      notes:     notes || null,
    });

    parts.forEach(rp => {
      const p = PARTS.find(x => x.id === rp.partId);
      if (p) p.stock = Math.max(0, p.stock - rp.qty);
    });

    if (!isFac && meter !== null) e.hours = meter;

    JOBS.splice(JOBS.indexOf(j), 1);
    S.checks = {};

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${e.name} · ${j.type} completed · logged to history`);
    setTimeout(() => go('maintenance'), 400);
  };
}

function openReportBreakdown(equipId) {
  const preselect = equipId || '';
  document.getElementById('modal-box').style.maxWidth = '520px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title" style="color:var(--bd-text);">Report Equipment Breakdown</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Laporan kerosakan peralatan</div>
      </div>
      <button class="icon-btn" id="bd-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Equipment <span class="req">*</span></label>
        <select class="input" id="bd-equip">
          <option value="">Select equipment…</option>
          ${EQUIPMENT.map(e => `<option value="${e.id}" ${e.id===preselect?'selected':''}>${e.code} · ${e.name} · ${e.location}</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Date <span class="req">*</span></label>
          <input class="input" type="date" id="bd-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="field">
          <label class="field-label">Time <span class="req">*</span></label>
          <input class="input" type="time" id="bd-time" value="${new Date().toTimeString().slice(0,5)}">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Describe the problem <span class="req">*</span></label>
        <textarea class="input" id="bd-desc" rows="3" placeholder="What happened? What symptoms are you seeing? Is equipment still operable?"></textarea>
      </div>
      <div class="field">
        <label class="field-label">Severity <span class="req">*</span></label>
        <div class="bd-severity-opts" id="bd-severity">
          <label class="severity-opt" data-val="low">
            <input type="radio" name="bd-sev" value="low">
            <div class="sev-card">
              <div class="sev-title" style="color:var(--warn-text);">Low</div>
              <div class="sev-desc">Still operable with caution</div>
            </div>
          </label>
          <label class="severity-opt" data-val="high">
            <input type="radio" name="bd-sev" value="high" checked>
            <div class="sev-card sev-active">
              <div class="sev-title" style="color:var(--danger-text);">High</div>
              <div class="sev-desc">Cannot operate — stop use</div>
            </div>
          </label>
          <label class="severity-opt" data-val="critical">
            <input type="radio" name="bd-sev" value="critical">
            <div class="sev-card">
              <div class="sev-title" style="color:var(--bd-text);">Critical</div>
              <div class="sev-desc">Safety risk — isolate immediately</div>
            </div>
          </label>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Reported by <span class="req">*</span></label>
        <input class="input" id="bd-reporter" placeholder="Your name" autocomplete="off">
      </div>
      <div class="field">
        <label class="field-label">Immediate action taken <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
        <textarea class="input" id="bd-action" rows="2" placeholder="e.g. Equipment stopped and cordoned off. Supervisor notified."></textarea>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="bd-cancel-btn">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--bd-text);border-color:var(--bd-text);color:white;font-weight:600;" id="bd-submit-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        Submit breakdown report
      </button>
    </div>
  `;

  document.getElementById('bd-close').onclick    = closeModal;
  document.getElementById('bd-cancel-btn').onclick = closeModal;

  // Severity card highlight on select
  document.querySelectorAll('input[name="bd-sev"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.sev-card').forEach(c => c.classList.remove('sev-active'));
      radio.closest('.severity-opt').querySelector('.sev-card').classList.add('sev-active');
    });
  });

  document.getElementById('bd-submit-btn').onclick = () => {
    const equipId  = document.getElementById('bd-equip').value;
    const desc     = document.getElementById('bd-desc').value.trim();
    const reporter = document.getElementById('bd-reporter').value.trim();
    if (!equipId)  { document.getElementById('bd-equip').focus(); toast('Select equipment', 'error'); return; }
    if (!desc)     { document.getElementById('bd-desc').focus();  toast('Describe the problem', 'error'); return; }
    if (!reporter) { document.getElementById('bd-reporter').focus(); toast('Enter your name', 'error'); return; }
    saveBreakdown({
      equipId,
      date:       document.getElementById('bd-date').value,
      time:       document.getElementById('bd-time').value,
      description: desc + (document.getElementById('bd-action').value.trim() ? '\n\nImmediate action: ' + document.getElementById('bd-action').value.trim() : ''),
      severity:   document.querySelector('input[name="bd-sev"]:checked').value,
      reportedBy: reporter,
    });
  };
}

function saveBreakdown(data) {
  const equip = EQUIPMENT.find(e => e.id === data.equipId);
  if (!equip) return;

  const newBd = {
    id: 'bd-' + Date.now(),
    equipId:     equip.id,
    equipCode:   equip.code,
    equipName:   equip.name,
    date:        data.date,
    time:        data.time,
    reportedBy:  data.reportedBy,
    description: data.description,
    severity:    data.severity,
    status:      'active',
    resolvedDate: null, resolvedBy: null, resolutionNotes: null,
  };

  BREAKDOWNS.unshift(newBd);
  equip.status = 'breakdown';

  closeModal();
  document.getElementById('modal-box').style.maxWidth = '';
  toast(`Breakdown reported · ${equip.name}`, 'warn');

  // Navigate to equipment detail to see the breakdown
  setTimeout(() => go('equipment-detail', { selectedEquipment: equip.id }), 400);
}

function openResolveBreakdown(bdId) {
  const bd = BREAKDOWNS.find(b => b.id === bdId);
  if (!bd) return;
  document.getElementById('modal-box').style.maxWidth = '480px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Mark Breakdown Resolved</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${bd.equipName} · ${fmtDate(bd.date)}</div>
      </div>
      <button class="icon-btn" id="res-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="alert-banner alert-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <div>Marking as resolved will set equipment status back to <strong>operational</strong>.</div>
      </div>
      <div style="background:var(--neutral-bg);border-radius:var(--r-md);padding:12px;font-size:12px;">
        <div style="font-weight:600;margin-bottom:4px;">Reported problem</div>
        <div style="color:var(--text-2);line-height:1.5;">${bd.description}</div>
      </div>
      <div class="field">
        <label class="field-label">Resolution notes <span class="req">*</span></label>
        <textarea class="input" id="res-notes" rows="3" placeholder="What was the root cause? What was done to fix it? Any parts replaced?"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Resolved by <span class="req">*</span></label>
          <input class="input" id="res-by" placeholder="Technician name" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">Resolution date</label>
          <input class="input" type="date" id="res-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="res-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn btn-success" style="background:var(--ok-text);border-color:var(--ok-text);color:white;font-weight:600;" id="res-submit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>
        Confirm resolved
      </button>
    </div>
  `;

  document.getElementById('res-close').onclick  = closeModal;
  document.getElementById('res-cancel').onclick = closeModal;
  document.getElementById('res-submit').onclick = () => {
    const notes = document.getElementById('res-notes').value.trim();
    const by    = document.getElementById('res-by').value.trim();
    if (!notes) { document.getElementById('res-notes').focus(); toast('Enter resolution notes', 'error'); return; }
    if (!by)    { document.getElementById('res-by').focus();    toast('Enter technician name', 'error'); return; }

    bd.status           = 'resolved';
    bd.resolutionNotes  = notes;
    bd.resolvedBy       = by;
    bd.resolvedDate     = document.getElementById('res-date').value;

    // Restore equipment status
    const equip = EQUIPMENT.find(e => e.id === bd.equipId);
    if (equip) equip.status = 'ok';

    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast(`${bd.equipName} marked as resolved`, 'success');
    setTimeout(() => render(), 300);
  };
}

function openEditBreakdown(bdId) {
  const bd = BREAKDOWNS.find(b => b.id === bdId);
  if (!bd) return;
  const descParts = bd.description.split('\n\nImmediate action: ');
  const descMain   = descParts[0];
  const descAction = descParts[1] || '';
  document.getElementById('modal-box').style.maxWidth = '520px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title" style="color:var(--bd-text);">Edit Breakdown Report</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">${bd.equipName} · ${fmtDate(bd.date)}</div>
      </div>
      <button class="icon-btn" id="ebd-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Date <span class="req">*</span></label>
          <input class="input" type="date" id="ebd-date" value="${bd.date}">
        </div>
        <div class="field">
          <label class="field-label">Time <span class="req">*</span></label>
          <input class="input" type="time" id="ebd-time" value="${bd.time}">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Description <span class="req">*</span></label>
        <textarea class="input" id="ebd-desc" rows="3">${descMain}</textarea>
      </div>
      <div class="field">
        <label class="field-label">Severity <span class="req">*</span></label>
        <div class="bd-severity-opts" id="ebd-severity">
          <label class="severity-opt" data-val="low">
            <input type="radio" name="ebd-sev" value="low" ${bd.severity==='low'?'checked':''}>
            <div class="sev-card ${bd.severity==='low'?'sev-active':''}">
              <div class="sev-title" style="color:var(--warn-text);">Low</div>
              <div class="sev-desc">Still operable with caution</div>
            </div>
          </label>
          <label class="severity-opt" data-val="high">
            <input type="radio" name="ebd-sev" value="high" ${bd.severity==='high'?'checked':''}>
            <div class="sev-card ${bd.severity==='high'?'sev-active':''}">
              <div class="sev-title" style="color:var(--danger-text);">High</div>
              <div class="sev-desc">Cannot operate — stop use</div>
            </div>
          </label>
          <label class="severity-opt" data-val="critical">
            <input type="radio" name="ebd-sev" value="critical" ${bd.severity==='critical'?'checked':''}>
            <div class="sev-card ${bd.severity==='critical'?'sev-active':''}">
              <div class="sev-title" style="color:var(--bd-text);">Critical</div>
              <div class="sev-desc">Safety risk — isolate immediately</div>
            </div>
          </label>
        </div>
      </div>
      <div class="field">
        <label class="field-label">Reported by <span class="req">*</span></label>
        <input class="input" id="ebd-reporter" value="${bd.reportedBy}" autocomplete="off">
      </div>
      <div class="field">
        <label class="field-label">Immediate action taken <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
        <textarea class="input" id="ebd-action" rows="2">${descAction}</textarea>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="ebd-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--bd-text);border-color:var(--bd-text);color:white;font-weight:600;" id="ebd-save">Save changes</button>
    </div>
  `;

  document.getElementById('ebd-close').onclick  = closeModal;
  document.getElementById('ebd-cancel').onclick = closeModal;

  document.querySelectorAll('input[name="ebd-sev"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('#ebd-severity .sev-card').forEach(c => c.classList.remove('sev-active'));
      radio.closest('.severity-opt').querySelector('.sev-card').classList.add('sev-active');
    });
  });

  document.getElementById('ebd-save').onclick = () => {
    const desc     = document.getElementById('ebd-desc').value.trim();
    const reporter = document.getElementById('ebd-reporter').value.trim();
    if (!desc)     { document.getElementById('ebd-desc').focus();     toast('Enter description', 'error'); return; }
    if (!reporter) { document.getElementById('ebd-reporter').focus(); toast('Enter reporter name', 'error'); return; }
    const action = document.getElementById('ebd-action').value.trim();
    bd.date        = document.getElementById('ebd-date').value;
    bd.time        = document.getElementById('ebd-time').value;
    bd.description = desc + (action ? '\n\nImmediate action: ' + action : '');
    bd.severity    = document.querySelector('input[name="ebd-sev"]:checked').value;
    bd.reportedBy  = reporter;
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Breakdown report updated');
    setTimeout(() => render(), 300);
  };
}

function openDeleteBreakdown(bdId) {
  const bd = BREAKDOWNS.find(b => b.id === bdId);
  if (!bd) return;
  document.getElementById('modal-box').style.maxWidth = '440px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div class="modal-title">Delete Breakdown Report?</div>
      <button class="icon-btn" id="dbd-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--text-2);margin:0 0 8px;">
        Permanently remove the breakdown report for <strong>${bd.equipName}</strong> reported on ${fmtDate(bd.date)}?
      </p>
      ${bd.status === 'active' ? `
        <p style="font-size:12px;color:var(--danger-text);font-weight:500;margin:0;">
          Equipment status will be reset to operational.
        </p>` : ''}
    </div>
    <div class="modal-ft">
      <button class="btn" id="dbd-cancel">Cancel</button>
      <div style="flex:1"></div>
      <button class="btn" style="background:var(--danger-text);border-color:var(--danger-text);color:white;font-weight:600;" id="dbd-confirm">
        Delete report
      </button>
    </div>
  `;

  document.getElementById('dbd-close').onclick  = closeModal;
  document.getElementById('dbd-cancel').onclick = closeModal;
  document.getElementById('dbd-confirm').onclick = () => {
    const wasActive = bd.status === 'active';
    const equipId   = bd.equipId;
    BREAKDOWNS.splice(BREAKDOWNS.indexOf(bd), 1);
    if (wasActive) {
      const stillActive = BREAKDOWNS.some(b => b.equipId === equipId && b.status === 'active');
      if (!stillActive) {
        const equip = EQUIPMENT.find(e => e.id === equipId);
        if (equip) equip.status = 'ok';
      }
    }
    closeModal();
    document.getElementById('modal-box').style.maxWidth = '';
    toast('Breakdown report deleted', 'warn');
    setTimeout(() => render(), 300);
  };
}

function openLogFuel(equipId) {
  const preselect = equipId || '';
  document.getElementById('modal-box').style.maxWidth = '500px';
  openModal('');
  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Log Fuel Consumption</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Rekod penggunaan bahan api</div>
      </div>
      <button class="icon-btn" id="lf-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px;">
      <div class="field">
        <label class="field-label">Equipment <span class="req">*</span></label>
        <select class="input" id="lf-equip">
          <option value="">Select equipment…</option>
          ${EQUIPMENT.filter(e => e.fuel !== 'Electric').map(e => `<option value="${e.id}" ${e.id===preselect?'selected':''}>${e.code} · ${e.name} (${e.fuel})</option>`).join('')}
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Date <span class="req">*</span></label>
          <input class="input" type="date" id="lf-date" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="field">
          <label class="field-label">Litres filled <span class="req">*</span></label>
          <input class="input" type="number" id="lf-litres" placeholder="e.g. 200" min="0.1" step="0.1">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="field">
          <label class="field-label">Operating hours at refuel</label>
          <input class="input" type="number" id="lf-hours" placeholder="e.g. 4521" min="0" step="1">
        </div>
        <div class="field">
          <label class="field-label">Price per litre (RM)</label>
          <input class="input" type="number" id="lf-price" placeholder="e.g. 2.85" min="0" step="0.01">
        </div>
      </div>
      <div class="field">
        <label class="field-label">Refuelled by</label>
        <input class="input" id="lf-by" placeholder="Operator / technician name" autocomplete="off">
      </div>
      <div class="field">
        <label class="field-label">Notes <span style="font-weight:400;color:var(--text-4)">(optional)</span></label>
        <textarea class="input" id="lf-notes" rows="2" placeholder="e.g. Tank full before long shift. Unusual consumption noted."></textarea>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn" id="lf-cancel">Cancel</button>
      <div id="lf-cost-preview" style="font-size:12px;color:var(--text-3);flex:1;text-align:center;"></div>
      <button class="btn btn-primary" id="lf-save">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>
        Save entry
      </button>
    </div>
  `;

  document.getElementById('lf-close').onclick  = closeModal;
  document.getElementById('lf-cancel').onclick = closeModal;

  function updateCostPreview() {
    const l = parseFloat(document.getElementById('lf-litres').value) || 0;
    const p = parseFloat(document.getElementById('lf-price').value)  || 0;
    document.getElementById('lf-cost-preview').textContent =
      l && p ? `Est. total: RM ${(l * p).toFixed(2)}` : '';
  }
  document.getElementById('lf-litres').addEventListener('input', updateCostPreview);
  document.getElementById('lf-price').addEventListener('input', updateCostPreview);

  document.getElementById('lf-save').onclick = () => {
    const equipId = document.getElementById('lf-equip').value;
    const litres  = parseFloat(document.getElementById('lf-litres').value);
    if (!equipId)        { document.getElementById('lf-equip').focus();  toast('Select equipment', 'error'); return; }
    if (!litres || litres <= 0) { document.getElementById('lf-litres').focus(); toast('Enter litres filled', 'error'); return; }
    const price = parseFloat(document.getElementById('lf-price').value) || null;
    saveFuelEntry({
      equipId,
      date:           document.getElementById('lf-date').value,
      litres,
      operatingHours: parseFloat(document.getElementById('lf-hours').value) || null,
      pricePerLitre:  price,
      totalCost:      price ? Math.round(litres * price * 100) / 100 : null,
      refuelledBy:    document.getElementById('lf-by').value.trim() || null,
      notes:          document.getElementById('lf-notes').value.trim() || null,
    });
  };
}

function saveFuelEntry(data) {
  const equip = EQUIPMENT.find(e => e.id === data.equipId);
  if (!equip) return;
  FUEL_ENTRIES.unshift({
    id:             'fe-' + Date.now(),
    equipId:        equip.id,
    equipCode:      equip.code,
    equipName:      equip.name,
    date:           data.date,
    litres:         data.litres,
    operatingHours: data.operatingHours,
    pricePerLitre:  data.pricePerLitre,
    totalCost:      data.totalCost,
    refuelledBy:    data.refuelledBy,
    notes:          data.notes,
  });
  const slot = fuelMonthSlot(data.date);
  if (slot >= 0) {
    if (!FUEL_LOGS[equip.id]) FUEL_LOGS[equip.id] = [0, 0, 0, 0, 0, 0];
    FUEL_LOGS[equip.id][slot] += data.litres;
  }
  closeModal();
  document.getElementById('modal-box').style.maxWidth = '';
  toast(`Fuel logged · ${equip.name} · ${data.litres} L`, 'success');
  setTimeout(() => render(), 300);
}

/* ═══════════════════════════════════════════════════════════
   16. ADD EQUIPMENT WIZARD
   ═══════════════════════════════════════════════════════════ */

const AE_LOCATIONS = ['HQ', 'AATF 1', 'AATF 2', 'Seremban Store', 'Nilai Store', 'Bandar Tek Store', 'Melaka'];
const AE_TYPES     = ['Forklift', 'Excavator', 'Skid Steer', 'Crane', 'Machinery', 'Other'];
const AE_FUELS     = ['Diesel', 'Petrol', 'Electric', 'LPG'];
const AE_MAKES     = ['Toyota', 'Komatsu', 'Nissan', 'Kobelco', 'Sunward', 'TCM', 'Mitsubishi', 'Hyster', 'Crown', 'Other'];

function blankEquipData() {
  return { name:'', code:'', type:'Forklift', location:'HQ', make:'', model:'', engine:'', fuel:'Diesel', capacity:'', purchase:'', hours:'', photos:{ front:null, rear:null, left:null, right:null } };
}

function openAddEquipment() {
  S.addEquipStep = 1;
  S.addEquipData = blankEquipData();
  document.getElementById('modal-box').style.maxWidth = '580px';
  openModal('');
  renderAddEquipModal();
}

function renderAddEquipModal() {
  const step = S.addEquipStep;
  const d    = S.addEquipData;

  const stepDefs = ['Basic info', 'Specifications', 'Photos & review'];
  const wizardHtml = `
    <div class="wizard-bar">
      ${stepDefs.map((label, i) => {
        const n = i + 1;
        const cls = n === step ? 'active' : n < step ? 'done' : '';
        return `
          <div class="wz-step ${cls}">
            <div class="wz-dot">${n < step ? '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>' : n}</div>
            <span class="wz-label">${label}</span>
          </div>
          ${i < stepDefs.length - 1 ? `<div class="wz-line ${n < step ? 'done' : ''}"></div>` : ''}
        `;
      }).join('')}
    </div>`;

  let body = '';

  if (step === 1) {
    body = `
      <div class="ae-section-label">Identity</div>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Equipment name <span class="req">*</span></label>
          <input class="input ae-input" data-field="name" value="${esc(d.name)}" placeholder="e.g. Forklift 7" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">Equipment code <span class="req">*</span></label>
          <input class="input ae-input" data-field="code" value="${esc(d.code)}" placeholder="e.g. FL-007" autocomplete="off">
          <div class="field-hint">Must be unique across all equipment</div>
        </div>
        <div class="field">
          <label class="field-label">Type <span class="req">*</span></label>
          <select class="input ae-input" data-field="type">
            ${AE_TYPES.map(t => `<option value="${t}" ${d.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Location <span class="req">*</span></label>
          <select class="input ae-input" data-field="location">
            ${AE_LOCATIONS.map(l => `<option value="${l}" ${d.location===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>`;

  } else if (step === 2) {
    body = `
      <div class="ae-section-label">Technical specifications</div>
      <div class="form-grid">
        <div class="field">
          <label class="field-label">Make / Brand <span class="req">*</span></label>
          <input class="input ae-input" data-field="make" list="ae-makes-list" value="${esc(d.make)}" placeholder="e.g. Toyota" autocomplete="off">
          <datalist id="ae-makes-list">${AE_MAKES.map(m=>`<option value="${m}">`).join('')}</datalist>
        </div>
        <div class="field">
          <label class="field-label">Model <span class="req">*</span></label>
          <input class="input ae-input" data-field="model" value="${esc(d.model)}" placeholder="e.g. 02-FDE35" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">Engine model</label>
          <input class="input ae-input" data-field="engine" value="${esc(d.engine)}" placeholder="e.g. 1DZ-II" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">Fuel type <span class="req">*</span></label>
          <select class="input ae-input" data-field="fuel">
            ${AE_FUELS.map(f => `<option value="${f}" ${d.fuel===f?'selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Capacity / Tonnage</label>
          <input class="input ae-input" data-field="capacity" value="${esc(d.capacity)}" placeholder="e.g. 3.5 ton" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label">Date of purchase</label>
          <input class="input ae-input" type="date" data-field="purchase" value="${d.purchase}">
        </div>
        <div class="field span-2">
          <label class="field-label">Current operating hours <span class="req">*</span></label>
          <input class="input ae-input" type="number" data-field="hours" value="${d.hours}" placeholder="e.g. 1250" min="0">
        </div>
      </div>`;

  } else {
    const angles = ['front','rear','left','right'];
    body = `
      <div class="ae-section-label">Equipment photos · 4 angles <span style="font-weight:400;color:var(--text-3)">(optional)</span></div>
      <div class="photo-grid" style="margin-bottom:16px;">
        ${angles.map(a => `
          <div class="photo-box ae-photo-box" data-angle="${a}" style="cursor:pointer;overflow:hidden;position:relative;">
            ${d.photos[a]
              ? `<img src="${d.photos[a]}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-md);position:absolute;inset:0;">
                 <div class="photo-replace-overlay">
                   <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                 </div>`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:22px;height:22px"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 9h18"/></svg>
                 <span style="font-size:11px;color:var(--text-3);margin-top:2px;">${a.charAt(0).toUpperCase()+a.slice(1)}</span>`}
            <input type="file" accept="image/*" class="ae-photo-input" data-angle="${a}" style="display:none;">
          </div>
        `).join('')}
      </div>

      <div class="sep"></div>
      <div class="ae-section-label" style="margin-top:12px;">Review before saving</div>
      <div class="ae-review-grid">
        ${[
          ['Name',         d.name     || '—'],
          ['Code',         d.code     || '—'],
          ['Type',         d.type],
          ['Location',     d.location],
          ['Make',         d.make     || '—'],
          ['Model',        d.model    || '—'],
          ['Engine',       d.engine   || '—'],
          ['Fuel',         d.fuel],
          ['Capacity',     d.capacity || '—'],
          ['Purchase date',d.purchase ? fmtDate(d.purchase) : '—'],
          ['Op. hours',    d.hours    ? d.hours + ' hrs' : '—'],
        ].map(([l, v]) => `
          <div class="ae-review-item">
            <div class="ae-review-label">${l}</div>
            <div class="ae-review-val">${v}</div>
          </div>`).join('')}
      </div>`;
  }

  const footerLeft  = step > 1
    ? `<button class="btn ae-back">← Back</button>`
    : `<button class="btn ae-cancel">Cancel</button>`;
  const footerRight = step < 3
    ? `<button class="btn btn-primary ae-next">Continue →</button>`
    : `<button class="btn btn-primary ae-save">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg>
         Save equipment
       </button>`;

  document.getElementById('modal-inner').innerHTML = `
    <div class="modal-hd">
      <div>
        <div class="modal-title">Add New Equipment</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:1px;">Step ${step} of 3 · ${stepDefs[step-1]}</div>
      </div>
      <button class="icon-btn ae-close-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    ${wizardHtml}
    <div class="modal-body">${body}</div>
    <div class="modal-ft">${footerLeft}<div style="flex:1"></div>${footerRight}</div>
  `;

  bindAddEquipHandlers();
}

function bindAddEquipHandlers() {
  const inner = document.getElementById('modal-inner');

  inner.querySelector('.ae-close-btn').onclick = closeModal;

  const cancelBtn = inner.querySelector('.ae-cancel');
  if (cancelBtn) cancelBtn.onclick = closeModal;

  // Live-sync all text/select inputs to state
  inner.querySelectorAll('.ae-input').forEach(inp => {
    ['input', 'change'].forEach(ev => {
      inp.addEventListener(ev, () => {
        S.addEquipData[inp.dataset.field] = inp.value;
      });
    });
  });

  // Photo boxes
  inner.querySelectorAll('.ae-photo-box').forEach(box => {
    box.addEventListener('click', () => box.querySelector('.ae-photo-input').click());
    box.querySelector('.ae-photo-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        S.addEquipData.photos[e.target.dataset.angle] = ev.target.result;
        renderAddEquipModal();
      };
      reader.readAsDataURL(file);
    });
  });

  // Next button
  const nextBtn = inner.querySelector('.ae-next');
  if (nextBtn) nextBtn.onclick = () => {
    collectAEInputs();
    if (!validateAEStep(S.addEquipStep)) return;
    S.addEquipStep++;
    renderAddEquipModal();
  };

  // Back button
  const backBtn = inner.querySelector('.ae-back');
  if (backBtn) backBtn.onclick = () => {
    collectAEInputs();
    S.addEquipStep--;
    renderAddEquipModal();
  };

  // Save button
  const saveBtn = inner.querySelector('.ae-save');
  if (saveBtn) saveBtn.onclick = () => saveNewEquipment();
}

function collectAEInputs() {
  document.querySelectorAll('.ae-input').forEach(inp => {
    if (inp.dataset.field) S.addEquipData[inp.dataset.field] = inp.value;
  });
}

function validateAEStep(step) {
  const d = S.addEquipData;
  if (step === 1) {
    if (!d.name.trim())  return aeError('name',  'Equipment name is required');
    if (!d.code.trim())  return aeError('code',  'Equipment code is required');
    if (EQUIPMENT.some(e => e.code.trim().toUpperCase() === d.code.trim().toUpperCase()))
      return aeError('code', `Code "${d.code.toUpperCase()}" already exists`);
  }
  if (step === 2) {
    if (!d.make.trim())  return aeError('make',  'Make / Brand is required');
    if (!d.model.trim()) return aeError('model', 'Model is required');
    if (!String(d.hours).trim()) return aeError('hours', 'Operating hours is required');
    if (isNaN(parseInt(d.hours)) || parseInt(d.hours) < 0)
      return aeError('hours', 'Enter a valid number (0 or more)');
  }
  return true;
}

function aeError(field, msg) {
  const inp = document.querySelector(`.ae-input[data-field="${field}"]`);
  if (inp) {
    inp.style.borderColor = 'var(--danger-text)';
    inp.style.boxShadow   = '0 0 0 3px rgba(163,45,45,0.12)';
    inp.focus();
    let err = inp.closest('.field').querySelector('.ae-err');
    if (!err) {
      err = document.createElement('div');
      err.className = 'ae-err';
      inp.closest('.field').appendChild(err);
    }
    err.textContent = msg;
    inp.addEventListener('input', () => {
      inp.style.borderColor = '';
      inp.style.boxShadow   = '';
      if (err) err.remove();
    }, { once: true });
  }
  return false;
}

function saveNewEquipment() {
  collectAEInputs();
  const d  = S.addEquipData;
  const id = 'eq-' + Date.now();

  const newEquip = {
    id,
    name:     d.name.trim(),
    code:     d.code.trim().toUpperCase(),
    type:     d.type,
    location: d.location,
    make:     d.make.trim(),
    model:    d.model.trim(),
    fuel:     d.fuel,
    capacity: d.capacity.trim() || '—',
    engine:   d.engine.trim()   || '—',
    purchase: d.purchase || null,
    hours:    parseInt(d.hours) || 0,
    status:   'ok',
    photos:   { front: d.photos.front, rear: d.photos.rear, left: d.photos.left, right: d.photos.right },
  };

  EQUIPMENT.push(newEquip);
  FUEL_LOGS[id] = [0, 0, 0, 0, 0, 0];

  const badge = document.getElementById('nav-count-equipment');
  if (badge) badge.textContent = EQUIPMENT.length;

  closeModal();
  document.getElementById('modal-box').style.maxWidth = '';
  toast(`${newEquip.name} added · ${newEquip.code}`);
  setTimeout(() => go('equipment-detail', { selectedEquipment: id }), 350);
}

/* ═══════════════════════════════════════════════════════════
   16. EVENT HANDLERS
   ═══════════════════════════════════════════════════════════ */

function attachHandlers() {
  // Kebab menus: click the ⋮ button toggles dropdown.
  // The dropdown is moved to <body> when opened so it escapes any overflow container
  // or transform-based containing block. Restored to its original parent when closed.
  document.querySelectorAll('[data-kebab-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const menu = btn.closest('.kebab-menu');
      const dropdown = menu.querySelector('.kebab-dropdown') || menu._kebabDropdown;
      const wasOpen = menu.classList.contains('open');
      closeAllKebabs();
      if (!wasOpen) {
        menu.classList.add('open');
        menu._kebabDropdown = dropdown;
        // Move dropdown to body so it escapes any transformed/overflow ancestor
        document.body.appendChild(dropdown);
        const rect = btn.getBoundingClientRect();
        const dropdownWidth = 160;
        // Default: align dropdown's right edge with button's right edge
        let leftPx = rect.right - dropdownWidth;
        // If that pushes the left edge off-screen, align with button's left edge instead
        if (leftPx < 8) leftPx = Math.max(8, rect.left);
        dropdown.style.position = 'fixed';
        dropdown.style.left     = leftPx + 'px';
        dropdown.style.right    = 'auto';

        // Measure dropdown height to decide: drop below (default) or flip above
        const dropdownHeight = dropdown.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < dropdownHeight + 12 && spaceAbove > dropdownHeight + 12) {
          // Flip upward — appear above the button
          dropdown.style.top = (rect.top - dropdownHeight - 6) + 'px';
          dropdown.classList.add('drop-up');
        } else {
          // Drop below (default)
          dropdown.style.top = (rect.bottom + 6) + 'px';
          dropdown.classList.remove('drop-up');
        }

        // Required because dropdown is now outside `.kebab-menu.open` in the DOM
        dropdown.classList.add('is-open');
      }
    });
  });

  // When a kebab action is clicked, close the menu before the action fires
  document.querySelectorAll('.kebab-item').forEach(item => {
    item.addEventListener('click', () => closeAllKebabs());
  });

  // Login form submission (only present when logged out)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email    = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      handleLogin(email, password);
    });
    const emailEl = document.getElementById('login-email');
    if (emailEl) setTimeout(() => emailEl.focus(), 50);
    return; // skip binding the rest of the app while logged out
  }

  // Navigation via data-nav
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const page = el.dataset.nav;
      const job  = el.dataset.job;
      const equip= el.dataset.equip;
      const fac  = el.dataset.facility;
      if (job)   S.selectedJob = job;
      if (equip) S.selectedEquipment = equip;
      if (fac)   S.selectedFacility = fac;
      go(page);
    });
  });

  // Checklist toggle
  document.querySelectorAll('[data-check]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id = el.dataset.check;
      S.checks[id] = !S.checks[id];
      render();
    });
  });

  // Action buttons
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', () => {
      const act = el.dataset.action;
      if (act === 'cancel-schedule') {
        S.scheduleForm = null;
        go('maintenance');
      } else if (act === 'save-schedule') {
        const sf = S.scheduleForm;
        if (!sf) return;
        const isFac = sf.entityType === 'facility';
        if (isFac && !sf.facilityId) { toast('Select facility first', 'error'); return; }
        if (!isFac && !sf.equipId)   { toast('Select equipment first', 'error'); return; }
        const basis = isFac ? 'time' : sf.basis;
        if (basis === 'time' && !sf.dueDate)  { toast('Set a due date', 'error'); return; }
        if (basis === 'hour' && !sf.dueHours) { toast('Set due hours', 'error'); return; }
        if (sf.type === 'Custom' && !(sf.customType || '').trim()) { toast('Enter a custom type label', 'error'); return; }
        const entity = isFac ? getFacility(sf.facilityId) : EQUIPMENT.find(x => x.id === sf.equipId);
        const effectiveType = sf.type === 'Custom' ? sf.customType.trim() : sf.type;
        const newJob = {
          id: 'job-' + Date.now(),
          entityType:    isFac ? 'facility' : 'equipment',
          entityId:      entity.id,
          equipId:       isFac ? null : entity.id,
          equipName:     entity.name,
          equipCode:     isFac ? entity.type : entity.code,
          type:          effectiveType,
          basis,
          dueHours:      basis === 'hour' ? parseInt(sf.dueHours) : null,
          currentHours:  isFac ? null : entity.hours,
          dueDate:       basis === 'time' ? sf.dueDate : null,
          status:        'upcoming',
          priority:      effectiveType === 'Major Service' ? 'high' : effectiveType === 'Minor Service' ? 'medium' : 'low',
          location:      entity.location,
          started:       null,
          checklistId:   sf.checklistId || null,
          estCost:       parseInt(sf.estCost) || 0,
          requiredPartIds: isFac ? [] : [...sf.requiredPartIds],
          notes:         sf.notes,
        };
        JOBS.push(newJob);
        S.scheduleForm = null;
        toast(`Job scheduled · ${entity.name} · ${effectiveType}`);
        setTimeout(() => go('maintenance'), 400);
      } else if (act === 'complete-job') {
        openCloseJob(el.dataset.job || S.selectedJob);
      } else if (act === 'delete-equipment') {
        openDeleteEquipment(el.dataset.equip || S.selectedEquipment);
      } else if (act === 'edit-equipment') {
        openEditEquipment(el.dataset.equip || S.selectedEquipment);
      } else if (act === 'add-equipment') {
        openAddEquipment();
      } else if (act === 'add-part') {
        toast('Add part — coming soon', 'info');
      } else if (act === 'add-part-item') {
        openAddPartToCatalog();
      } else if (act === 'update-stock') {
        openUpdateStock(el.dataset.part);
      } else if (act === 'edit-part-item') {
        openEditPartInCatalog(el.dataset.part);
      } else if (act === 'delete-part-item') {
        openDeletePartFromCatalog(el.dataset.part);
      } else if (act === 'view-template') {
        openViewTemplate(el.dataset.template);
      } else if (act === 'add-template') {
        openTemplateEditor(null);
      } else if (act === 'edit-template') {
        openTemplateEditor(el.dataset.template);
      } else if (act === 'duplicate-template') {
        duplicateTemplate(el.dataset.template);
      } else if (act === 'toggle-template') {
        toggleTemplateStatus(el.dataset.template);
      } else if (act === 'delete-template') {
        openDeleteTemplate(el.dataset.template);
      } else if (act === 'add-facility') {
        openFacilityEditor(null);
      } else if (act === 'edit-facility') {
        openFacilityEditor(el.dataset.facility || S.selectedFacility);
      } else if (act === 'delete-facility') {
        openDeleteFacility(el.dataset.facility || S.selectedFacility);
      } else if (act === 'schedule-for-facility') {
        S.scheduleForm = freshScheduleForm();
        S.scheduleForm.entityType = 'facility';
        S.scheduleForm.facilityId = el.dataset.facility || S.selectedFacility;
        S.scheduleForm.basis = 'time';
        S.scheduleForm.type = 'Monthly Service';
        S.scheduleForm.checklistId = suggestChecklistFor(S.scheduleForm.facilityId, 'Monthly Service', 'facility');
        go('schedule');
      } else if (act === 'close-notifs') {
        setNotifications(false);
      } else if (act === 'navigate-from-notif') {
        // data-nav handler on same element handles the actual navigation; just close the panel
        setNotifications(false);
      } else if (act === 'export-report') {
        exportReportCsv();
      } else if (act === 'logout') {
        handleLogout();
      } else if (act === 'report-breakdown') {
        openReportBreakdown(el.dataset.equip || '');
      } else if (act === 'resolve-breakdown') {
        openResolveBreakdown(el.dataset.bd);
      } else if (act === 'edit-breakdown') {
        openEditBreakdown(el.dataset.bd);
      } else if (act === 'delete-breakdown') {
        openDeleteBreakdown(el.dataset.bd);
      } else if (act === 'log-fuel') {
        openLogFuel(el.dataset.equip || '');
      } else if (act === 'view-photo') {
        openPhotoLightbox(el.dataset.src, el.dataset.label);
      } else if (act === 'add-equip-part') {
        openAddEquipmentPart(el.dataset.equip || S.selectedEquipment);
      } else if (act === 'edit-equip-part') {
        openEditEquipmentPart(el.dataset.equip || S.selectedEquipment, el.dataset.part);
      } else if (act === 'remove-equip-part') {
        removeEquipmentPart(el.dataset.equip || S.selectedEquipment, el.dataset.part);
      } else if (act === 'cal-prev') {
        S.calMonth -= 1; render();
      } else if (act === 'cal-next') {
        S.calMonth += 1; render();
      } else if (act === 'cal-today') {
        S.calMonth = 0; render();
      } else if (act === 'save-equipment') {
        toast('Changes saved');
        closeModal();
      }
    });
  });

  // Schedule form inputs (controlled)
  document.querySelectorAll('[data-sched-field]').forEach(el => {
    if (!S.scheduleForm) return;
    const field = el.dataset.schedField;
    const rerenderFields = ['equipId', 'facilityId', 'type', 'basis'];
    const useChange = el.tagName === 'SELECT' || el.type === 'date';
    el.addEventListener(useChange ? 'change' : 'input', () => {
      S.scheduleForm[field] = el.value;
      const sf = S.scheduleForm;
      if (field === 'equipId' || field === 'type' || field === 'facilityId') {
        const isFac = sf.entityType === 'facility';
        const entId = isFac ? sf.facilityId : sf.equipId;
        sf.requiredPartIds = isFac ? [] : defaultRequiredPartsFor(entId, sf.type);
        sf.checklistId     = suggestChecklistFor(entId, sf.type, sf.entityType);
      }
      if (field === 'basis') {
        if (el.value === 'time') S.scheduleForm.dueHours = '';
        else S.scheduleForm.dueDate = '';
      }
      if (rerenderFields.includes(field)) render();
    });
  });

  // Schedule form: Equipment/Facility toggle
  document.querySelectorAll('[data-sched-entity]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!S.scheduleForm) return;
      S.scheduleForm.entityType = btn.dataset.schedEntity;
      // Reset basis to time for facilities
      if (S.scheduleForm.entityType === 'facility') S.scheduleForm.basis = 'time';
      // Recompute suggested checklist + parts based on new entity type
      const sf = S.scheduleForm;
      const entId = sf.entityType === 'facility' ? sf.facilityId : sf.equipId;
      sf.requiredPartIds = sf.entityType === 'facility' ? [] : defaultRequiredPartsFor(entId, sf.type);
      sf.checklistId     = suggestChecklistFor(entId, sf.type, sf.entityType);
      render();
    });
  });

  // Schedule form part checkboxes
  document.querySelectorAll('[data-sched-part]').forEach(el => {
    el.addEventListener('change', () => {
      if (!S.scheduleForm) return;
      const pid = el.dataset.schedPart;
      const arr = S.scheduleForm.requiredPartIds;
      if (el.checked) {
        if (!arr.includes(pid)) arr.push(pid);
      } else {
        S.scheduleForm.requiredPartIds = arr.filter(x => x !== pid);
      }
      render();
    });
  });

  // Overview: attention pills and work-queue tabs
  document.querySelectorAll('[data-overview-tab]').forEach(el => {
    el.addEventListener('click', () => {
      S.overviewTab = el.dataset.overviewTab;
      render();
    });
  });

  // View toggles (list / calendar)
  document.querySelectorAll('[data-maint-view]').forEach(el => {
    el.addEventListener('click', () => {
      S.maintView = el.dataset.maintView;
      render();
    });
  });
  document.querySelectorAll('[data-equip-maint-view]').forEach(el => {
    el.addEventListener('click', () => {
      S.equipMaintView = el.dataset.equipMaintView;
      render();
    });
  });

  // Maintenance filter tabs
  document.querySelectorAll('[data-mfilter]').forEach(el => {
    el.addEventListener('click', () => {
      S.maintFilter = el.dataset.mfilter;
      render();
    });
  });

  // Equipment search & filters
  bindSearchInput('equip-search', 'equipSearch');
  const filterLoc = document.getElementById('filter-location');
  if (filterLoc) filterLoc.addEventListener('change', e => { S.equipFilters.location = e.target.value; render(); });
  const filterType = document.getElementById('filter-type');
  if (filterType) filterType.addEventListener('change', e => { S.equipFilters.type = e.target.value; render(); });
  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) filterStatus.addEventListener('change', e => { S.equipFilters.status = e.target.value; render(); });

  // History search
  bindSearchInput('hist-search', 'histSearch');

  // Parts search & filter
  bindSearchInput('parts-search', 'partsSearch');
  const partsFilterEl = document.getElementById('parts-filter');
  if (partsFilterEl) {
    partsFilterEl.addEventListener('change', e => { S.partsFilter = e.target.value; render(); });
  }

  // Templates search & filters
  bindSearchInput('template-search', 'templateSearch');
  const tplEquip = document.getElementById('template-filter-equip');
  if (tplEquip) tplEquip.addEventListener('change', e => { S.templateFilterEquip = e.target.value; render(); });
  const tplService = document.getElementById('template-filter-service');
  if (tplService) tplService.addEventListener('change', e => { S.templateFilterService = e.target.value; render(); });
  const tplStatus = document.getElementById('template-filter-status');
  if (tplStatus) tplStatus.addEventListener('change', e => { S.templateFilterStatus = e.target.value; render(); });

  // Facilities search & filters
  bindSearchInput('facility-search', 'facilitySearch');
  const facLoc = document.getElementById('facility-filter-loc');
  if (facLoc) facLoc.addEventListener('change', e => { S.facilityFilterLocation = e.target.value; render(); });
  const facType = document.getElementById('facility-filter-type');
  if (facType) facType.addEventListener('change', e => { S.facilityFilterType = e.target.value; render(); });
}

/* ═══════════════════════════════════════════════════════════
   KEBAB MENUS — shared close helper (global)
   ═══════════════════════════════════════════════════════════ */

function closeAllKebabs() {
  document.querySelectorAll('.kebab-menu.open').forEach(m => {
    m.classList.remove('open');
    // Restore dropdown to its original parent if it was portalled to body
    if (m._kebabDropdown && m._kebabDropdown.parentElement === document.body) {
      m.appendChild(m._kebabDropdown);
      m._kebabDropdown.classList.remove('is-open');
      m._kebabDropdown.classList.remove('drop-up');
      m._kebabDropdown.style.position = '';
      m._kebabDropdown.style.top = '';
      m._kebabDropdown.style.left = '';
      m._kebabDropdown.style.right = '';
    }
  });
  // Also clean up any orphaned dropdowns in body (edge case after re-renders)
  document.querySelectorAll('body > .kebab-dropdown.is-open').forEach(d => {
    d.classList.remove('is-open');
    d.style.cssText = '';
    d.remove();
  });
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS — toggle + outside-close
   ═══════════════════════════════════════════════════════════ */

function setNotifications(open) {
  S.notifOpen = open;
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  if (open) {
    panel.innerHTML = renderNotificationPanel();
    panel.style.display = 'block';

    // Dynamically-inserted children need their own handler bindings —
    // attachHandlers() runs on render() which hasn't touched this panel.
    const navAway = (el) => {
      const page  = el.dataset.nav;
      const equip = el.dataset.equip;
      const job   = el.dataset.job;
      const fac   = el.dataset.facility;
      if (equip) S.selectedEquipment = equip;
      if (job)   S.selectedJob       = job;
      if (fac)   S.selectedFacility  = fac;
      setNotifications(false);
      if (page) go(page);
    };
    panel.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', e => { e.stopPropagation(); navAway(item); });
    });
    panel.querySelectorAll('.notif-more').forEach(row => {
      row.addEventListener('click', e => { e.stopPropagation(); navAway(row); });
    });
    const closeBtn = panel.querySelector('[data-action="close-notifs"]');
    if (closeBtn) closeBtn.addEventListener('click', e => { e.stopPropagation(); setNotifications(false); });
  } else {
    panel.style.display = 'none';
  }
}

function toggleNotifications() {
  setNotifications(!S.notifOpen);
}

/* ═══════════════════════════════════════════════════════════
   AUTH / LOGIN
   ═══════════════════════════════════════════════════════════ */

function handleLogin(email, password) {
  const user = authenticate(email, password);
  const errEl = document.getElementById('login-error');
  if (!user) {
    if (errEl) { errEl.textContent = 'Invalid email or password. Check your credentials and try again.'; errEl.style.display = 'block'; }
    return;
  }
  S.loggedIn = true;
  S.user     = user;
  S.role     = user.role;
  S.page     = 'overview';
  if (errEl) errEl.style.display = 'none';
  updateSidebarUser();
  render();
  setTimeout(() => toast(`Welcome, ${user.name.split(' ')[0]}`), 200);
}

function handleLogout() {
  const name = S.user ? S.user.name.split(' ')[0] : '';
  S.loggedIn = false;
  S.user     = null;
  // Keep S.role default to ops for safety
  S.role     = 'ops';
  S.page     = 'overview';
  // Reset any in-flight form state
  S.scheduleForm = null;
  S.checks       = {};
  updateSidebarUser();
  render();
  if (name) setTimeout(() => toast(`Signed out · bye ${name}`, 'info'), 200);
}

function updateSidebarUser() {
  const av = document.getElementById('sb-avatar');
  const un = document.getElementById('sb-uname');
  const ur = document.getElementById('sb-urole');
  if (!av) return;
  if (S.loggedIn && S.user) {
    av.textContent = S.user.avatar || S.user.name.slice(0,2).toUpperCase();
    if (S.user.role === 'admin') {
      av.style.background = 'var(--ok-bg)';
      av.style.color      = 'var(--ok-text)';
      if (un) un.textContent = S.user.name;
      if (ur) ur.textContent = 'Admin · Full access';
    } else {
      av.style.background = 'var(--info-bg)';
      av.style.color      = 'var(--info-text)';
      if (un) un.textContent = S.user.name;
      if (ur) ur.textContent = 'Operator · Read only';
    }
  } else {
    av.textContent = '—';
    av.style.background = 'var(--neutral-bg)';
    av.style.color      = 'var(--text-3)';
    if (un) un.textContent = 'Not signed in';
    if (ur) ur.textContent = '—';
  }
}

/* ═══════════════════════════════════════════════════════════
   16. GLOBAL HANDLERS
   ═══════════════════════════════════════════════════════════ */

function attachGlobals() {
  // Sidebar nav
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      go(el.dataset.page);
      // Auto-close mobile slide-in menu after navigation
      if (window.innerWidth <= 720) document.body.classList.remove('mobile-menu-open');
    });
  });

  // Sync the sidebar user panel to the logged-in user (no-op if logged out)
  updateSidebarUser();

  // Theme toggle
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    S.dark = !S.dark;
    document.body.classList.toggle('dark', S.dark);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = S.dark
        ? `<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>`
        : `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
    }
  });

  // Sidebar toggle — behaves differently on phone vs desktop
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    if (window.innerWidth <= 720) {
      document.body.classList.toggle('mobile-menu-open');
    } else {
      document.getElementById('sidebar').classList.toggle('collapsed');
    }
  });

  // Mobile overlay: click to close the slide-in menu
  const overlay = document.getElementById('mobile-overlay');
  if (overlay) overlay.addEventListener('click', () => {
    document.body.classList.remove('mobile-menu-open');
  });

  // Global search (topbar)
  const globalSearch = document.getElementById('search-input');
  if (globalSearch) globalSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      S.equipSearch = e.target.value.trim();
      go('equipment');
      e.target.value = '';
    }
  });

  // Modal backdrop click to close
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Notification bell — attached ONCE here (not in attachHandlers which re-runs per render)
  const notifBtn = document.getElementById('notif-btn');
  if (notifBtn) notifBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleNotifications();
  });

  // Notification panel: close on outside click
  document.addEventListener('click', e => {
    if (!S.notifOpen) return;
    const wrap = document.getElementById('notif-wrap');
    if (wrap && !wrap.contains(e.target)) setNotifications(false);
  });

  // Kebab menus: close on outside click or on any scroll
  document.addEventListener('click', e => {
    // If click is inside a kebab menu (⋮ button) or inside a portalled dropdown, don't close here — the kebab handlers do it properly
    if (e.target.closest('.kebab-menu')) return;
    if (e.target.closest('.kebab-dropdown')) return;
    closeAllKebabs();
  });
  document.addEventListener('scroll', () => {
    closeAllKebabs();
  }, true);
}

/* ═══════════════════════════════════════════════════════════
   17. INIT
   ═══════════════════════════════════════════════════════════ */

attachGlobals();
render();
syncNav();
