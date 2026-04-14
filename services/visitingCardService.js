const visitingCardRepository = require('../repositories/visitingCardRepository');
const templateRepository = require('../repositories/templateRepository');

// Cloudinary upload helper
let uploadToCloudinary;
try {
    const uploadMw = require('../middleware/uploadMiddleware');
    uploadToCloudinary = uploadMw.uploadToCloudinary;
} catch (e) {
    uploadToCloudinary = null;
}

// Try to load profileRepository — graceful fallback if not present
let profileRepository = null;
try { profileRepository = require('../repositories/profileRepository'); } catch (_) {}

class VisitingCardService {

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────

    async createVisitingCard({ body, files = {}, user }) {
        if (!body) throw new Error('Request body missing');
        if (!body.templateId) throw new Error('Please select a design template');

        const template = await templateRepository.findTemplateById(body.templateId);
        if (!template) throw new Error('Selected template not found');

        // Upload images to Cloudinary and inject URLs into body
        await this.handleMediaUploads(files, body);

        // Build the card payload from form body
        const payload = this.normalizePayload({ body });

        // Link template
        payload.templateId = template._id;

        // Link user
        if (user && user._id) payload.userId = user._id;

        // Ensure slug uniqueness
        let slug = payload.slug || this.generateSlug(payload.profile && payload.profile.fullName);
        const existing = await visitingCardRepository.findBySlug(slug);
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        payload.slug = slug;

        return visitingCardRepository.create(payload);
    }

    // ─────────────────────────────────────────────
    // READ — dashboard list
    // ─────────────────────────────────────────────

    async getDashboardCards() {
        return visitingCardRepository.findAll();
    }

    // ─────────────────────────────────────────────
    // READ — public render
    // ─────────────────────────────────────────────

    async getRenderPayload(slug) {
        const card = await visitingCardRepository.findBySlug(slug);
        if (!card) throw new Error('Visiting card not found');
        if (!card.templateId) throw new Error('Template not found for this card');

        // Increment view count (fire-and-forget)
        visitingCardRepository.incrementViewCount(slug).catch(() => {});

        // Attach the populated template as `template` for backward compat with EJS
        return { card, template: card.templateId };
    }

    // ─────────────────────────────────────────────
    // READ — edit form
    // ─────────────────────────────────────────────

    async getCardForEdit(id) {
        const card = await visitingCardRepository.findById(id);
        if (!card) throw new Error('Visiting card not found');
        return card;
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────

    async updateCard(id, body, files = {}) {
        const card = await visitingCardRepository.findById(id);
        if (!card) throw new Error('Visiting card not found');

        await this.handleMediaUploads(files, body);
        const updated = this.normalizePayload({ body });

        // Preserve immutable system fields
        delete updated.slug;
        delete updated.templateId;
        updated.userId = card.userId;

        return visitingCardRepository.updateById(id, updated);
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────

    async deleteCard(id) {
        return visitingCardRepository.deleteById(id);
    }

    // ─────────────────────────────────────────────
    // IMAGE UPLOADS
    // ─────────────────────────────────────────────

    async handleMediaUploads(files, body) {
        if (!uploadToCloudinary || !files || !Array.isArray(files) || files.length === 0) return;

        // Process uploads in batches of 3 to avoid rate limits
        const concurrency = 3;
        for (let i = 0; i < files.length; i += concurrency) {
            const batch = files.slice(i, i + concurrency);
            await Promise.all(batch.map(async (file) => {
                try {
                    const r = await uploadToCloudinary(file.buffer, 'vcard-uploads', file.mimetype);
                    this.setNestedValue(body, file.fieldname, r.secure_url);
                } catch (e) {
                    console.error('Media upload failed for', file.fieldname, ':', e.message);
                }
            }));
        }
    }

    setNestedValue(obj, path, value) {
        const keys = path.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean);
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined) {
                current[key] = isNaN(keys[i + 1]) ? {} : [];
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
    }

    // ─────────────────────────────────────────────
    // PAYLOAD NORMALIZER — Maps form body → Universal Schema
    // ─────────────────────────────────────────────

    normalizePayload({ body }) {
        // ── Profile ──────────────────────────────
        const profileBody = body.profile || {};
        const profile = {
            fullName:     profileBody.fullName     || body.fullName     || '',
            designation:  profileBody.designation  || body.designation  || '',
            companyName:  profileBody.companyName  || body.companyName  || '',
            bio:          profileBody.bio           || body.bio          || '',
            profileImage: profileBody.profileImage || body.profileImage || '',
            coverImage:   profileBody.coverImage   || body.coverImage || '',
            logo:         profileBody.logo         || body.logo      || ''
        };
        // Custom fields (Map)
        if (profileBody.customFields && typeof profileBody.customFields === 'object') {
            profile.customFields = profileBody.customFields;
        }

        // ── Contact ──────────────────────────────
        const contactBody = body.contact || {};
        const contact = {
            primaryEmail: contactBody.primaryEmail || body.primaryEmail || '',
            primaryPhone: contactBody.primaryPhone || body.primaryPhone || '',
            website:      contactBody.website      || body.website      || '',
            businessHours: contactBody.businessHours || body.businessHours || '',
            location: {
                address:     (contactBody.location && contactBody.location.address)     || body.address  || '',
                mapEmbedUrl: (contactBody.location && contactBody.location.mapEmbedUrl) || body.mapEmbedUrl || ''
            },
            additionalContacts: this.normalizeArrayField(
                contactBody.additionalContacts || body.additionalContacts, []
            ).filter(c => c.platform && c.value)
        };

        // ── Socials (dynamic repeatable rows) ───
        const socials = this.normalizeArrayField(body.socials, []).filter(s => s.platform && s.url);

        // ── Stats ────────────────────────────────
        const stats = this.normalizeArrayField(body.stats, []).filter(s => s.label && s.value);

        // ── Services ─────────────────────────────
        const services = this.normalizeArrayField(body.services, []).filter(s => s.title);

        // ── Pricing Plans ────────────────────────
        const pricingPlans = this.normalizeArrayField(body.pricingPlans, []).filter(p => p.planName);
        // Handle features which is an array of strings
        pricingPlans.forEach(plan => {
            if (plan.features && typeof plan.features === 'string') {
                plan.features = plan.features.split('\n').map(f => f.trim()).filter(Boolean);
            }
        });

        // ── Portfolio ────────────────────────────
        const portfolio = this.normalizeArrayField(body.portfolio, []).filter(p => p.mediaUrl || p.title);

        // ── Experience ───────────────────────────
        const experience = this.normalizeArrayField(body.experience, []).filter(e => e.title);

        // ── Testimonials ─────────────────────────
        const testimonials = this.normalizeArrayField(body.testimonials, []).filter(t => t.quote);

        // ── Gallery ──────────────────────────────
        const gallery = this.normalizeArrayField(body.gallery, []).filter(g => g.image);

        // ── Partners ─────────────────────────────
        const partners = this.normalizeArrayField(body.partners, []).filter(p => p.name || p.logo);

        // ── Qualifications ───────────────────────
        let qualifications = [];
        if (body.qualifications) {
            // body.qualifications could be an array if there are multiple inputs, or string if single / comma-separated text area
            if (Array.isArray(body.qualifications)) {
                qualifications = body.qualifications.filter(Boolean);
            } else if (typeof body.qualifications === 'string') {
                qualifications = body.qualifications.split('\n').map(q => q.trim()).filter(Boolean);
            }
        }

        // ── Specializations ──────────────────────
        const specializations = this.normalizeArrayField(body.specializations, []).filter(s => s.title);

        // ── Theme ────────────────────────────────
        const themeBody = body.theme || {};
        const theme = {
            primaryColor:   themeBody.primaryColor   || body.primaryColor   || '#1e40af',
            secondaryColor: themeBody.secondaryColor || body.secondaryColor || '#0891b2',
            fontStyle:      themeBody.fontStyle      || body.fontStyle      || 'Inter',
            sectionTitles: {
                services: (themeBody.sectionTitles && themeBody.sectionTitles.services) || 'Our Services',
                experience: (themeBody.sectionTitles && themeBody.sectionTitles.experience) || 'Experience',
                gallery: (themeBody.sectionTitles && themeBody.sectionTitles.gallery) || 'Gallery',
                partners: (themeBody.sectionTitles && themeBody.sectionTitles.partners) || 'Our Partners',
            }
        };

        const isPublished = body.isPublished !== 'false' && body.isPublished !== false;

        return {
            profile,
            contact,
            socials,
            stats,
            services,
            pricingPlans,
            portfolio,
            experience,
            testimonials,
            gallery,
            partners,
            qualifications,
            specializations,
            theme,
            isPublished,
            slug: this.generateSlug(profile.fullName)
        };
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    generateSlug(text) {
        return String(text || 'vcard')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    /**
     * Express body-parser parses `socials[0][platform]` into:
     *   { socials: [ { platform: '...', url: '...' }, ... ] }
     * This method normalises both array and object-with-numeric-keys shapes.
     */
    normalizeArrayField(value, defaultVal = []) {
        if (!value) return defaultVal;
        if (Array.isArray(value)) return value.filter(Boolean);
        // Object with numeric string keys (e.g. { '0': {...}, '1': {...} })
        if (typeof value === 'object') {
            return Object.keys(value)
                .sort((a, b) => Number(a) - Number(b))
                .map(k => value[k])
                .filter(Boolean);
        }
        return defaultVal;
    }
}

module.exports = new VisitingCardService();