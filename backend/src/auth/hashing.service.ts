import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Isolates password hashing behind a small, mockable service so AuthService
 * doesn't depend on the bcrypt API directly — kept deliberately thin, this is
 * not a general-purpose crypto abstraction.
 */
@Injectable()
export class HashingService {
  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
