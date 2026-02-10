const DynamicLink = require('../models/DynamicLink');
const QRCode = require('qrcode');

// Helper to generate random slug
const generateSlug = async () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let slug = '';
    for (let i = 0; i < 6; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check for collision
    const existing = await DynamicLink.findOne({ slug });
    if (existing) return generateSlug();
    return slug;
};

exports.index = async (req, res) => {
    try {
        const links = await DynamicLink.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.render('dynamic-links/index', {
            links,
            title: 'Dynamic Links',
            req: req
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not load links');
        res.redirect('/dashboard/' + req.user.slug);
    }
};

exports.renderNewForm = (req, res) => {
    res.render('dynamic-links/new', {
        layout: 'layouts/dashboard-boilerplate',
        user: req.user,
        req: req
    });
};

exports.createLink = async (req, res) => {
    try {
        const { destinationUrl, name } = req.body;
        const slug = await generateSlug();

        await DynamicLink.create({
            slug,
            destinationUrl,
            name,
            owner: req.user._id
        });

        req.flash('success', 'Dynamic Link created successfully');
        res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
    } catch (err) {
        console.error(err);
        res.render('dynamic-links/new', {
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            req: req,
            error: 'Could not create link. Please try again.',
            formData: req.body
        });
    }
};

exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await DynamicLink.findOne({ _id: id, owner: req.user._id });
        if (!link) {
            req.flash('error', 'Link not found');
            return res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
        }
        res.render('dynamic-links/edit', {
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            link,
            req: req
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading link');
        res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
    }
};

exports.updateLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { destinationUrl, name } = req.body;

        const link = await DynamicLink.findOneAndUpdate(
            { _id: id, owner: req.user._id },
            { destinationUrl, name },
            { new: true }
        );

        if (!link) {
            req.flash('error', 'Link not found');
            return res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
        }

        req.flash('success', 'Link updated successfully');
        res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
    } catch (err) {
        console.error(err);
        const { id } = req.params;
        // Try to fetch link again to render form
        let link = await DynamicLink.findById(id);
        // fallback if DB error prevents finding it, render what we have
        if (!link) link = { _id: id, ...req.body };

        res.render('dynamic-links/edit', {
            layout: 'layouts/dashboard-boilerplate',
            user: req.user,
            req: req,
            link,
            error: 'Could not update link. Please try again.'
        });
    }
};

exports.deleteLink = async (req, res) => {
    try {
        const { id } = req.params;
        await DynamicLink.findOneAndDelete({ _id: id, owner: req.user._id });
        req.flash('success', 'Link deleted successfully');
        res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
    } catch (err) {
        console.error(err);
        req.flash('error', 'Could not delete link');
        res.redirect(`/dashboard/${req.user.slug}/dynamic-links`);
    }
};

exports.getQrCode = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await DynamicLink.findOne({ _id: id, owner: req.user._id });
        if (!link) return res.status(404).send('Link not found');

        const systemUrl = `${req.protocol}://${req.get('host')}/q/${link.slug}`;
        const qrCodeImage = await QRCode.toDataURL(systemUrl);

        res.json({ qrCodeImage, systemUrl });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating QR code');
    }
};

exports.redirectLink = async (req, res) => {
    try {
        const { slug } = req.params;
        const link = await DynamicLink.findOne({ slug });

        if (!link) {
            return res.status(404).send('Link not found');
        }

        // Increment clicks
        link.clicks += 1;
        await link.save();

        // Ensure destination has protocol
        let destination = link.destinationUrl;
        if (!/^https?:\/\//i.test(destination)) {
            destination = 'http://' + destination;
        }

        res.redirect(destination);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
