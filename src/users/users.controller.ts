import { Controller, Body, Param, Delete, Patch, Get, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { buildResponse } from '../common/utils/build-response';
import { ValidateObjectIdPipe } from '../common/pipes/validate-object-id.pipe';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    async findAll(@Req() req) {
        const users = await this.usersService.findAll();

        if(users.length === 0) {
            return buildResponse(true, 'No users found', [], req);
        }

        return buildResponse(true, 'Users retrieved successfully', users, req);
    }

    @Get(':id')
    async findById(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const user = await this.usersService.findById(id);
        return buildResponse(true, 'User retrieved successfully', user, req);
    }

    @Post()
    async createUser(@Body() dto: CreateUserDto, @Req() req) {
        const user = await this.usersService.create(dto);
        return buildResponse(true, 'User created successfully', user, req);
    }

    @Patch(':id')
    async updateUser(@Param('id', ValidateObjectIdPipe) id: string, @Body() dto: UpdateUserDto, @Req() req) {
        const user = await this.usersService.update(id, dto);
        return buildResponse(true, 'User updated successfully', user, req);
    }

    @Delete(':id')
    async removeUser(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const user = await this.usersService.remove(id);
        return buildResponse(true, 'User deleted successfully', user, req);
    }
}
