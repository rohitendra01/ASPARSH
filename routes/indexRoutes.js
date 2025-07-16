const express = require('express');
const router = express.Router();

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
    subtitle: 'Boost your business visibility',
    price: 799,
    description: 'A digital card designed to collect and showcase Google reviews. Perfect for businesses looking to enhance their online reputation.',
    features: ['NFC enabled', 'Customizable design', 'Instant review collection', 'Analytics dashboard', 'Easy sharing']
  }
];

    const testimonials = [
        {
            text: "Asparsh made networking at events effortless. I love how easy it is to update my info!",
            name: "Amit Sharma",
            role: "Marketing Lead, TechNova",
            avatar: "/assets/testimonial1.jpg"
        },
        {
            text: "No more paper cards! My clients are always impressed with the tap-and-go experience.",
            name: "Priya Singh",
            role: "Freelance Designer",
            avatar: "/assets/testimonial2.jpg"
        },
        {
            text: "The analytics feature helped us understand our audience better. Highly recommended.",
            name: "Rahul Verma",
            role: "Sales Manager, BizConnect",
            avatar: "/assets/testimonial3.jpg"
        },
        {
            text: "I love the convenience of sharing my details with just a tap. Asparsh is a game changer!",
            name: "Sneha Kapoor",
            role: "Event Organizer",
            avatar: "/assets/testimonial4.jpg"
        },
        {
            text: "Asparsh's NFC cards are sleek and professional. They make a great first impression!",
            name: "Vikram Mehta",
            role: "Entrepreneur",
            avatar: "/assets/testimonial5.jpg"
        },
        {
            text: "The customization options are fantastic. I can easily update my info anytime!",
            name: "Anjali Rao",
            role: "HR Manager, FutureTech",
            avatar: "/assets/testimonial6.jpg"
        },
        {
            text: "Asparsh has transformed the way I network. It's fast, efficient, and eco-friendly!",
            name: "Karan Desai",
            role: "Software Engineer",
            avatar: "/assets/testimonial7.jpg"
        }
    ];






router.get("/", (req, res) => {
    res.render("index", { products, testimonials });
});




module.exports = router;