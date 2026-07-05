import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
  public async hashPassword(memberPassword: string): Promise<string> {
    // Implementation for hashing password
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(memberPassword, salt);
  }

  public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
