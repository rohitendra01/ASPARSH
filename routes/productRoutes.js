const express = require('express');
const router = express.Router();

const foodCategories = [
  {
    name: 'Breakfast',
    image: '/assets/breakfast.jpg',
    items: [
      { name: 'Paratha', price: 100 },
      { name: 'Idli', price: 80 },
      { name: 'Dosa', price: 90 },
      { name: 'Poha', price: 70 },
      { name: 'Upma', price: 60 },
      { name: 'Aloo Puri', price: 75 },
      { name: 'Chole Bhature', price: 120 },
      { name: 'Pav Bhaji', price: 100 },
      { name: 'Masala Dosa', price: 110 },
      { name: 'Egg Bhurji', price: 90 },
      { name: 'French Toast', price: 80 },
      { name: 'Oats Porridge', price: 70 },
      { name: 'Smoothie Bowl', price: 150 },
      { name: 'Fruit Salad', price: 60 },
      { name: 'Yogurt Parfait', price: 80 },
      { name: 'Cheese Omelette', price: 100 },
      { name: 'Veg Sandwich', price: 70 },
      { name: 'Paneer Tikka', price: 120 },
      { name: 'Samosa', price: 30 },
      { name: 'Spring Roll', price: 40 }
    ]
  },
  {
    name: 'Main Course',
    image: '/assets/lunch.jpg',
    items: [
      { name: 'Paneer Butter Masala', price: 200 },
      { name: 'Dal Makhani', price: 150 },
      { name: 'Biryani', price: 250 },
      { name: 'Roti', price: 30 },
      { name: 'Salad', price: 50 },
      { name: 'Veg Pulao', price: 180 },
      { name: 'Chole Masala', price: 160 },
      { name: 'Aloo Gobi', price: 140 },
      { name: 'Palak Paneer', price: 220 },
      { name: 'Mixed Vegetable Curry', price: 170 },
      { name: 'Rajma', price: 150 },
      { name: 'Baingan Bharta', price: 180 },
      { name: 'Methi Thepla', price: 90 },
      { name: 'Puri Sabzi', price: 100 },
      { name: 'Khichdi', price: 120 },
      { name: 'Paneer Tikka Masala', price: 240 }
    ]
  },
  {
    name: 'Non Veg Main Course',
    image: '/assets/nonveg.jpg',
    items: [
      { name: 'Chicken Biryani', price: 300 },
      { name: 'Mutton Rogan Josh', price: 350 },
      { name: 'Fish Curry', price: 280 },
      { name: 'Butter Chicken', price: 320 },
      { name: 'Egg Curry', price: 240 },
      { name: 'Mutton Korma', price: 360 },
      { name: 'Chicken Tikka Masala', price: 280 },
      { name: 'Prawn Masala', price: 400 },
      { name: 'Fish Fry', price: 250 },
      { name: 'Chicken Vindaloo', price: 330 },
      { name: 'Mutton Biryani', price: 380 },
      { name: 'Tandoori Chicken', price: 300 },
      { name: 'Chicken Korma', price: 320 },
      { name: 'Fish Tikka', price: 270 },
      { name: 'Egg Bhurji', price: 200 }
    ]
  },
  {
    name: 'Chinese Combos',
    image: '/assets/chinese.jpg',
    items: [
      { name: 'Fried Rice', price: 180 },
      { name: 'Chow Mein', price: 150 },
      { name: 'Spring Rolls', price: 120 },
      { name: 'Manchurian', price: 200 },
      { name: 'Dumplings', price: 160 },
      { name: 'Hot and Sour Soup', price: 100 },
      { name: 'Chili Chicken', price: 220 },
      { name: 'Paneer Chilli', price: 180 },
      { name: 'Szechuan Noodles', price: 190 },
      { name: 'Vegetable Hakka Noodles', price: 170 },
      { name: 'Kung Pao Chicken', price: 240 },
      { name: 'Sweet and Sour Vegetables', price: 160 },
      { name: 'Egg Fried Rice', price: 150 },
      { name: 'Garlic Noodles', price: 140 }
    ]
  },
  {
    name: 'Dinner',
    image: '/assets/dinner.jpg',
    items: [
      { name: 'Butter Chicken', price: 280 },
      { name: 'Naan', price: 40 },
      { name: 'Fried Rice', price: 180 },
      { name: 'Mutton Curry', price: 320 },
      { name: 'Raita', price: 60 },
      { name: 'Jeera Rice', price: 80 },
      { name: 'Paneer Tikka', price: 200 }, 
      { name: 'Dal Tadka', price: 150 },
      { name: 'Veg Biryani', price: 220 },
      { name: 'Chicken Curry', price: 300 },
      { name: 'Fish Curry', price: 250 },
      { name: 'Mixed Veg Curry', price: 180 },
      { name: 'Aloo Paratha', price: 100 },
      { name: 'Chapati', price: 30 },
      { name: 'Palak Paneer', price: 240 }
    ]
  },
  {
    name: 'Beverages',
    image: '/assets/beverage.jpg',
    items: [
      { name: 'Masala Chai', price: 25 },
      { name: 'Fresh Lime Soda', price: 35 },
      { name: 'Lassi', price: 45 },
      { name: 'Coffee', price: 30 },
      { name: 'Fresh Juice', price: 55 },
      { name: 'Iced Tea', price: 40 },
      { name: 'Cold Coffee', price: 50 },
      { name: 'Green Tea', price: 30 },
      { name: 'Buttermilk', price: 20 },
      { name: 'Smoothie', price: 60 },
      { name: 'Coconut Water', price: 35 },
      { name: 'Soda', price: 20 },
      { name: 'Mineral Water', price: 15 },
      { name: 'Herbal Tea', price: 30 },
      { name: 'Turmeric Latte', price: 50 }
    ]
  },
  {
    name: 'Desserts',
    image: '/assets/desserts.jpg',
    items: [
      { name: 'Gulab Jamun', price: 50 },
      { name: 'Jalebi', price: 40 },
      { name: 'Rasgulla', price: 60 },
      { name: 'Kheer', price: 70 },
      { name: 'Ice Cream', price: 80 },
      { name: 'Brownie', price: 90 },
      { name: 'Fruit Custard', price: 70 },
      { name: 'Chocolate Mousse', price: 100 },
      { name: 'Peda', price: 50 },
      { name: 'Barfi', price: 60 },
      { name: 'Ladoo', price: 40 },
      { name: 'Cheesecake', price: 120 },
      { name: 'Tiramisu', price: 150 },
      { name: 'Pineapple Upside Down Cake', price: 130 },
      { name: 'Apple Pie', price: 110 }
    ]
  },
  {
    name: 'Kathi Roll',
    image: '/assets/kathi_roll.jpg',
    items: [
      { name: 'Paneer Kathi Roll', price: 120 },
      { name: 'Chicken Kathi Roll', price: 150 },
      { name: 'Mutton Kathi Roll', price: 180 },
      { name: 'Veg Kathi Roll', price: 100 }
    ]
  }
];

// Show hotel details page
router.get('/hotels/:id', async (req, res) => {
  try {
    // Fetch hotel by id from DB (replace with your model logic)
    // const hotel = await Hotel.findById(req.params.id);
    // if (!hotel) throw new Error('Hotel not found');
    res.render('hotels/show', { categories: foodCategories }); // Correct: views/hotels/show.ejs
  } catch (err) {
    res.status(500).send('Error loading hotel page: ' + err.message);
  }
});

router.get('/hotels/show', (req, res) => {
  res.render('hotels/show', { categories: foodCategories });
});

router.get("/", (req, res) => {
    res.render("products/index");
});

module.exports = router;