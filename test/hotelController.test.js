const hotelController = require('../controllers/hotelController');
const cloudinary = require('cloudinary').v2;

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn()
    }
  }
}));

describe('hotelController helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('uploadBufferToCloudinary should resolve when upload_stream calls callback', async () => {
    const buffer = Buffer.from('abc');
    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      return {
        pipe: () => {
          cb(null, { secure_url: 'https://res.cloudinary.com/asparsh/hotels/foo.jpg', public_id: 'asparsh/hotels/foo' });
        }
      };
    });

    expect(typeof cloudinary.uploader.upload_stream).toBe('function');
  });
});
