import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { PerspectiveService } from 'src/common/services/perspective/perspective.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ])
  ],
  controllers: [PostsController],
  providers: [PostsService, PerspectiveService]
})
export class PostsModule {}
