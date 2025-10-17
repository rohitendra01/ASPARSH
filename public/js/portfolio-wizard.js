// public/js/portfolio-wizard.js
(function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // hotel-style selectors
  const profileSearch = $('#profileSearch');
  const resultsDiv = $('#profileSearchResults');
  const selectedProfileCard = $('#selectedProfileCard');
  const selectedProfileIdInput = $('#selectedProfileId');
  const selectedProfileSlugInput = $('#selectedProfileSlug');
  const selectedProfileNameInput = $('#selectedProfileName');
  const profileIdInput = $('#profileId');

  const form = $('#portfolioWizardForm');
  const steps = $$('.wizard-step');
  const stepBtns = $$('.step-btn');
  const autosaveStatus = $('#autosaveStatus');

  let draftId = null;
  let currentStep = 0;
  let autosaveTimer = null;

  // Helper to read CSRF token injected by server (from hidden input or window.__CSRF)
  function getCsrf() {
    if (typeof window !== 'undefined' && window.__CSRF) return window.__CSRF;
    const el = document.getElementById('_csrf');
    if (el && el.value) return el.value;
    return null;
  }

  function applyCsrf(headers) {
    const token = getCsrf();
    if (!token) return headers;
    // set token in several common header names to be compatible with server config
    return Object.assign({}, headers, {
      'x-csrf-token': token,
      'x-xsrf-token': token,
      'csrf-token': token,
      'X-CSRF-Token': token,
      'CSRF-Token': token
    });
  }

  function debounce(fn, wait=300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(()=> fn(...args), wait);
    };
  }

  async function doSearch(q) {
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';
    if (!q || q.length < 2) return;
    try {
      const res = await fetch('/api/profiles/search?q=' + encodeURIComponent(q));
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        resultsDiv.innerHTML = data.map(function(profile) {
          return '<div class="search-result-item" data-id="' + profile._id + '" data-slug="' + profile.slug + '" data-name="' + (profile.name||'') + '" data-email="' + (profile.email||'') + '" data-mobile="' + (profile.mobile||'') + '">' +
            '<strong>' + (profile.name||'') + '</strong> <span class="muted">(' + (profile.slug||'') + ')</span><br>' +
            '<small>' + (profile.email||'') + ' | ' + (profile.mobile||'') + '</small>' +
          '</div>';
        }).join('');
      } else {
        resultsDiv.innerHTML = '<div class="muted">No user found.</div>';
      }
    } catch (err) {
      console.error('search error', err);
    }
  }

  const debouncedSearch = debounce((ev) => doSearch(ev.target.value), 250);
  if (profileSearch) profileSearch.addEventListener('input', debouncedSearch);

  if (resultsDiv) {
    resultsDiv.addEventListener('click', function(e) {
      var item = e.target.closest('.search-result-item');
      if (!item) return;
      if (selectedProfileIdInput) selectedProfileIdInput.value = item.dataset.id;
      if (selectedProfileSlugInput) selectedProfileSlugInput.value = item.dataset.slug;
      if (selectedProfileNameInput) selectedProfileNameInput.value = item.dataset.name;
      if (profileIdInput) profileIdInput.value = item.dataset.id; // legacy field used by payload
      if (profileSearch) profileSearch.value = item.dataset.name + ' (' + item.dataset.slug + ')';
      resultsDiv.innerHTML = '';

      if (selectedProfileCard) {
        selectedProfileCard.innerHTML = '<div class="profile-card" style="border:1px solid #ccc; padding:1rem; border-radius:8px; background:#f9f9f9;">' +
          '<strong>' + item.dataset.name + '</strong> <span class="muted">(' + item.dataset.slug + ')</span><br>' +
          '<small>' + item.dataset.email + ' | ' + item.dataset.mobile + '</small>' +
        '</div>';
        selectedProfileCard.style.display = 'block';
      }

      // After selecting profile, prefill title/tagline and create draft
      if (!draftId) {
        const payload = { profileId: item.dataset.id };
        // include CSRF token in header
        const headers = applyCsrf({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
        fetch('/dashboard/' + (window.__SLUG || 'me') + '/portfolios/new', {
          method: 'POST', headers: headers, body: JSON.stringify(payload), credentials: 'same-origin'
        }).then(r => r.json()).then(data => {
          if (data && data.portfolio && (data.portfolio._id || data.portfolio.id)) {
            draftId = data.portfolio._id || data.portfolio.id;
            autosaveStatus.textContent = 'Draft created';
          }
        }).catch(err => console.error(err));
      }

      // Prefill fields
      if (!$('#title').value) $('#title').value = item.dataset.name + ' — Portfolio';
      if (!$('#tagline').value) $('#tagline').value = 'Portfolio of ' + item.dataset.name;
    });
  }

  function renderReviewArea() {
    const area = document.getElementById('reviewArea');
    if (!area) return;
    const payload = buildPayload();
    // Build a simple summary (escaped values)
    const esc = s => (String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;'));
    let html = '<div class="review-summary">';
    html += `<h3>General</h3><p><strong>Title:</strong> ${esc(payload.title)}</p><p><strong>Tagline:</strong> ${esc(payload.tagline)}</p>`;
    html += `<p><button type="button" data-action="goto" data-step="0">Edit General</button></p>`;
    html += '<h3>Social</h3>';
    html += `<p><strong>Website:</strong> ${esc(payload.social.website)}</p><p><strong>LinkedIn:</strong> ${esc(payload.social.linkedin)}</p><p><strong>Instagram:</strong> ${esc(payload.social.instagram)}</p>`;
    html += `<p><button type="button" data-action="goto" data-step="1">Edit Social</button></p>`;
    html += '<h3>About</h3>';
    html += `<p>${esc(payload.about)}</p>`;
    html += `<p><button type="button" data-action="goto" data-step="2">Edit About</button></p>`;
    html += '<h3>Projects</h3>';
    if (payload.projects && payload.projects.length) {
      html += '<ul>' + payload.projects.map(p => `<li><strong>${esc(p.title)}</strong> — ${esc(p.description)} ${p.link?('(<a href="'+esc(p.link)+'" target="_blank">link</a>)') : ''}</li>`).join('') + '</ul>';
    } else {
      html += '<p class="muted">No projects added.</p>';
    }
    html += `<p><button type="button" data-action="goto" data-step="3">Edit Projects</button></p>`;

    html += '<h3>Services</h3>';
    if (payload.services && payload.services.length) {
      html += '<ul>' + payload.services.map(s => `<li><strong>${esc(s.name)}</strong> — ${esc(s.description)} (Price: ${esc(s.price)})</li>`).join('') + '</ul>';
    } else {
      html += '<p class="muted">No services added.</p>';
    }
    html += `<p><button type="button" data-action="goto" data-step="4">Edit Services</button></p>`;

    html += '</div>';
    area.innerHTML = html;

    // wire quick edit buttons
    area.querySelectorAll('button[data-action="goto"]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const step = Number(btn.dataset.step);
        goToStep(step);
      });
    });
  }

  function goToStep(index) {
    if (index < 0 || index >= steps.length) return;
    steps.forEach(s => s.classList.remove('active'));
    stepBtns.forEach(b => b.classList.remove('active'));
    steps[index].classList.add('active');
    stepBtns[index].classList.add('active');
    currentStep = index;
    // If entering review step, render summary and force a save
    if (index === steps.length - 1) {
      renderReviewArea();
      // force immediate autosave before review (no debounce)
      clearTimeout(autosaveTimer);
      (async () => {
        autosaveStatus.textContent = 'Saving...';
        try {
          const payload = buildPayload();
          if (!payload.profileId) {
            autosaveStatus.textContent = 'Select a profile first';
            return;
          }
          // create draft if missing or update existing
          if (!draftId) {
            const dashboardSlug = (selectedProfileSlugInput && selectedProfileSlugInput.value) || window.__SLUG || 'me';
            const res = await fetch('/dashboard/' + dashboardSlug + '/portfolios/new', { method: 'POST', headers: applyCsrf({ 'Content-Type': 'application/json', 'Accept': 'application/json' }), body: JSON.stringify(payload), credentials: 'same-origin' });
            if (res.ok) {
              const data = await res.json().catch(()=>null);
              if (data && data.portfolio && (data.portfolio._id || data.portfolio.id)) {
                draftId = data.portfolio._id || data.portfolio.id;
                autosaveStatus.textContent = 'Draft created';
              } else {
                autosaveStatus.textContent = 'Save failed';
              }
            } else {
              autosaveStatus.textContent = 'Save failed';
            }
            return;
          }
          // update existing draft
          const dashboardSlug = (selectedProfileSlugInput && selectedProfileSlugInput.value) || window.__SLUG || 'me';
          const res = await fetch('/dashboard/' + dashboardSlug + '/portfolios/' + encodeURIComponent(draftId), { method: 'PUT', headers: applyCsrf({ 'Content-Type': 'application/json', 'Accept': 'application/json' }), body: JSON.stringify(payload), credentials: 'same-origin' });
          if (res.ok) {
            autosaveStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
          } else {
            autosaveStatus.textContent = 'Save failed';
          }
        } catch (err) {
          console.error('[portfolio-wizard] review autosave error', err);
          autosaveStatus.textContent = 'Save failed';
        }
      })();
    } else {
      triggerAutosave();
    }
  }
  $$('.step-btn').forEach(btn => btn.addEventListener('click', () => goToStep(Number(btn.dataset.step))));

  form.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const action = a.dataset.action;
    if (action === 'next') goToStep(Math.min(currentStep + 1, steps.length - 1));
    if (action === 'prev') goToStep(Math.max(currentStep - 1, 0));
  });

  const projectsList = $('#projectsList');
  const servicesList = $('#servicesList');
  const skillsList = $('#skillsList');
  const galleryList = $('#galleryList');
  const experienceList = $('#experienceList');
  const testimonialsList = $('#testimonialsList');

  function makeProjectNode(data = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'project-row';
    wrapper.innerHTML = `
      <input class="proj-title" placeholder="Project title" value="${(data.title||'').replace(/"/g, '&quot;')}">
      <input class="proj-link" placeholder="Project link (optional)" value="${(data.link||'').replace(/"/g, '&quot;')}">
      <textarea class="proj-desc" placeholder="Short description">${data.description || ''}</textarea>
      <button class="remove-proj">Remove</button>`;
    wrapper.querySelector('.remove-proj').addEventListener('click', () => { wrapper.remove(); triggerAutosave(); });
    [ ...wrapper.querySelectorAll('input,textarea')].forEach(el => el.addEventListener('input', triggerAutosave));
    return wrapper;
  }
  function addProject(data) { if (projectsList) projectsList.appendChild(makeProjectNode(data)); }
  if ($('#addProjectBtn')) $('#addProjectBtn').addEventListener('click', () => addProject({}));

  function makeServiceNode(data={}) {
    const w = document.createElement('div');
    w.className = 'service-row';
    w.innerHTML = `
      <input class="svc-name" placeholder="Service name" value="${(data.name||'').replace(/"/g, '&quot;')}">
      <input class="svc-price" placeholder="Price" value="${(data.price||'')}">
      <textarea class="svc-desc" placeholder="Description">${data.description || ''}</textarea>
      <button class="remove-svc">Remove</button>`;
    w.querySelector('.remove-svc').addEventListener('click', () => { w.remove(); triggerAutosave(); });
    [ ...w.querySelectorAll('input,textarea')].forEach(el => el.addEventListener('input', triggerAutosave));
    return w;
  }
  if ($('#addServiceBtn')) $('#addServiceBtn').addEventListener('click', () => servicesList.appendChild(makeServiceNode({})));

  // Skills
  function makeSkillNode(data={}) {
    const w = document.createElement('div');
    w.className = 'skill-row';
    w.innerHTML = `
      <input class="skill-name" placeholder="Skill name" value="${(data.name||'').replace(/"/g,'&quot;')}">
      <input class="skill-level" placeholder="Proficiency (0-100)" value="${(data.level||'')}">
      <button class="remove-skill">Remove</button>`;
    w.querySelector('.remove-skill').addEventListener('click', () => { w.remove(); triggerAutosave(); });
    [...w.querySelectorAll('input')].forEach(el => el.addEventListener('input', triggerAutosave));
    return w;
  }
  // expose addSkill for inline onclicks in the template
  window.addSkill = function(data) { if (skillsList) skillsList.appendChild(makeSkillNode(data||{})); };

  // Gallery
  function makeGalleryNode(data={}) {
    const w = document.createElement('div');
    w.className = 'gallery-row';
    w.innerHTML = `
      <input class="gallery-image" placeholder="Image URL" value="${(data.imageUrl||'').replace(/"/g,'&quot;')}">
      <input class="gallery-title" placeholder="Title" value="${(data.title||'').replace(/"/g,'&quot;')}">
      <textarea class="gallery-desc" placeholder="Description">${data.description||''}</textarea>
      <button class="remove-gallery">Remove</button>`;
    w.querySelector('.remove-gallery').addEventListener('click', () => { w.remove(); triggerAutosave(); });
    [...w.querySelectorAll('input,textarea')].forEach(el => el.addEventListener('input', triggerAutosave));
    return w;
  }
  window.addGalleryImage = function(data) { if (galleryList) galleryList.appendChild(makeGalleryNode(data||{})); };

  // Experience
  function makeExperienceNode(data={}) {
    const w = document.createElement('div');
    w.className = 'experience-row';
    w.innerHTML = `
      <input class="exp-role" placeholder="Role/Title" value="${(data.title||'').replace(/"/g,'&quot;')}">
      <input class="exp-company" placeholder="Company" value="${(data.company||'').replace(/"/g,'&quot;')}">
      <input class="exp-start" placeholder="Start (YYYY-MM)" value="${(data.startDate||'')}">
      <input class="exp-end" placeholder="End (YYYY-MM or present)" value="${(data.endDate||'')}">
      <textarea class="exp-desc" placeholder="Description">${data.description||''}</textarea>
      <button class="remove-exp">Remove</button>`;
    w.querySelector('.remove-exp').addEventListener('click', () => { w.remove(); triggerAutosave(); });
    [...w.querySelectorAll('input,textarea')].forEach(el => el.addEventListener('input', triggerAutosave));
    return w;
  }
  window.addExperience = function(data) { if (experienceList) experienceList.appendChild(makeExperienceNode(data||{})); };

  // Testimonials
  function makeTestimonialNode(data={}) {
    const w = document.createElement('div');
    w.className = 'testimonial-row';
    w.innerHTML = `
      <input class="t-name" placeholder="Name" value="${(data.name||'').replace(/"/g,'&quot;')}">
      <input class="t-company" placeholder="Company/Position" value="${(data.company||'').replace(/"/g,'&quot;')}">
      <textarea class="t-text" placeholder="Testimonial">${data.text||''}</textarea>
      <input class="t-rating" placeholder="Rating (1-5)" value="${(data.rating||'')}">
      <button class="remove-t">Remove</button>`;
    w.querySelector('.remove-t').addEventListener('click', () => { w.remove(); triggerAutosave(); });
    [...w.querySelectorAll('input,textarea')].forEach(el => el.addEventListener('input', triggerAutosave));
    return w;
  }
  window.addTestimonial = function(data) { if (testimonialsList) testimonialsList.appendChild(makeTestimonialNode(data||{})); };

  function buildPayload() {
    const payload = {};
    payload.profileId = profileIdInput ? profileIdInput.value : (selectedProfileIdInput ? selectedProfileIdInput.value : null);
    payload.title = $('#title').value || '';
    payload.tagline = $('#tagline').value || '';
    payload.about = $('#about').value || '';
    payload.social = {
      website: $('#socialWebsite').value || '',
      linkedin: $('#socialLinkedin').value || '',
      instagram: $('#socialInstagram').value || ''
    };
    // SEO
    payload.seo = {
      title: $('#seoTitle') ? $('#seoTitle').value || '' : '',
      description: $('#seoDescription') ? $('#seoDescription').value || '' : '',
      keywords: ($('#seoKeywords') && $('#seoKeywords').value) ? $('#seoKeywords').value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      ogImage: $('#seoOgImage') ? $('#seoOgImage').value || '' : ''
    };
    // Theme
    payload.theme = {
      primary: $('#themePrimary') ? $('#themePrimary').value || '' : '',
      secondary: $('#themeSecondary') ? $('#themeSecondary').value || '' : '',
      accent: $('#themeAccent') ? $('#themeAccent').value || '' : '',
      font: $('#themeFont') ? $('#themeFont').value || '' : ''
    };
    // Skills
    payload.skills = Array.from(document.querySelectorAll('.skill-row')).map(r=>({
      name: (r.querySelector('.skill-name') && r.querySelector('.skill-name').value) || '',
      level: (r.querySelector('.skill-level') && r.querySelector('.skill-level').value) || ''
    }));
    payload.projects = Array.from(document.querySelectorAll('.project-row')).map(r => ({
      title: (r.querySelector('.proj-title') && r.querySelector('.proj-title').value) || '',
      link: (r.querySelector('.proj-link') && r.querySelector('.proj-link').value) || '',
      description: (r.querySelector('.proj-desc') && r.querySelector('.proj-desc').value) || ''
      // images could be added by gallery or project-specific inputs in future
    }));
    payload.services = Array.from(document.querySelectorAll('.service-row')).map(r => ({
      name: (r.querySelector('.svc-name') && r.querySelector('.svc-name').value) || '',
      // preserve empty price instead of forcing zero
      price: (r.querySelector('.svc-price') && r.querySelector('.svc-price').value) === '' ? null : Number((r.querySelector('.svc-price') && r.querySelector('.svc-price').value)),
      description: (r.querySelector('.svc-desc') && r.querySelector('.svc-desc').value) || ''
    }));
    // Gallery
    payload.gallery = Array.from(document.querySelectorAll('.gallery-row')).map(r=>({
      imageUrl: (r.querySelector('.gallery-image') && r.querySelector('.gallery-image').value) || '',
      title: (r.querySelector('.gallery-title') && r.querySelector('.gallery-title').value) || '',
      description: (r.querySelector('.gallery-desc') && r.querySelector('.gallery-desc').value) || ''
    }));
    // Experience
    payload.experience = Array.from(document.querySelectorAll('.experience-row')).map(r=>({
      title: (r.querySelector('.exp-role') && r.querySelector('.exp-role').value) || '',
      company: (r.querySelector('.exp-company') && r.querySelector('.exp-company').value) || '',
      startDate: (r.querySelector('.exp-start') && r.querySelector('.exp-start').value) || '',
      endDate: (r.querySelector('.exp-end') && r.querySelector('.exp-end').value) || '',
      description: (r.querySelector('.exp-desc') && r.querySelector('.exp-desc').value) || ''
    }));
    // Testimonials
    payload.testimonials = Array.from(document.querySelectorAll('.testimonial-row')).map(r=>({
      name: (r.querySelector('.t-name') && r.querySelector('.t-name').value) || '',
      position: (r.querySelector('.t-company') && r.querySelector('.t-company').value) || '',
      text: (r.querySelector('.t-text') && r.querySelector('.t-text').value) || '',
      rating: (r.querySelector('.t-rating') && r.querySelector('.t-rating').value) ? Number(r.querySelector('.t-rating').value) : null
    }));
    return payload;
  }

  function triggerAutosave() {
    autosaveStatus.textContent = 'Saving...';
    console.log('[portfolio-wizard] triggerAutosave - start');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      const payload = buildPayload();
      if (!payload.profileId) {
        autosaveStatus.textContent = 'Select a profile first';
        console.log('[portfolio-wizard] triggerAutosave - no profileId');
        return;
      }

      // helper to perform fetch with timeout
      const fetchWithTimeout = (url, opts = {}, timeout = 15000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        opts.signal = controller.signal;
        // ensure we don't accidentally lose CSRF header when callers forget
        if (!opts.headers) opts.headers = {};
        opts.headers = applyCsrf(opts.headers);
        // include credentials so session cookie is sent for csurf validation
        if (!opts.credentials) opts.credentials = 'same-origin';
        // If content-type is JSON and body is a string, attempt to inject _csrf token in body as well
        try {
          const ct = (opts.headers['Content-Type'] || opts.headers['content-type'] || '').toLowerCase();
          const token = getCsrf();
          if (token && ct.indexOf('application/json') !== -1 && opts.body && typeof opts.body === 'string') {
            try {
              const parsed = JSON.parse(opts.body);
              if (parsed && typeof parsed === 'object') {
                parsed._csrf = parsed._csrf || token;
                opts.body = JSON.stringify(parsed);
              }
            } catch (e) {
              // ignore JSON parse errors
            }
          }
        } catch (e) {
          // ignore
        }
        return fetch(url, opts).finally(() => clearTimeout(id));
      };

      try {
        if (!draftId) {
          const dashboardSlug = (selectedProfileSlugInput && selectedProfileSlugInput.value) || window.__SLUG || 'me';
          const url = '/dashboard/' + dashboardSlug + '/portfolios/new';
          console.log('[portfolio-wizard] creating draft', url, payload);
          const res = await fetchWithTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' }, 15000);
          if (!res.ok) {
            autosaveStatus.textContent = 'Save failed';
            console.error('[portfolio-wizard] create draft failed', res.status, await res.text());
            return;
          }
          const data = await res.json().catch(e => { console.error('[portfolio-wizard] invalid json create response', e); return null; });
          if (data && data.portfolio && (data.portfolio._id || data.portfolio.id)) {
            draftId = data.portfolio._id || data.portfolio.id;
            autosaveStatus.textContent = 'Draft created';
            console.log('[portfolio-wizard] draft created', draftId);
          } else {
            autosaveStatus.textContent = 'Save failed';
            console.error('[portfolio-wizard] unexpected create response', data);
          }
          return;
        }

        const dashboardSlug = (selectedProfileSlugInput && selectedProfileSlugInput.value) || window.__SLUG || 'me';
        const url = '/dashboard/' + dashboardSlug + '/portfolios/' + encodeURIComponent(draftId);
        console.log('[portfolio-wizard] updating draft', url, payload);
        const res = await fetchWithTimeout(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' }, 15000);
        if (res.ok) {
          autosaveStatus.textContent = `Saved ${new Date().toLocaleTimeString()}`;
          console.log('[portfolio-wizard] update saved');
        } else {
          autosaveStatus.textContent = 'Save failed';
          console.error('[portfolio-wizard] update failed', res.status, await res.text());
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          autosaveStatus.textContent = 'Save timed out';
          console.error('[portfolio-wizard] fetch aborted (timeout)');
        } else {
          autosaveStatus.textContent = 'Save failed';
          console.error('[portfolio-wizard] autosave error', err);
        }
      }
    }, 700);
  }

  form && form.addEventListener('input', () => triggerAutosave());

  $('#publishBtn') && $('#publishBtn').addEventListener('click', async () => {
    try {
      if (!draftId) return alert('Please select a profile and fill at least general info.');
      // include CSRF when doing explicit save before publish
      const headers = applyCsrf({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      await fetch('/dashboard/' + (window.__SLUG || 'me') + '/portfolios/' + encodeURIComponent(draftId), {
        method: 'PUT', headers: headers, body: JSON.stringify(buildPayload()), credentials: 'same-origin'
      });
      const pubHeaders = applyCsrf({});
      const pub = await fetch('/dashboard/' + (window.__SLUG || 'me') + '/portfolios/' + encodeURIComponent(draftId) + '/publish', { method: 'POST', headers: pubHeaders, credentials: 'same-origin' });
      const data = await pub.json();
      if (data && data.ok) {
        alert('Portfolio published');
        window.location.href = `/dashboard/${(window.__SLUG || 'me')}/portfolios`;
      }
    } catch (err) {
      console.error(err);
      alert('Publish failed');
    }
  });

  goToStep(0);

  document.addEventListener('click', e => {
    if (profileSearch && !profileSearch.contains(e.target) && resultsDiv && !resultsDiv.contains(e.target)) {
      resultsDiv.innerHTML = '';
    }
  });

})();
