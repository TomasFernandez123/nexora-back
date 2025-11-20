import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-object-id.pipe';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerPostConfig } from '../config/multer.config';
import { RolesGuard } from '../users/guards/role.guard';
import { AuthGuard } from '@nestjs/passport';
import { QueryPostsDto } from './dto/query-post.dto';
import { buildResponse } from '../common/utils/build-response';
import { CreateCommentDto } from './dto/create-comment';
import { FileSizeFilter } from '../common/utils/file-size.filters';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    async getAllPosts(@Query() query: QueryPostsDto) {
        return this.postsService.getAllPosts(query);
    }

    @Get(':id')
    async getPostById(@Param('id', ValidateObjectIdPipe) id: string, @Query('commentLimit') commentLimit?: number, @Query('commentOffset') commentOffset?: number) {
        return this.postsService.getPostById(id, commentLimit, commentOffset);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Post()
    @UseFilters(FileSizeFilter)
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: multerPostConfig.storage,
            limits: { fileSize: 20 * 1024 * 1024 },
        }),
    )
    async createPost(@Body() dto: CreatePostDto, @UploadedFile() file: Express.Multer.File, @Req() req) {
        const imageUrl = file?.path;
        const userId = req.user?.id;
        const isVideo = file?.mimetype?.startsWith('video/');
        const result = await this.postsService.createPost({...dto, photo: imageUrl, mediaType: isVideo ? 'video' : 'image',}, userId);
        return buildResponse('Post created successfully', result);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Delete(':id')
    async deletePost(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const { user } = req;

        const post = await this.postsService.getPostById(id);

        if (user.role !== 'admin' && user.id.toString() !== post?.author._id.toString()) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        const result = await this.postsService.delete(id);
        return buildResponse('Post deleted successfully', result);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/like')
    async likePost(@Param('id', ValidateObjectIdPipe) id: string, @Req() req) {
        const userId = req.user.id;
        const post = await this.postsService.likePost(id, userId);
        return buildResponse('Post like status updated', post);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/comments')
    async addComment(@Param('id', ValidateObjectIdPipe) id: string, @Body() dto: CreateCommentDto, @Req() req) {
        const userId = req.user.id;
        const post = await this.postsService.addComment(id, userId, dto);
        return buildResponse('Comment added successfully', post);
    }

}
