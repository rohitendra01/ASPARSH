const templateService = require('../services/templateService');
const templateRepository = require('../repositories/templateRepository');
const { getCsrfToken } = require('../utils/securityUtils');

// Render the UI to register a new design
exports.renderNewForm = async (req, res) => {
    try {
        const { token: csrfToken } = getCsrfToken(req, res);
        const slug = req.params.slug || req.user?.slug || '';

        res.render('admin/templates/new', {
            csrfToken,
            slug,
            layout: 'layouts/dashboard-boilerplate',
            user: req.user
        });
    } catch (err) {
        console.error('Error rendering template form:', err);
        res.status(500).send('Error loading page.');
    }
};

// Process the new design registration
exports.create = async (req, res) => {
    const slug = req.params.slug || req.user?.slug || '';
    try {
        await templateService.registerNewTemplate(req.body, req.file);

        // Redirect back to the Master Visiting Cards list with a success query
        res.redirect(`/dashboard/${slug}/visiting-cards?success=Design+Registered`);
    } catch (err) {
        console.error('Template Registration Error:', err);
        const { token: csrfToken } = getCsrfToken(req, res);

        res.status(400).render('admin/templates/new', {
            error: err.message,
            csrfToken,
            slug,
            layout: 'layouts/dashboard-boilerplate',
            user: req.user
        });
    }
};

// Render the UI to edit an existing design schema
exports.renderEditForm = async (req, res) => {
    try {
        const template = await templateRepository.findTemplateById(req.params.id);
        if (!template) {
            return res.status(404).send('Template not found');
        }

        const { token: csrfToken } = getCsrfToken(req, res);
        const slug = req.params.slug || req.user?.slug || '';

        res.render('admin/templates/edit', {
            template,
            csrfToken,
            slug,
            layout: 'layouts/dashboard-boilerplate',
            user: req.user
        });
    } catch (err) {
        console.error('Error rendering edit form:', err);
        res.status(500).send('Error loading page.');
    }
};

exports.update = async (req, res) => {
    const slug = req.params.slug || req.user?.slug || '';
    try {
        await templateService.updateTemplate(req.params.id, req.body, req.file);
        res.redirect(`/dashboard/${slug}/visiting-cards?success=Design+Updated`);
    } catch (err) {
        console.error('Template Update Error:', err);
        res.redirect(`/dashboard/${slug}/templates/${req.params.id}/edit?error=${encodeURIComponent(err.message)}`);
    }
};

// ─────────────────────────────────────────────
// DELETE DESIGN TEMPLATE
// ─────────────────────────────────────────────

exports.delete = async (req, res) => {
    const slug = req.params.slug || req.user?.slug || '';
    try {
        // Safety check: reject deletion if any vCards still reference this template
        const VisitingCard = require('../models/VisitingCard');
        const usageCount = await VisitingCard.countDocuments({ templateId: req.params.id });
        if (usageCount > 0) {
            return res.redirect(
                `/dashboard/${slug}/templates/${req.params.id}/edit?error=${encodeURIComponent(
                    `Cannot delete — ${usageCount} vCard(s) are still using this design. Reassign or delete those cards first.`
                )}`
            );
        }

        await templateRepository.deleteTemplateById(req.params.id);
        res.redirect(`/dashboard/${slug}/visiting-cards?success=Design+Deleted`);
    } catch (err) {
        console.error('Template Delete Error:', err);
        res.redirect(`/dashboard/${slug}/visiting-cards?error=${encodeURIComponent(err.message)}`);
    }
};