import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}
  public async hashPassword(memberPassword: string): Promise<string> {
    // Implementation for hashing password
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(memberPassword, salt);
  }

  public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  public async createToken(member: Member): Promise<string> {
    // Implementation for creating token
    console.log('Creating token for member:', member);
    const payload: T = {};

    Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
      payload[`${ele}`] = member[`${ele}`];
    });

    delete payload.memberPassword;

    return this.jwtService.signAsync(payload);
  }

  public async verifyToken(token: string): Promise<Member> {
    const member = await this.jwtService.verifyAsync(token);
    return member;
  }
}
