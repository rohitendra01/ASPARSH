const express = require('express');
const router = express.Router();
const apicache = require('apicache');
const cache = apicache.middleware;
const { isLoggedIn } = require('../middleware/authMiddleware');
const hotelController = require('../controllers/hotelController');
const portfolioController = require('../controllers/portfolioController');
const visitingCardController = require('../controllers/visitingCardController');

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
        {
            text: "The NFC technology is seamless and has greatly improved our customer interactions. Highly recommend!",
            name: "Priya Sharma",
            role: "Marketing Manager",
            avatar: "/assets/testimonial1.jpg"
        },
        {
            text: "Simple, effective, and professional. Asparsh cards have become an essential part of our business toolkit.",
            name: "Rajesh Kumar",
            role: "Business Owner",
            avatar: "/assets/testimonial2.jpg"
        },
        {
            text: "The response from clients has been overwhelmingly positive. These smart cards are a game-changer!",
            name: "Anita Mehta",
            role: "Sales Director",
            avatar: "/assets/testimonial3.jpg"
        },
        {
            text: "No more fumbling with paper cards. Quick, clean, and modern - exactly what we needed.",
            name: "Vikram Patel",
            role: "Tech Entrepreneur",
            avatar: "/assets/testimonial4.jpg"
        },
        {
            text: "Our networking events have been revolutionized. Easy sharing and instant connections every time.",
            name: "Neha Gupta",
            role: "Event Coordinator",
            avatar: "/assets/testimonial6.jpg"
        }
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
   
// About Us page
router.get("/about", (req, res) => {
    res.render("about", { layout: "layouts/boilerplate" });
});



// Legal & accessibility pages
router.get('/privacy-policy', (req, res) => {
    res.render('privacy', { layout: 'layouts/boilerplate', pageTitle: 'Privacy Policy' });
});

router.get('/terms-of-service', (req, res) => {
    res.render('terms', { layout: 'layouts/boilerplate', pageTitle: 'Terms of Service' });
});

router.get('/cookies-policy', (req, res) => {
    res.render('cookies', { layout: 'layouts/boilerplate', pageTitle: 'Cookies Policy' });
});

router.get('/accessibility', (req, res) => {
    res.render('accessibility', { layout: 'layouts/boilerplate', pageTitle: 'Accessibility' });
});
    


// Dashboard page (protected, dashboard-boilerplate)
router.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
});

// Public hotel show page
router.get('/hotel/:hotelSlug', hotelController.showHotelPage);

// Visiting card show page
router.get('/visiting-card/:profileSlug', visitingCardController.showByProfile);

// Portfolio show page
router.get('/portfolio/:profileSlug', portfolioController.showPortfolio);



module.exports = router;