import { Controller, Body, Param, Delete, Patch, Get, Post, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { buildResponse } from '../common/utils/build-response';
import { ValidateObjectIdPipe } from '../common/pipes/validate-object-id.pipe';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/role.guard';
import { Roles } from './decorators/roles.decorator';


@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles('admin')
    async findAll(@Req() req) {
        const users = await this.usersService.findAll();

        if(users.length === 0) {
            return buildResponse(true, 'No users found', []);
        }

        return buildResponse(true, 'Users retrieved successfully', users);
    }

    @Get(':id')
    async findById(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const { user } = req;

        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only access your own profile');
        }

        const foundUser = await this.usersService.findById(id);
        return buildResponse(true, 'User retrieved successfully', foundUser);
    }

    @Post()
    async createUser(@Body() dto: CreateUserDto, @Req() req) {
        const user = await this.usersService.create(dto);
        return buildResponse(true, 'User created successfully', user);
    }

    @Patch(':id')
    async updateUser(@Param('id', ValidateObjectIdPipe) id: string, @Body() dto: UpdateUserDto, @Req() req) {
        const {user} = req;
        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }

        const foundUser = await this.usersService.update(id, dto);
        return buildResponse(true, 'User updated successfully', foundUser);
    }

    @Delete(':id')
    async removeUser(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const {user} = req;
        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only delete your own profile');
        }

        const foundUser = await this.usersService.remove(id);
        return buildResponse(true, 'User deleted successfully', foundUser);
    }
}
