// portfolio-wizard.js

let currentStep = 0;
let selectedProfileId = null;
let selectedDesignId = null;
let selectedSkills = [];
let socialLinks = [];
let workExperience = [];
let experienceTimeline = [];
let galleryFiles = [];

// Initialize wizard
document.addEventListener('DOMContentLoaded', () => {
  initWizard();
  loadDesigns();
  setupProfileSearch();
  setupSkillSearch();
  setupFormValidation();
  setupImagePreviews();
  setupCharCounters();
});

// ========== Wizard Navigation ==========
function initWizard() {
  const stepButtons = document.querySelectorAll('.step-btn');
  const navButtons = document.querySelectorAll('[data-action]');
  
  stepButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt(btn.dataset.step);
      if (step <= currentStep) {
        goToStep(step);
      }
    });
  });

  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const action = btn.dataset.action;
      
      if (action === 'next') {
        if (validateCurrentStep()) {
          goToStep(currentStep + 1);
        }
      } else if (action === 'prev') {
        goToStep(currentStep - 1);
      }
    });
  });

  // Form submission
  document.getElementById('portfolioWizardForm').addEventListener('submit', handleSubmit);
}

function goToStep(stepNum) {
  const steps = document.querySelectorAll('.wizard-step');
  const stepButtons = document.querySelectorAll('.step-btn');
  
  if (stepNum < 0 || stepNum >= steps.length) return;
  
  // Hide current step
  steps[currentStep].classList.remove('active');
  stepButtons[currentStep].classList.remove('active');
  
  // Show new step
  currentStep = stepNum;
  steps[currentStep].classList.add('active');
  stepButtons[currentStep].classList.add('active');
  
  // Mark completed steps
  stepButtons.forEach((btn, idx) => {
    if (idx < currentStep) {
      btn.classList.add('completed');
    }
  });
  
  // Update review if on final step
  if (currentStep === 8) {
    generateReview();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== Step 0: Design & Profile Selection ==========
async function loadDesigns() {
  try {
    const response = await fetch('/api/designs');
    if (!response.ok) throw new Error('Failed to fetch designs');
    
    const designs = await response.json();
    const grid = document.getElementById('designGrid');
    if (!grid) return;
    
    grid.innerHTML = designs.map(design => `
      <div class="design-card" data-design-id="${design._id}" onclick="selectDesign('${design._id}', this)">
        <img src="${design.previewImage || '/assets/default-design.png'}" alt="${design.name}">
        <h4>${design.name}</h4>
        <p>${design.description}</p>
        <div class="design-overlay">
          <i class="fas fa-check-circle"></i>
        </div>
      </div>
    `).join('');

    if (designs.length === 0) {
      grid.innerHTML = '<div class="no-designs">No portfolio designs available.</div>';
    }
  } catch (err) {
    console.error('Error loading designs:', err);
    const grid = document.getElementById('designGrid');
    if (grid) {
      grid.innerHTML = '<div class="error">Failed to load designs. Please try again later.</div>';
    }
    showNotification('Failed to load designs', 'error');
  }
}

function selectDesign(designId, element) {
  selectedDesignId = designId;
  document.getElementById('designId').value = designId;
  
  // Visual feedback
  document.querySelectorAll('.design-card').forEach(card => {
    card.classList.remove('selected');
  });
  element.classList.add('selected');
  
  checkStep0Completion();
}

function setupProfileSearch() {
  const searchInput = document.getElementById('profileSearch');
  const resultsDiv = document.getElementById('profileSearchResults');
  let debounceTimer;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      resultsDiv.innerHTML = '';
      return;
    }
    
    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch profiles');
        
        const profiles = await response.json();
        
        if (profiles && profiles.length > 0) {
          resultsDiv.innerHTML = profiles.map(profile => `
            <div class="search-result-item" onclick="selectProfile('${profile._id}', '${profile.name || ''}', '${profile.slug || ''}')">
              ${profile.image ? `<img src="${profile.image}" alt="${profile.name || 'Profile'}" />` : ''}
              <div class="profile-info">
                <strong>${profile.name || profile.slug || 'Unnamed Profile'}</strong>
                <small>${[profile.email, profile.mobile].filter(Boolean).join(' | ') || 'No contact info'}</small>
              </div>
            </div>
          `).join('');
        } else {
          resultsDiv.innerHTML = '<div class="no-results">No profiles found</div>';
        }
      } catch (err) {
        console.error('Profile search error:', err);
        resultsDiv.innerHTML = '<div class="error">Failed to search profiles. Please try again.</div>';
        showNotification('Failed to search profiles', 'error');
      }
    }, 300);
  });
}

function selectProfile(profileId, name, slug) {
  if (!profileId) {
    showNotification('Invalid profile selection', 'error');
    return;
  }

  selectedProfileId = profileId;
  document.getElementById('profileId').value = profileId;
  
  const cardDiv = document.getElementById('selectedProfileCard');
  cardDiv.innerHTML = `
    <div class="profile-card-selected">
      <i class="fas fa-user-check"></i>
      <strong>Selected:</strong> ${name || 'Unnamed Profile'} ${slug ? `(${slug})` : ''}
      <button type="button" onclick="clearProfile()" class="btn-clear">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  cardDiv.style.display = 'block';
  
  document.getElementById('profileSearchResults').innerHTML = '';
  document.getElementById('profileSearch').value = '';
  
  checkStep0Completion();
}

function clearProfile() {
  selectedProfileId = null;
  document.getElementById('profileId').value = '';
  document.getElementById('selectedProfileCard').style.display = 'none';
  checkStep0Completion();
}

function checkStep0Completion() {
  const nextBtn = document.getElementById('step0NextBtn');
  nextBtn.disabled = !(selectedDesignId && selectedProfileId);
}

// ========== Step 2: Social Links ==========
let socialLinkCounter = 0;

function addSocialLink() {
  const container = document.getElementById('socialLinksList');
  const id = socialLinkCounter++;
  
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.dataset.id = id;
  div.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>Platform</label>
        <select name="socialPlatform_${id}" required>
          <option value="">Select platform...</option>
          <option value="Website">Website</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="GitHub">GitHub</option>
          <option value="Twitter">Twitter</option>
          <option value="Instagram">Instagram</option>
          <option value="Facebook">Facebook</option>
          <option value="YouTube">YouTube</option>
          <option value="Behance">Behance</option>
          <option value="Dribbble">Dribbble</option>
        </select>
      </div>
      <div class="form-group flex-grow">
        <label>URL</label>
        <input type="url" name="socialUrl_${id}" placeholder="https://..." required>
      </div>
      <button type="button" class="btn-remove" onclick="removeSocialLink(${id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  container.appendChild(div);
}

function removeSocialLink(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) item.remove();
}

// ========== Step 5: Skills Search ==========
function setupSkillSearch() {
  const searchInput = document.getElementById('skillSearch');
  const resultsDiv = document.getElementById('skillSearchResults');
  let debounceTimer;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      resultsDiv.innerHTML = '';
      return;
    }
    
    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/skills/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        resultsDiv.innerHTML = data.skills.map(skill => `
          <div class="skill-result-item" onclick="addSkillToPortfolio('${skill._id}', '${skill.name}', '${skill.iconClass}', '${skill.description}')">
            <i class="${skill.iconClass}"></i>
            <div>
              <strong>${skill.name}</strong>
              <small>${skill.description}</small>
            </div>
          </div>
        `).join('');
      } catch (err) {
        console.error('Skill search error:', err);
      }
    }, 300);
  });
}

function addSkillToPortfolio(skillId, name, iconClass, description) {
  if (selectedSkills.find(s => s.id === skillId)) {
    showNotification('Skill already added', 'warning');
    return;
  }
  
  selectedSkills.push({ id: skillId, name, iconClass, description });
  
  const container = document.getElementById('selectedSkillsList');
  const div = document.createElement('div');
  div.className = 'selected-skill-item';
  div.dataset.skillId = skillId;
  div.innerHTML = `
    <i class="${iconClass}"></i>
    <div>
      <strong>${name}</strong>
      <small>${description}</small>
    </div>
    <button type="button" class="btn-remove" onclick="removeSkill('${skillId}')">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(div);
  
  document.getElementById('skillSearch').value = '';
  document.getElementById('skillSearchResults').innerHTML = '';
}

function removeSkill(skillId) {
  selectedSkills = selectedSkills.filter(s => s.id !== skillId);
  const item = document.querySelector(`[data-skill-id="${skillId}"]`);
  if (item) item.remove();
}

// ========== Step 6: Work Experience ==========
let workExpCounter = 0;

function addWorkExperience() {
  const container = document.getElementById('workExperienceList');
  const id = workExpCounter++;
  
  const div = document.createElement('div');
  div.className = 'dynamic-item work-exp-item';
  div.dataset.id = id;
  div.innerHTML = `
    <h4>Project ${id + 1}</h4>
    <div class="form-group">
      <label>Category</label>
      <select name="workCategory_${id}" required>
        <option value="">Select category...</option>
        <option value="Web Development">Web Development</option>
        <option value="Mobile Development">Mobile Development</option>
        <option value="Data Science">Data Science</option>
        <option value="Machine Learning">Machine Learning</option>
        <option value="DevOps">DevOps</option>
        <option value="UI/UX Design">UI/UX Design</option>
        <option value="Digital Marketing">Digital Marketing</option>
        <option value="Content Creation">Content Creation</option>
        <option value="Photography">Photography</option>
        <option value="Videography">Videography</option>
        <option value="Graphic Design">Graphic Design</option>
        <option value="Writing & Editing">Writing & Editing</option>
        <option value="Consulting">Consulting</option>
        <option value="Project Management">Project Management</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="form-group">
      <label>Title</label>
      <input type="text" name="workTitle_${id}" placeholder="Project title" required>
    </div>
    <div class="form-group">
      <label>Description (max 200 chars)</label>
      <textarea name="workDescription_${id}" rows="2" maxlength="200" required></textarea>
    </div>
    <div class="form-group">
      <label>Details/Demo URL</label>
      <input type="url" name="workDetailsUrl_${id}" placeholder="https://..." required>
    </div>
    <button type="button" class="btn-remove" onclick="removeWorkExperience(${id})">
      <i class="fas fa-trash"></i> Remove Project
    </button>
  `;
  container.appendChild(div);
}

function removeWorkExperience(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) item.remove();
}

// ========== Step 7: Experience Timeline ==========
let expCounter = 0;

function addExperience() {
  const container = document.getElementById('experienceList');
  const id = expCounter++;
  
  const div = document.createElement('div');
  div.className = 'dynamic-item exp-timeline-item';
  div.dataset.id = id;
  div.innerHTML = `
    <h4>Experience ${id + 1}</h4>
    <div class="form-group">
      <label>Date Range</label>
      <input type="text" name="expDateRange_${id}" placeholder="e.g., 2020 - Present" required>
    </div>
    <div class="form-group">
      <label>Role Title</label>
      <input type="text" name="expRoleTitle_${id}" placeholder="e.g., Senior Developer" required>
    </div>
    <div class="form-group">
      <label>Organization</label>
      <input type="text" name="expOrganization_${id}" placeholder="e.g., Tech Corp Inc." required>
    </div>
    <div class="form-group">
      <label>Description (max 500 chars)</label>
      <textarea name="expDescription_${id}" rows="3" maxlength="500" required></textarea>
    </div>
    <button type="button" class="btn-remove" onclick="removeExperience(${id})">
      <i class="fas fa-trash"></i> Remove Experience
    </button>
  `;
  container.appendChild(div);
}

function removeExperience(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  if (item) item.remove();
}

// ========== Image Previews ==========
function setupImagePreviews() {
  const heroImage = document.getElementById('heroImage');
  const aboutImage = document.getElementById('aboutImage');
  const galleryImages = document.getElementById('galleryImages');
  
  if (heroImage) {
    heroImage.addEventListener('change', (e) => {
      previewImage(e.target.files[0], 'heroImagePreview');
    });
  }
  
  if (aboutImage) {
    aboutImage.addEventListener('change', (e) => {
      previewImage(e.target.files[0], 'aboutImagePreview');
    });
  }
  
  if (galleryImages) {
    galleryImages.addEventListener('change', (e) => {
      previewGalleryImages(e.target.files);
    });
  }
}

function previewImage(file, previewId) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById(previewId);
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
}

function previewGalleryImages(files) {
  const preview = document.getElementById('galleryPreview');
  preview.innerHTML = '';
  
  Array.from(files).forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'gallery-thumb';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Gallery ${idx + 1}">
        <button type="button" onclick="removeGalleryThumb(this)" class="btn-remove-thumb">
          <i class="fas fa-times"></i>
        </button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removeGalleryThumb(btn) {
  btn.parentElement.remove();
}

// ========== Character Counters ==========
function setupCharCounters() {
  const textareas = document.querySelectorAll('textarea[maxlength]');
  textareas.forEach(textarea => {
    const counter = textarea.nextElementSibling;
    if (counter && counter.classList.contains('char-count')) {
      textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length}/${textarea.maxLength}`;
      });
    }
  });
}

// ========== Validation ==========
function validateCurrentStep() {
  const currentFieldset = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
  const inputs = currentFieldset.querySelectorAll('input[required], textarea[required], select[required]');
  
  let isValid = true;
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });
  
  if (!isValid) {
    showNotification('Please fill in all required fields', 'error');
  }
  
  return isValid;
}

function setupFormValidation() {
  const form = document.getElementById('portfolioWizardForm');
  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
      e.target.classList.remove('error');
    }
  });
}

// ========== Review Generation ==========
function generateReview() {
  const reviewDiv = document.getElementById('reviewContent');
  const formData = new FormData(document.getElementById('portfolioWizardForm'));
  
  let html = '<div class="review-section">';
  
  // Design & Profile
  html += `<h3>Design & Profile</h3>`;
  html += `<p><strong>Design ID:</strong> ${selectedDesignId}</p>`;
  html += `<p><strong>Profile ID:</strong> ${selectedProfileId}</p>`;
  
  // Hero Section
  html += `<h3>Hero Section</h3>`;
  html += `<p><strong>Name:</strong> ${formData.get('name')}</p>`;
  html += `<p><strong>Profession:</strong> ${formData.get('profession')}</p>`;
  html += `<p><strong>Brief Intro:</strong> ${formData.get('briefIntro')}</p>`;
  
  // Skills
  html += `<h3>Skills (${selectedSkills.length})</h3>`;
  html += `<ul>${selectedSkills.map(s => `<li>${s.name}</li>`).join('')}</ul>`;
  
  // Work Experience
  const workItems = document.querySelectorAll('#workExperienceList .dynamic-item');
  html += `<h3>Work Experience (${workItems.length} projects)</h3>`;
  
  // Experience Timeline
  const expItems = document.querySelectorAll('#experienceList .dynamic-item');
  html += `<h3>Timeline (${expItems.length} entries)</h3>`;
  
  html += '</div>';
  reviewDiv.innerHTML = html;
}

// ========== Form Submission ==========
async function handleSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Add selected skills as JSON
  formData.append('skills', JSON.stringify(selectedSkills.map(s => s.id)));
  
  // Get CSRF token
  const csrf = document.getElementById('_csrf');
  if (csrf) {
    formData.append('_csrf', csrf.value);
  }
  
  try {
    showNotification('Creating portfolio...', 'info');
    
    const response = await fetch('/portfolio/create', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Portfolio created successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/portfolio/${data.slug}`;
      }, 1500);
    } else {
      showNotification(data.message || 'Error creating portfolio', 'error');
    }
  } catch (err) {
    console.error('Submission error:', err);
    showNotification('Network error. Please try again.', 'error');
  }
}

// ========== Notification System ==========
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
