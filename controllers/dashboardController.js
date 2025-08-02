// Delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOneAndDelete({ hotelSlug: req.params.hotelSlug });
    if (!hotel) {
      return res.status(404).send('Hotel not found');
    }
    res.redirect(`/dashboard/${req.params.slug}/hotels/index`);
  } catch (err) {
    console.error('Error deleting hotel:', err);
    res.status(500).send('Server error');
  }
};
// Render edit hotel form
exports.renderEditHotelForm = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) {
      return res.status(404).render('hotels/edit', {
        hotel: null,
        error: 'Hotel not found',
        layout: 'layouts/dashboard-boilerplate',
        currentUser: req.user
      });
    }
    res.render('hotels/edit', { hotel, currentUser: req.user });
  } catch (err) {
    console.error('DEBUG: Error in renderEditHotelForm:', err);
    res.status(500).send('Server error');
  }
};

// Update hotel
exports.updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
    if (!hotel) return res.status(404).send('Hotel not found');
    // Update fields
    hotel.hotelName = req.body.hotelName;
    hotel.hotelType = req.body.hotelType;
    hotel.hotelDescription = req.body.hotelDescription;
    hotel.hotelAddress = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zipCode: req.body.zipCode
    };
    // Handle file uploads for hotelLogo and hotelOfferBanner
    const cloudinary = require('cloudinary').v2;
    // Update hotelLogo if a new file is provided
    if (req.files && req.files['hotelLogo'] && req.files['hotelLogo'][0]) {
      // Delete previous image from Cloudinary if exists
      if (hotel.hotelLogo) {
        // Extract public_id from URL
        const logoPublicId = hotel.hotelLogo.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(`hotels/${logoPublicId}`);
        } catch (err) {
          console.error('Error deleting previous hotelLogo from Cloudinary:', err);
        }
      }
      // Upload new image
      const logoFile = req.files['hotelLogo'][0];
      const logoUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'hotels' }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        });
        stream.end(logoFile.buffer);
      });
      hotel.hotelLogo = logoUrl;
    }
    // Update hotelOfferBanner if a new file is provided
    if (req.files && req.files['hotelOfferBanner'] && req.files['hotelOfferBanner'][0]) {
      if (hotel.hotelOfferBanner) {
        const bannerPublicId = hotel.hotelOfferBanner.split('/').pop().split('.')[0];
        try {
          await cloudinary.uploader.destroy(`hotels/${bannerPublicId}`);
        } catch (err) {
          console.error('Error deleting previous hotelOfferBanner from Cloudinary:', err);
        }
      }
      const bannerFile = req.files['hotelOfferBanner'][0];
      const bannerUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'hotels' }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        });
        stream.end(bannerFile.buffer);
      });
      hotel.hotelOfferBanner = bannerUrl;
    }

    // Parse foodCategories and foodItems with prices
    let foodCategories = [];
    if (req.body.foodCategories) {
      // If sent as array
      const categories = Array.isArray(req.body.foodCategories) ? req.body.foodCategories : Object.values(req.body.foodCategories);
      foodCategories = categories.map((cat, catIdx) => {
        let foodItems = [];
        if (cat.foodItems) {
          const items = Array.isArray(cat.foodItems) ? cat.foodItems : Object.values(cat.foodItems);
          foodItems = items.map(item => ({
            itemName: item.itemName,
            price: item.itemPrice !== undefined ? item.itemPrice : item.price
          })).filter(item => item.itemName && item.itemName.trim());
        }
        return {
          categoryName: cat.categoryName,
          foodItems
        };
      }).filter(cat => cat.categoryName && cat.categoryName.trim());
    }
    hotel.foodCategories = foodCategories;

    await hotel.save();
    res.redirect(`/hotel/${hotel.hotelSlug}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
// Handle hotel creation from dashboard POST route
exports.createHotelFromDashboard = async (req, res) => {
  try {
    const { hotelName, hotelDescription, hotelType, street, city, state, country, zipCode } = req.body;
    // Generate hotelSlug from hotelName
    const hotelSlug = hotelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50);
    const createdBy = req.user._id;
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    // Upload images to Cloudinary
    const logoFile = req.files['hotelLogo'] ? req.files['hotelLogo'][0] : null;
    const bannerFile = req.files['hotelOfferBanner'] ? req.files['hotelOfferBanner'][0] : null;
    let hotelLogoUrl = '';
    let hotelOfferBannerUrl = '';
    async function uploadToCloudinary(file, folderName) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: folderName }, (error, result) => {
          if (error) return reject(error);
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
      const categories = Array.isArray(req.body.foodCategories) ? req.body.foodCategories : [req.body.foodCategories];
      foodCategories = categories
        .filter(cat => cat.categoryName && cat.categoryName.trim())
        .map(cat => ({
          ...cat,
          foodItems: (cat.foodItems || []).filter(item => item.itemName && item.itemName.trim())
        }));
    }
    // Check required fields
    if (!hotelName || !hotelDescription || !hotelType || !hotelLogoUrl || !hotelOfferBannerUrl || !street || !city || !state || !country || !zipCode || !createdBy) {
      return res.status(400).send('Missing required hotel fields');
    }
    const Hotel = require('../models/Hotel');
    const hotel = new Hotel({
      hotelSlug,
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
};
// Handle form submission to create a new business visiting card (with image upload and correct redirect)
exports.createBusinessVisitingCard = async (req, res) => {
  console.log('POST /dashboard/:slug/buisness/visiting-card/new called', req.body);
  try {
    const { name, title, description, email, phone, address, website, linkedin, twitter, facebook, instagram } = req.body;
    let imageUrl = '';
    if (req.file) {
      // Upload image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'asparsh/visiting-cards',
          resource_type: 'image',
          public_id: `visiting_card_${Date.now()}`,
          overwrite: true
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      imageUrl = result.secure_url;
    }
    const visitingCard = new VisitingCard({
      user: req.user._id,
      name,
      title,
      description,
      email,
      phone,
      address,
      website,
      linkedin,
      twitter,
      facebook,
      instagram,
      image: imageUrl
    });
    await visitingCard.save();
    // Redirect to the created card view page (adjust as needed)
    res.redirect(`/dashboard/${req.user.slug}/portfolio`);
  } catch (err) {
    console.error(err);
    res.status(500).render('portfolios/business/new', { error: 'Error creating visiting card', layout: 'layouts/dashboard-boilerplate', currentUser: req.user });
  }
};
// Dashboard hotels index page
exports.dashboardHotelsIndex = async (req, res) => {
  try {
    const hotels = await Hotel.find({});
    let user = req.user;
    // If slug is in params, try to get user by slug
    if (req.params.slug && (!user || !user.slug || req.params.slug !== user.slug)) {
      const UserModel = require('../models/User');
      user = await UserModel.findOne({ slug: req.params.slug }) || user;
    }
    res.render('hotels/index', {
      hotels,
      user,
      layout: 'layouts/dashboard-boilerplate'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('hotels/index', {
      error: 'Error loading hotels',
      hotels: [],
      layout: 'layouts/dashboard-boilerplate'
    });
  }
};
// Dashboard home page
exports.dashboardHome = (req, res) => {
  res.render('dashboard', { layout: 'layouts/dashboard-boilerplate' });
};

// Dashboard user profile page
exports.dashboardUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('User not found');
  res.render('users/view', { user, layout: 'layouts/dashboard-boilerplate' });
};
// dashboardController.js
const path = require('path');

const Hotel = require('../models/Hotel');
const VisitingCard = require('../models/VisitingCard');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const streamifier = require('streamifier');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

exports.showHotelPage = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ hotelSlug: req.params.hotelSlug });
        if (!hotel) return res.status(404).send('Hotel not found');
        res.render('hotels/show', {
            hotelId: hotel.hotelId,
            hotelName: hotel.hotelName,
            hotelDescription: hotel.hotelDescription,
            hotelLogo: hotel.hotelLogo,
            hotelOfferBanner: hotel.hotelOfferBanner,
            hotelType: hotel.hotelType,
            foodCategories: hotel.foodCategories || [],
            hotelAddress: hotel.hotelAddress,
            createdByUsername: hotel.createdByUsername
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading hotel show page');
    }
};

// Render form to create a new visiting card
exports.renderNewVisitingCardForm = (req, res) => {
  res.render('portfolios/business/new', { layout: 'layouts/dashboard-boilerplate', currentUser: req.user });
};

// Handle form submission to create a new visiting card
exports.createVisitingCard = async (req, res) => {
  try {
    const { name, title, description, email, phone, address, website, linkedin, twitter, facebook, instagram } = req.body;
    const visitingCard = new VisitingCard({
      user: req.user._id,
      name,
      title,
      description,
      email,
      phone,
      address,
      website,
      linkedin,
      twitter,
      facebook,
      instagram
    });
    await visitingCard.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).render('portfolios/business/new', { error: 'Error creating visiting card', layout: 'layouts/dashboard-boilerplate' });
  }
};

// Fetch and show visiting card by user ID
exports.showVisitingCard = async (req, res) => {
  try {
    const visitingCard = await VisitingCard.findById(req.params.cardId);
    if (!visitingCard) return res.status(404).send('Visiting card not found');
    res.render('portfolios/business/visiting-card', { card: visitingCard });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading visiting card');
  }
};

// Dashboard business portfolio index page
exports.dashboardPortfolioIndex = async (req, res) => {
  try {
    const cards = await VisitingCard.find({});
    res.render('portfolios/business/index', { cards, layout: 'layouts/dashboard-boilerplate' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading business visiting cards');
  }
};

exports.getEditUserProfile = async (req, res) => {
  let user;
  if (req.params.slug) {
    user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
  } else {
    user = req.user;
  }
  if (!user) return res.status(404).send('User not found');
  res.render('users/edit', { user, layout: 'layouts/dashboard-boilerplate' });
};

exports.updateUserProfile = async (req, res) => {
  try {
    let user;
    if (req.params.slug) {
      user = await User.findOne({ slug: req.params.slug }) || await User.findById(req.params.slug);
    } else {
      user = req.user;
    }
    if (!user) return res.status(404).send('User not found');
    user.username = req.body.username;
    user.email = req.body.email;
    if (req.file) {
      // Upload image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: 'asparsh/users',
          resource_type: 'image',
          public_id: `user_${user._id}`,
          overwrite: true
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
        require('streamifier').createReadStream(req.file.buffer).pipe(stream);
      });
      user.image = result.secure_url;
    }
    await user.save();
    req.flash('success_msg', 'Profile updated successfully!');
    return res.redirect(`/dashboard/${user.slug}/user/view/${user.slug}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('back');
  }
};
