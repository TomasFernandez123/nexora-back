import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema  } from './schemas/user.schema';
import { PerspectiveService } from 'src/common/services/perspective/perspective.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService, PerspectiveService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
