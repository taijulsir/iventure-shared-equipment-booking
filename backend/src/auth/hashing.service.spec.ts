import { describe, it, expect } from 'vitest';
import { HashingService } from './hashing.service.js';

describe('HashingService', () => {
  const hashingService = new HashingService();

  it('produces a hash that is not the plaintext password', async () => {
    const hash = await hashingService.hash('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('verifies a matching password against its hash', async () => {
    const hash = await hashingService.hash('correct horse battery staple');
    await expect(
      hashingService.compare('correct horse battery staple', hash),
    ).resolves.toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await hashingService.hash('correct horse battery staple');
    await expect(hashingService.compare('wrong password', hash)).resolves.toBe(
      false,
    );
  });
});
