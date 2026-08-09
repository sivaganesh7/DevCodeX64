import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.passwordHash as string)) {
      delete (user as any).passwordHash;
      return user;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltOrRounds);

    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
    } as any);

    delete (user as any).passwordHash;
    return user;
  }

  generateToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
