process.env.NODE_ENV = 'test';
const request = require('supertest');
const express = require('express');

// Mock csurf to be a no-op middleware factory that also sets req.csrfToken
jest.mock('csurf', () => {
  return jest.fn(() => (req, res, next) => {
    req.csrfToken = () => 'test-csrf-token';
    next();
  });
});

// We'll mount the real app but mock out any external dependencies like cloudinary and mongoose models.
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((opts, cb) => ({ pipe: () => cb(null, { secure_url: 'http://cloud/fake.jpg', public_id: 'asparsh/hotels/fake' }) }))
    }
  }
}));

// Mock mailer to prevent nodemailer verify/connection during tests
jest.mock('../mailer', () => ({ verify: jest.fn(), sendMail: jest.fn() }));

// Mock authentication middleware to always allow and provide other helpers used by app
jest.mock('../middleware/authMiddleware', () => ({
  isLoggedIn: (req, res, next) => next(),
  storeReturnTo: (req, res, next) => next(),
  enforceSingleSession: (req, res, next) => next(),
  isGuest: (req, res, next) => next()
}));

// Mock Hotel model used by controller to avoid real DB
const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockDeleteOne = jest.fn();

jest.mock('../models/Hotel', () => {
  return function Hotel(data) {
    this.save = mockSave.mockImplementation(async () => ({ ...data, _id: 'fakeid' }));
    Object.assign(this, data);
  };
});

// Also mock static methods
const Hotel = require('../models/Hotel');
Hotel.findOne = mockFindOne;
Hotel.find = mockFind;
Hotel.deleteOne = mockDeleteOne;

describe('hotel routes (integration-like, mocked)', () => {
  let app;
  beforeAll(() => {
    app = require('../app');
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('GET /dashboard should render (protected but mocked auth allows)', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.statusCode).toBe(200);
  });

  test('POST /dashboard/testslug/hotels/new should create a hotel (mocked upload & model)', async () => {
    // Mock body fields. Use form-data style (multipart) as multer expects files
    mockFindOne.mockResolvedValue(null);
    mockSave.mockResolvedValue({ hotelSlug: 'my-hotel' });

    const res = await request(app)
      .post('/dashboard/testslug/hotels/new')
      .field('hotelName', 'My Hotel')
      .field('hotelDescription', 'desc')
      .field('hotelType', 'type')
      .field('street', 'S')
      .field('city', 'C')
      .field('zipCode', '000')
      .field('selectedProfileId', 'pid')
      .field('selectedProfileSlug', 'pslug')
      .field('selectedProfileName', 'pname')
      .attach('hotelLogo', Buffer.from('abc'), 'logo.png');

    // We expect redirect after success
    expect([200, 302]).toContain(res.statusCode);
  }, 10000);
});
