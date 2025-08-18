const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const { isLoggedIn } = require('../middleware/authMiddleware');


const products = [
    {
        id: 1,
        image: '/assets/product1.jpg',
    badge: 'NEW',
    title: 'NFC Business Card',
    subtitle: 'A smart way to connect',
    price: 999,
    description: 'A digital business card that allows you to share your contact details, social media profiles, and website with just a tap. No more paper cards, just instant connections.',
    features: ['Customizable', 'Universal', 'Durable', 'Waterproof', 'Contactless']
},
{
    id: 2,
    image: '/assets/product2.jpg',
    badge: 'SALE',
    title: 'Smart Keychain',
    subtitle: 'Never lose your keys again',
    price: 499,
    description: 'A smart keychain that helps you find your keys using your smartphone. It also has a built-in flashlight and can be used as a bottle opener.',
    features: ['Bluetooth enabled', 'Compact design', 'Long battery life', 'Find my keys', 'Multi-functional']
},
{
    id: 3,
    image: '/assets/product3.jpg',
    badge: 'BEST SELLER',
    title: 'Google Review Card',
    subtitle: 'Boost your business ratings',
    price: 799,
    description: 'A digital card designed to collect and showcase Google reviews. Perfect for businesses looking to enhance their online reputation.',
    features: ['NFC enabled', 'Customizable design', 'Instant review collection', 'Analytics dashboard', 'Easy sharing']
  },
  {
    id: 4,
    image: '/assets/product3.jpg',
    badge: 'LIMITED EDITION',
    title: 'Event Pass Card',
    subtitle: 'Your ticket to exclusive events',
    price: 1299,
    description: 'An NFC-enabled event pass that allows you to access exclusive events and offers. Share your event details with others easily.',
    features: ['NFC enabled', 'Customizable design', 'Instant access', 'Event reminders', 'Easy sharing']
  }
];

const testimonials = [
        {
            text: "Asparsh has transformed the way I network. It's fast, efficient, and eco-friendly!",
            name: "Karan Desai",
            role: "Software Engineer",
            avatar: "/assets/testimonial7.jpg"
        },
        {
            text: "Buy our product and be the first to give a positive review!",
            name: "Aryan Singh",
            role: "Founder, Asparsh",
            avatar: "/assets/testimonial5.jpg"
        },
    ];

    
    // Index route
    router.get("/", (req, res) => {
        res.render("index", { products, testimonials, layout: "layouts/boilerplate" });
    });
    
    // Home route
    router.get("/home", (req, res) => {
        res.render("home", { layout: "layouts/boilerplate" });
    });
    
    // Contact Us page
    router.get("/contact", (req, res) => {
        res.render("contact", { layout: "layouts/boilerplate" });
    });
    
    // Pricing page
    router.get("/pricing", (req, res) => {
        res.render("pricing", { layout: "layouts/boilerplate" });
    });
    
    // Dashboard route (protected)
    router.get("/dashboard", isLoggedIn, (req, res) => {
        res.render("dashboard", { layout: "layouts/dashboard-boilerplate" });
    });

    // Handle hotel show page creation
    const multer = require('multer');
    const upload = multer();
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    router.post("/dashboard/create-hotel", isLoggedIn, upload.fields([
        { name: 'hotelLogo', maxCount: 1 },
        { name: 'hotelOfferBanner', maxCount: 1 }
    ]), async (req, res) => {
        try {
            const { hotelId, hotelName, hotelDescription, hotelType, street, city, state, country, zipCode } = req.body;
            // Generate hotelSlug from hotelName
            const hotelSlug = hotelName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 50);
            const createdBy = req.user._id;
            // Upload images to Cloudinary
            const logoFile = req.files['hotelLogo'] ? req.files['hotelLogo'][0] : null;
            const bannerFile = req.files['hotelOfferBanner'] ? req.files['hotelOfferBanner'][0] : null;
            let hotelLogoUrl = '';
            let hotelOfferBannerUrl = '';
            // Helper to upload to Cloudinary and return URL
            async function uploadToCloudinary(file, folderName) {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: folderName }, (error, result) => {
                        if (error) return reject(error);
                        console.log('Cloudinary upload result:', result);
                        resolve(result.secure_url);
                    });
                    stream.end(file.buffer);
                });
            }
            if (logoFile) {
                hotelLogoUrl = await uploadToCloudinary(logoFile, 'hotels');
            }
            if (bannerFile) {
                hotelOfferBannerUrl = await uploadToCloudinary(bannerFile, 'hotels');
            }
            // Parse foodCategories from form
            let foodCategories = [];
            if (req.body.foodCategories) {
                // If only one category, req.body.foodCategories is an object, else array
                const categories = Array.isArray(req.body.foodCategories) ? req.body.foodCategories : [req.body.foodCategories];
                foodCategories = categories.map(cat => {
                    let foodItems = [];
                    if (cat.foodItems) {
                        const items = Array.isArray(cat.foodItems) ? cat.foodItems : [cat.foodItems];
                        foodItems = items.map(item => ({
                            itemName: item.itemName,
                            price: item.price
                        }));
                    }
                    return {
                        categoryName: cat.categoryName,
                        imageUrl: cat.imageUrl,
                        foodItems
                    };
                });
            }
            // Check required fields
            if (!hotelId || !hotelName || !hotelDescription || !hotelType || !hotelLogoUrl || !hotelOfferBannerUrl || !street || !city || !state || !country || !zipCode || !createdBy) {
                console.error('Missing required hotel fields:', { hotelId, hotelName, hotelDescription, hotelType, hotelLogoUrl, hotelOfferBannerUrl, street, city, state, country, zipCode, createdBy });
                return res.status(400).send('Missing required hotel fields');
            }
            // Create hotel document
            const hotel = new Hotel({
                hotelSlug,
                hotelId,
                hotelName,
                hotelDescription,
                hotelType,
                hotelLogo: hotelLogoUrl,
                hotelOfferBanner: hotelOfferBannerUrl,
                hotelAddress: { street, city, state, country, zipCode },
                foodCategories,
                createdBy,
                createdByUsername: req.user.username || req.user.email || ''
            });
            await hotel.save();
            res.redirect(`/hotel/${hotelSlug}`);
        } catch (err) {
            console.error(err);
            res.status(500).send('Error saving hotel data');
        }
    });
    
    // About Us page
    router.get("/about", (req, res) => {
        res.render("about", { layout: "layouts/boilerplate" });
    });
    
    
// Hotels index page (public, hotel-boilerplate)
const Hotel = require('../models/Hotel');
router.get('/hotels', async (req, res) => {
  try {
      const hotels = await Hotel.find({});
    res.render('hotels/index', { hotels, layout: 'layouts/hotel-boilerplate' }); // Correct: views/hotels/index.ejs
} catch (err) {
    console.error(err);
    res.render('hotels/index', { hotels: [], layout: 'layouts/hotel-boilerplate', error: 'Could not load hotels.' });
}
});

// Dashboard page (protected, dashboard-boilerplate)
router.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
});

// Public hotel show page
const hotelController = require('../controllers/hotelController');
router.get('/hotel/:hotelSlug', hotelController.showHotelPage); // Correct: controller should render views/hotels/show.ejs


router.get('/hotels/:hotelId', cache('5 minutes'), hotelController.showHotelPage);

// Public portfolio page (friendly URL)
const portfolioController = require('../controllers/portfolioController');
router.get('/p/:slug/:id', portfolioController.showPublic);

module.exports = router;