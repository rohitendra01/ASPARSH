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
  }
];

router.get("/", (req, res) => {
    res.render("index", { products });
});

module.exports = router;