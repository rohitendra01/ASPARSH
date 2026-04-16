const visitingCardService = require('../services/visitingCardService');
const templateRepository = require('../repositories/templateRepository');
const { getCsrfToken } = require('../utils/securityUtils');

// ─────────────────────────────────────────────
// DASHBOARD LIST
// ─────────────────────────────────────────────

exports.list = async (req, res) => {
    try {
        const cards = await visitingCardService.getDashboardCards();
        const templates = await templateRepository.findAllTemplates();
        const slug = req.params?.slug || req.user?.slug || '';

        res.render('visiting-cards/index', {
            cards,
            templates,
            slug,
            user: req.user,
            totalCards: cards.length,
            totalTemplates: templates.length,
            totalViews: cards.reduce((sum, c) => sum + (c.viewCount || 0), 0),
            layout: 'layouts/dashboard-boilerplate'
        });
    } catch (err) {
        console.error('Error loading visiting cards list:', err);
        res.status(500).send('Error loading visiting cards');
    }
};

// ─────────────────────────────────────────────
// NEW FORM
// ─────────────────────────────────────────────

exports.renderNewForm = async (req, res) => {
    try {
        let profiles = [];
        try {
            profiles = await require('../repositories/profileRepository').findAllProfiles(null, 5);
        } catch (_) { /* profileRepository is optional */ }

        const templates = await templateRepository.findAllActiveTemplates();
        const { token: csrfToken, generationError } = getCsrfToken(req, res);
        const slug = req.params?.slug || req.user?.slug || '';

        const opts = {
            templates,
            profiles,
            slug,
            csrfToken,
            user: req.user || null,
            layout: 'layouts/dashboard-boilerplate'
        };
        if (generationError) opts.error = 'Unable to generate security token. Please try again.';

        res.render('visiting-cards/new', opts);
    } catch (err) {
        console.error('Error rendering new vCard form:', err);
        res.status(500).send('Error loading form');
    }
};

// ─────────────────────────────────────────────
// TEMPLATE SCHEMA API (AJAX — returns custom fields JSON)
// ─────────────────────────────────────────────

exports.getTemplateSchema = async (req, res) => {
    try {
        const template = await templateRepository.findTemplateById(req.params.templateId);
        if (!template) return res.status(404).json({ error: 'Template not found' });
        res.json({ customFields: template.customFields || [] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

exports.createVisitingCard = async (req, res) => {
    const slug = req.params?.slug || req.user?.slug || '';
    try {
        await visitingCardService.createVisitingCard({
            body: req.body,
            files: req.files || {},
            user: req.user
        });
        res.redirect(`/dashboard/${slug}/visiting-cards`);
    } catch (err) {
        console.error('vCard create error:', err);
        try {
            const templates = await templateRepository.findAllActiveTemplates();
            const { token: csrfToken } = getCsrfToken(req, res);
            res.status(400).render('visiting-cards/new', {
                templates,
                profiles: [],
                slug,
                csrfToken,
                user: req.user || null,
                error: err.message,
                layout: 'layouts/dashboard-boilerplate'
            });
        } catch (_) {
            res.status(400).send(err.message);
        }
    }
};

// ─────────────────────────────────────────────
// PUBLIC RENDER
// ─────────────────────────────────────────────

exports.renderCard = async (req, res) => {
    try {
        const { card, template } = await visitingCardService.getRenderPayload(req.params.slug);
        // Resolve the EJS file: use `fileName` if available, else fall back to `templateKey`
        const fileName = template.fileName || template.templateKey || 'doctor';
        res.render(`visiting-cards/templates/${fileName}`, {
            card,
            template,
            layout: false
        });
    } catch (err) {
        console.error('[renderCard] Error:', req.params.slug, err.message);
        if (err.message && err.message.includes('not found')) {
            return res.status(404).render('404', { layout: 'layouts/boilerplate' });
        }
        res.status(500).send('Error loading visiting card');
    }
};

// ─────────────────────────────────────────────
// EDIT FORM
// ─────────────────────────────────────────────

exports.renderEditForm = async (req, res) => {
    try {
        const card = await visitingCardService.getCardForEdit(req.params.id);
        const { token: csrfToken, generationError } = getCsrfToken(req, res);
        const slug = req.params?.slug || req.user?.slug || '';

        const opts = {
            card,
            slug,
            csrfToken,
            user: req.user,
            layout: 'layouts/dashboard-boilerplate'
        };
        if (generationError) opts.error = 'Unable to generate security token.';

        res.render('visiting-cards/edit', opts);
    } catch (err) {
        const status = err.message.includes('not found') ? 404 : 500;
        res.status(status).send(err.message);
    }
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

exports.update = async (req, res) => {
    const slug = req.params?.slug || req.user?.slug || '';
    try {
        await visitingCardService.updateCard(req.params.id, req.body, req.files || {});
        res.redirect(`/dashboard/${slug}/visiting-cards`);
    } catch (err) {
        console.error('vCard update error:', err);
        res.status(400).send(err.message);
    }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

exports.delete = async (req, res) => {
    const slug = req.params?.slug || req.user?.slug || '';
    try {
        // Use soft-delete to preserve data integrity
        await visitingCardService.deleteCard(req.params.id);
        res.redirect(`/dashboard/${slug}/visiting-cards`);
    } catch (err) {
        console.error('vCard delete error:', err);
        res.status(500).send(err.message);
    }
};