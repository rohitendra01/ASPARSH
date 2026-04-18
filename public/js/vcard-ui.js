// vcard-ui.js

// Escaper helper
function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const FONT_AWESOME_CDN = '/css/fa-all.min.css';

function ensureFontAwesomeLoaded() {
    if (typeof document === 'undefined' || !document.head) return;

    const existing = document.querySelector('link[data-vcard-fa="true"], link[href*="font-awesome"]');
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_AWESOME_CDN;
    link.setAttribute('data-vcard-fa', 'true');
    document.head.appendChild(link);
}

// ───────────────────────────────────────────────
// TAGS INPUT
// ───────────────────────────────────────────────
function initTagsInput(wrapperId, hiddenInputId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const input = wrapper.querySelector('input[type="text"]');
    const hidden = document.getElementById(hiddenInputId);
    let tags = [];

    try {
        tags = JSON.parse(hidden.value || '[]');
    } catch (e) { }

    function renderTags() {
        wrapper.querySelectorAll('.tag-pill').forEach(el => el.remove());
        tags.forEach((t, i) => {
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.innerHTML = `<span>${esc(t)}</span><button type="button" onclick="removeTag(${i})">&times;</button>`;
            wrapper.insertBefore(pill, input);
        });
        hidden.value = JSON.stringify(tags);
    }

    window.removeTag = function (idx) {
        tags.splice(idx, 1);
        renderTags();
    };

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = input.value.trim().replace(/,/g, '');
            if (val && !tags.includes(val)) {
                tags.push(val);
                input.value = '';
                renderTags();
            }
        } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
            tags.pop();
            renderTags();
        }
    });

    renderTags();
}

// ───────────────────────────────────────────────
// VISUAL ICON PICKER
// ───────────────────────────────────────────────
const FA_ICONS_DEFAULT = [
    // General
    { name: 'Star', class: 'fas fa-star' },
    { name: 'Heart', class: 'fas fa-heart' },
    { name: 'Check', class: 'fas fa-check' },
    { name: 'User', class: 'fas fa-user' },
    { name: 'Briefcase', class: 'fas fa-briefcase' },
    { name: 'Envelope', class: 'fas fa-envelope' },
    { name: 'Phone', class: 'fas fa-phone' },
    { name: 'Globe', class: 'fas fa-globe' },
    { name: 'Map Marker', class: 'fas fa-map-marker-alt' },
    { name: 'Clock', class: 'fas fa-clock' },
    { name: 'Calendar', class: 'fas fa-calendar-alt' },
    { name: 'Camera', class: 'fas fa-camera' },
    { name: 'Video', class: 'fas fa-video' },
    { name: 'Lightbulb', class: 'fas fa-lightbulb' },
    { name: 'Bolt', class: 'fas fa-bolt' },
    { name: 'Trophy', class: 'fas fa-trophy' },
    { name: 'Award', class: 'fas fa-award' },
    { name: 'Shield', class: 'fas fa-shield-alt' },
    { name: 'Lock', class: 'fas fa-lock' },
    { name: 'Key', class: 'fas fa-key' },
    { name: 'Cog', class: 'fas fa-cog' },
    { name: 'Tools', class: 'fas fa-tools' },
    // Social / Brands
    { name: 'Facebook', class: 'fab fa-facebook-f' },
    { name: 'Twitter', class: 'fab fa-twitter' },
    { name: 'Instagram', class: 'fab fa-instagram' },
    { name: 'LinkedIn', class: 'fab fa-linkedin-in' },
    { name: 'YouTube', class: 'fab fa-youtube' },
    { name: 'WhatsApp', class: 'fab fa-whatsapp' },
    { name: 'Telegram', class: 'fab fa-telegram-plane' },
    { name: 'Tiktok', class: 'fab fa-tiktok' },
    { name: 'Github', class: 'fab fa-github' },
    { name: 'Discord', class: 'fab fa-discord' }
];

let currentIconPickerTarget = null;
let currentIconPreviewWrap = null;
let searchDebounce = null;

function sanitizeIconClass(val) {
    if (!val) return '';
    let str = String(val);

    // Unescape first if someone double-escaped or passed HTML entities
    str = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

    // Extract class if it's an HTML tag
    if (str.includes('<i ') || str.includes('<span ')) {
        const match = str.match(/class\s*=\s*["']([^"']+)["']/i);
        if (match) return match[1].trim();
    }

    // Strip HTML and return just the class string
    return str.replace(/<[^>]*>/g, '').trim();
}

function getIconMeta(iconClass) {
    if (!iconClass) return null;
    return FA_ICONS_DEFAULT.find(icon => icon.class === iconClass) || null;
}

function getIconLabel(iconClass) {
    const meta = getIconMeta(iconClass);
    if (meta) return meta.name;
    if (!iconClass) return 'Choose icon';

    return iconClass
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part.replace(/^fa[sbrl]?-/i, '').replace(/^fa[sbrl]?$/i, ''))
        .filter(Boolean)
        .join(' ')
        .replace(/\b\w/g, char => char.toUpperCase()) || 'Choose icon';
}

function updateIconPreviewState(wrapper, iconClass) {
    if (!wrapper) return;
    const cleanClass = sanitizeIconClass(iconClass);

    const previewIcon = wrapper.querySelector('.icon-preview-box i');
    const label = wrapper.querySelector('.icon-preview-label');
    const classLabel = wrapper.querySelector('.icon-preview-class');

    if (previewIcon) {
        previewIcon.className = cleanClass || 'fas fa-icons';
    }
    if (label) {
        label.textContent = getIconLabel(cleanClass);
    }
    if (classLabel) {
        classLabel.textContent = cleanClass || 'Click to choose';
    }
}

function createVisualIconInput(inputName, initialValue = '', id = '') {
    const cleanClass = sanitizeIconClass(initialValue);
    const previewLabel = getIconLabel(cleanClass);
    const previewClass = cleanClass || 'Click to choose';

    return `
      <div class="icon-picker-wrap">
          <input type="hidden" name="${inputName}" id="${id}" value="${esc(cleanClass)}">
          <button type="button" class="icon-preview-box" onclick="openIconPicker('${id}', this)" aria-label="Choose icon">
              <i class="${esc(cleanClass) || 'fas fa-icons'}"></i>
          </button>
          <div class="icon-preview-meta">
              <span class="icon-preview-label">${esc(previewLabel)}</span>
              <span class="icon-preview-class">${esc(previewClass)}</span>
          </div>
      </div>
    `;
}
window.createVisualIconInput = createVisualIconInput;

function openIconPicker(inputId, previewEl) {
    ensureFontAwesomeLoaded();
    currentIconPickerTarget = document.getElementById(inputId);
    currentIconPreviewWrap = previewEl.closest('.icon-picker-wrap');

    let modal = document.getElementById('iconPickerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'iconPickerModal';
        modal.className = 'icon-picker-modal';

        const content = document.createElement('div');
        content.className = 'icon-picker-content';

        const header = document.createElement('div');
        header.className = 'icon-picker-header';
        header.innerHTML = `
            <h3>Select an Icon</h3>
            <p style="font-size: 0.8rem; color: #64748b; margin: -0.5rem 0 0.5rem 0;">Powered by FontAwesome. Search directly from icon server.</p>
            <input type="text" id="iconPickerSearch" placeholder="Search icons...">
            <button type="button" class="icon-close-btn" onclick="closeIconPicker()">&times;</button>
        `;

        const grid = document.createElement('div');
        grid.className = 'icon-picker-grid';
        grid.id = 'iconPickerGrid';

        content.appendChild(header);
        content.appendChild(grid);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Modal overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeIconPicker();
        });

        // Search
        document.getElementById('iconPickerSearch').addEventListener('input', (e) => {
            renderIconGrid(e.target.value);
        });
    }

    renderIconGrid();
    modal.classList.add('show');
    document.getElementById('iconPickerSearch').value = '';
    document.getElementById('iconPickerSearch').focus();
}
window.openIconPicker = openIconPicker;

function closeIconPicker() {
    const modal = document.getElementById('iconPickerModal');
    if (modal) modal.classList.remove('show');
}
window.closeIconPicker = closeIconPicker;

function selectIcon(iconClass) {
    if (currentIconPickerTarget) {
        currentIconPickerTarget.value = iconClass;
    }
    updateIconPreviewState(currentIconPreviewWrap, iconClass);
    closeIconPicker();
}

function renderIconGrid(query = '') {
    const grid = document.getElementById('iconPickerGrid');
    if (!grid) return;

    const q = query.trim().toLowerCase();

    if (!q) {
        renderIconBlocks(FA_ICONS_DEFAULT);
        return;
    }

    grid.innerHTML = '<div class="icon-picker-empty"><span>Searching icons server... <i class="fas fa-spinner fa-spin" style="margin-left:5px"></i></span></div>';

    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(async () => {
        try {
            // Using Iconify API to search all FontAwesome 6 icons dynamically
            const url = `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=48&prefixes=fa6-solid,fa6-regular,fa6-brands,fa-solid,fa-brands`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data && data.icons && data.icons.length > 0) {
                const results = data.icons.map(iconStr => { 
                    const [prefix, name] = iconStr.split(':');
                    let faPrefix = 'fas';
                    if (prefix === 'fa6-regular' || prefix === 'fa-regular') faPrefix = 'far';
                    else if (prefix === 'fa6-brands' || prefix === 'fa-brands') faPrefix = 'fab';
                    
                    return {
                        name: name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        class: `${faPrefix} fa-${name}`
                    };
                });
                renderIconBlocks(results);
            } else {
                grid.innerHTML = `<div class="icon-picker-empty">No icons matched "${esc(query)}". Try a different term.</div>`;
            }
        } catch (err) {
            console.error('Icon search API failed:', err);
            // Fallback to local filtering if offline
            const normalizedQuery = q.replace(/\s+/g, '');
            const localMatches = FA_ICONS_DEFAULT.filter(ic => 
                ic.name.toLowerCase().includes(q) || 
                ic.class.toLowerCase().includes(q) || 
                ic.name.replace(/\s+/g, '').toLowerCase().includes(normalizedQuery)
            );
            
            if (localMatches.length > 0) {
                renderIconBlocks(localMatches);
            } else {
                 grid.innerHTML = `<div class="icon-picker-empty" style="color:#ef4444;">Search server unreachable. No local icons matched "${esc(query)}".</div>`;
            }
        }
    }, 450);
}

function renderIconBlocks(iconArray) {
    const grid = document.getElementById('iconPickerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    iconArray.forEach(ic => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-picker-btn';
        btn.title = ic.name;
        btn.onclick = () => selectIcon(ic.class);
        btn.innerHTML = `
            <i class="${ic.class}" aria-hidden="true"></i>
            <span class="icon-picker-btn-label">${esc(ic.name)}</span>
            <span class="icon-picker-btn-class">${esc(ic.class)}</span>
        `;
        grid.appendChild(btn);
    });
}

ensureFontAwesomeLoaded();