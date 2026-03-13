/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private readonly relationProjection =
    'name lastName username photo description isActive';

  private getPagination(page: number, limit: number) {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than or equal to 1');
    }

    if (limit < 1 || limit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  async create(dto: CreateUserDto): Promise<Record<string, unknown>> {
    const emailExists = await this.userModel.findOne({ email: dto.email });
    const usernameExists = await this.userModel.findOne({
      username: dto.username,
    });

    if (emailExists && usernameExists) {
      throw new ConflictException(
        `Email ${dto.email} and Username ${dto.username} are already in use`,
      );
    }

    if (emailExists) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }

    if (usernameExists) {
      throw new ConflictException(`Username ${dto.username} is already in use`);
    }

    if (dto.dateOfBirth) {
      const birthDate = new Date(dto.dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        throw new BadRequestException(
          `Invalid date of birth: ${dto.dateOfBirth}`,
        );
      }
    }

    if (dto.password) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userModel.create(dto);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.toObject();
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password');
  }

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmailOrUsername(value: string): Promise<User | null> {
    return this.userModel.findOne({
      $or: [{ email: value }, { username: value }],
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const emailExists = await this.userModel.findOne({ email: dto.email });
    if (emailExists && emailExists._id !== id) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }

    const usernameExists = await this.userModel.findOne({
      username: dto.username,
    });
    if (usernameExists && usernameExists._id !== id) {
      throw new ConflictException(`Username ${dto.username} is already in use`);
    }

    if (dto.password) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async remove(id: string): Promise<User> {
    // TODO: Si es true que cambie a false y si es false que cambie a true
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const result = await this.userModel
      .findByIdAndUpdate(id, { isActive: !user.isActive }, { new: true })
      .select('-password');

    return result!;
  }

  async follow(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser)
      throw new NotFoundException(`User with ID ${targetUserId} not found`);

    const currentUser = await this.userModel.findById(currentUserId);
    if (!currentUser)
      throw new NotFoundException(`User with ID ${currentUserId} not found`);

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId,
    );

    if (alreadyFollowing) {
      throw new ConflictException('You are already following this user');
    }

    await this.userModel.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUserId },
    });

    await this.userModel.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: currentUserId },
    });
  }

  async unfollow(currentUserId: string, targetUserId: string): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const targetUser = await this.userModel.findById(targetUserId);
    if (!targetUser)
      throw new NotFoundException(`User with ID ${targetUserId} not found`);

    const currentUser = await this.userModel.findById(currentUserId);
    if (!currentUser)
      throw new NotFoundException(`User with ID ${currentUserId} not found`);

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId,
    );

    if (!isFollowing) {
      throw new BadRequestException('You are not following this user');
    }

    await this.userModel.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId },
    });

    await this.userModel.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId },
    });
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('followers', '-password');
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user.followers as unknown as User[];
  }

  async getFollowing(userId: string): Promise<User[]> {
    const user = await this.userModel
      .findById(userId)
      .populate('following', '-password');
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user.following as unknown as User[];
  }

  async getSuggestions(userId: string): Promise<User[]> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const followingIds = user.following.map((id) => id.toString());

    return this.userModel
      .find({
        _id: { $nin: [userId, ...followingIds] },
      })
      .select('-password');
  }

  async findOrCreateByProvider(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // Check if user already exists with this provider and providerId
    let user = await this.userModel.findOne({
      provider: profile.provider,
      providerId: profile.providerId,
    });

    if (user) return user;

    // Check if a user with the same email already exists
    user = await this.userModel.findOne({ email: profile.email });

    if (user) {
      // Link the provider to the existing account
      user.provider = profile.provider;
      user.providerId = profile.providerId;
      await user.save();
      return user;
    }

    // Create a new user with a generated username
    const baseUsername = profile.email.split('@')[0];
    let username = baseUsername;
    let counter = 0;
    while (await this.userModel.findOne({ username })) {
      counter++;
      username = `${baseUsername}${counter}`;
    }

    const newUser = await this.userModel.create({
      name: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      username,
      photo: profile.picture ?? 'https://res.cloudinary.com/dlmkbhszg/image/upload/v1/nexora/defaults/default-avatar.png',
      provider: profile.provider,
      providerId: profile.providerId,
    });

    return newUser;
  }

  async setPasswordIfMissing(userId: string, plainPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    if (user.password) {
      throw new BadRequestException(
        'Password already configured for this account',
      );
    }

    user.password = await bcrypt.hash(plainPassword, 10);
    await user.save();
  }

  async getMyFollowers(userId: string, page = 1, limit = 20) {
    const pagination = this.getPagination(page, limit);

    const [items, total] = await Promise.all([
      this.userModel
        .find({ following: userId })
        .select(this.relationProjection)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments({ following: userId }),
    ]);

    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getMyFollowing(userId: string, page = 1, limit = 20) {
    const pagination = this.getPagination(page, limit);

    const [items, total] = await Promise.all([
      this.userModel
        .find({ followers: userId })
        .select(this.relationProjection)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments({ followers: userId }),
    ]);

    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
