const express = require('express');
const router = express.Router();

// Show hotel details page
router.get('/hotels/:id', async (req, res) => {
  try {
    // Fetch hotel by id from DB (replace with your model logic)
    // const hotel = await Hotel.findById(req.params.id);
    // if (!hotel) throw new Error('Hotel not found');
    res.render('hotels/show'); // Placeholder, add hotel data as needed
  } catch (err) {
    res.status(500).send('Error loading hotel page: ' + err.message);
  }
});

router.get('hotels/show', (req, res) => {
  res.render('hotels/show');
});

router.get("/", (req, res) => {
    res.render("products/index");
});

module.exports = router;