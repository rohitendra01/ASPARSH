// Mock cloudinary before importing the controller so the controller picks
// up the mocked uploader during require-time.
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn()
    }
  }
}));

// Mock streamifier so tests can control the returned stream (PassThrough)
// The mock returns a jest.fn that we can override per-test to return a
// controllable PassThrough instance.
jest.mock('streamifier', () => ({
  createReadStream: jest.fn()
}));

const hotelController = require('../controllers/hotelController');
const cloudinary = require('cloudinary').v2;

describe('hotelController helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('uploadBufferToCloudinary should resolve when upload_stream finishes', async () => {
    const stream = require('stream');
    const streamifier = require('streamifier');
    const buffer = Buffer.from('abc');

    // Prepare a controllable PassThrough that the mocked createReadStream will return
    const pass = new stream.PassThrough();
    streamifier.createReadStream.mockImplementation(() => pass);

    // Mock upload_stream to return a writable PassThrough; when it emits
    // 'finish' we call the callback like Cloudinary does.
    cloudinary.uploader.upload_stream.mockImplementation((opts, cb) => {
      const dest = new stream.PassThrough();
      dest.on('finish', () => cb(null, { secure_url: 'https://res.cloudinary.com/asparsh/hotels/foo.jpg', public_id: 'asparsh/hotels/foo' }));
      dest.on('error', (err) => cb(err));
      return dest;
    });

    // Call the SUT (it will call our mocked createReadStream and pipe into the mocked upload_stream)
    const promise = hotelController.uploadBufferToCloudinary(buffer);
    // Write the buffer into the PassThrough and end it to trigger piping and 'finish' on destination
    pass.end(buffer);
    const result = await promise;
    expect(result).toEqual({ secure_url: 'https://res.cloudinary.com/asparsh/hotels/foo.jpg', public_id: 'asparsh/hotels/foo' });
  });
});
