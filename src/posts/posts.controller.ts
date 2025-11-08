import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-object-id.pipe';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerPostConfig } from 'src/config/multer.config';
import { RolesGuard } from 'src/users/guards/role.guard';
import { AuthGuard } from '@nestjs/passport';
import { QueryPostsDto } from './dto/query-post.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    async getAllPosts(@Query() query: QueryPostsDto) {
        return this.postsService.getAllPosts(query);
    }

    @Get(':id')
    async getPostById(@Param('id', ValidateObjectIdPipe) id: string) {
        return this.postsService.getPostById(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post()
    @UseInterceptors(FileInterceptor('photo', multerPostConfig))
    async createPost(@Body() dto: CreatePostDto, @UploadedFile() file: Express.Multer.File, @Req() req) {
        const imageUrl = file?.path;
        const userId = req.user?.id;
        return this.postsService.createPost({...dto, photo: imageUrl}, userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    async deletePost(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const { user } = req;

        const post = await this.postsService.getPostById(id);

        if (user.role !== 'admin' && user.id !== post?.author.toString()) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        return this.postsService.delete(id);
    }

}
