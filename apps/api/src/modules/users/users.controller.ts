import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    if (user) {
      delete (user as any).passwordHash;
      return user;
    }
    return null;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(userId, updateDto);
    delete (user as any).passwordHash;
    return user;
  }
}
