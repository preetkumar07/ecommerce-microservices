// user-service/tests/unit/auth.service.test.js
const AuthService = require('../../src/services/auth.service');
const UserRepository = require('../../src/repositories/user.repository');

// Database ko mock (fake) karna
jest.mock('../../src/repositories/user.repository');

describe('Auth Service - Register', () => {
  it('should throw error if email already exists', async () => {
    // Fake database ko bol rahe hain ke "haan ye email pehle se hai"
    UserRepository.findByEmail.mockResolvedValue({ email: 'test@test.com' });

    // Expect kar rahe hain ke hamara Service error throw karega
    await expect(AuthService.register({ email: 'test@test.com', password: 'password123' }))
      .rejects
      .toThrow('Email already registered'); // AppError message
  });
});