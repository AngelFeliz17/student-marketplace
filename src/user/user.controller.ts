import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { User } from 'generated/prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { RoleDto, UpdateUserDto } from './dto/user.dto';
import { AdminGuard } from './guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @Patch('me')
    update(@GetUser() user: User, @Body() dto: UpdateUserDto) {
        return this.userService.update(user, dto);
    }

    @Delete('me')
    delete(@GetUser() user: User) {
        return this.userService.delete(user);
    }

    @UseGuards(AdminGuard)
    @Get()
    findAll() {
        return this.userService.findAll()
    }

    @UseGuards(AdminGuard)
    @Get(':id')
    find(@Param('id') id: string) {
        return this.userService.find(id);
    }

    @UseGuards(AdminGuard)
    @Patch(':id/role')
    updateRole(@Param('id') id: string, @Body() dto: RoleDto) {
        return this.userService.updateRole(id, dto);
    }

    @UseGuards(AdminGuard)
    @Delete(':id')
    deleteUser(@Param('id') id: string) {
        return this.userService.deleteUser(id);
    }

    @Patch(':id/restore')
    restore(@Param('id') id: string) {
        return this.userService.restore(id);
    }
}
