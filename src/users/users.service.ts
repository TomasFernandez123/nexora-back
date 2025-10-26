import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

    async create(dto: CreateUserDto): Promise<Record<string, any>> {
        console.log('DTO recibido:', dto);

        const emailExists = await this.userModel.findOne({ email: dto.email });
        if (emailExists) {
            throw new ConflictException(`Email ${dto.email} is already in use`);
        }

        const usernameExists = await this.userModel.findOne({ username: dto.username });
        if (usernameExists) {
            throw new ConflictException(`Username ${dto.username} is already in use`);
        }

        const birthDate = new Date(dto.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            throw new BadRequestException(`Invalid date of birth: ${dto.dateOfBirth}`);
        }

        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
        }

        const user = await this.userModel.create(dto);
        
        const { password, ...result } = user.toObject();
        return result;
    }

    async findAll(): Promise<Omit<User[], 'password'>> {
        return this.userModel.find().select('-password');
    }

    async findById(id: string): Promise<Omit<User, 'password'>> {
        const user = await this.userModel.findById(id).select('-password');
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);
        return user;
    }

    async findByEmailOrUsername(value: string): Promise<User | null> {
        return this.userModel.findOne({
            $or: [{email: value}, {username: value}],
        });
    }

    async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
        const emailExists = await this.userModel.findOne({ email: dto.email });
        if (emailExists && emailExists._id !== id) {
            throw new ConflictException(`Email ${dto.email} is already in use`);
        }

        const usernameExists = await this.userModel.findOne({ username: dto.username });
        if (usernameExists && usernameExists._id !== id) {
            throw new ConflictException(`Username ${dto.username} is already in use`);
        }

        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
        }

        const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).select('-password');
        if (!user) throw new NotFoundException(`User with ID ${id} not found`);
        return user;
    }

    async remove(id: string): Promise<User> {
        const result = await this.userModel.findByIdAndDelete(id).select('-password');
        if (!result) throw new NotFoundException(`User with ID ${id} not found`);
        return result;
    }
}
