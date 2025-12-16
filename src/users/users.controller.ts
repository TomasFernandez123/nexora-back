import { Controller, Body, Param, Delete, Patch, Get, Post, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { buildResponse } from '../common/utils/build-response';
import { ValidateObjectIdPipe } from '../common/pipes/validate-object-id.pipe';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './guards/role.guard';
import { Roles } from './decorators/roles.decorator';
import { PerspectiveService } from 'src/common/services/perspective/perspective.service';


@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService, private readonly perspectiveService: PerspectiveService) {}

    @Get()
    @Roles('admin')
    async findAll(@Req() req) {
        const users = await this.usersService.findAll();

        if(users.length === 0) {
            return buildResponse('No users found', []);
        }

        return buildResponse('Users retrieved successfully', users);
    }

    @Get(':id')
    async findById(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const { user } = req;

        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only access your own profile');
        }

        const foundUser = await this.usersService.findById(id);
        return buildResponse('User retrieved successfully', foundUser);
    }

    @Post()
    async createUser(@Body() dto: CreateUserDto, @Req() req) {
        const analysis = await this.perspectiveService.analyzeText(dto.name + ' ' + dto.lastName + ' ' + dto.description);
        
        if (analysis.toxicity > 0.75 || analysis.insult > 0.7) {
            throw new BadRequestException(
                'Your user seems harmful. Please rephrase it.'
            );
        }

        const user = await this.usersService.create(dto);
        return buildResponse('User created successfully', user);
    }

    @Patch(':id')
    async updateUser(@Param('id', ValidateObjectIdPipe) id: string, @Body() dto: UpdateUserDto, @Req() req) {
        const {user} = req;
        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }

        const foundUser = await this.usersService.update(id, dto);
        return buildResponse('User updated successfully', foundUser);
    }

    @Delete(':id')
    async removeUser(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const {user} = req;
        if (user.role !== 'admin' && user.id !== id) {
            throw new ForbiddenException('You can only delete your own profile');
        }

        const foundUser = await this.usersService.remove(id);
        return buildResponse('User deleted successfully', foundUser);
    }
}
