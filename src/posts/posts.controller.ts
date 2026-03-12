import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
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
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PerspectiveService } from 'src/common/services/perspective/perspective.service';
import type { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService, private readonly perspectiveService: PerspectiveService) {}

    @Get()
    async getAllPosts(@Query() query: QueryPostsDto) {
        return this.postsService.getAllPosts(query);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('following')
    async getFollowingPosts(@Req() req: AuthenticatedRequest, @Query() query: QueryPostsDto) {
        return this.postsService.getFollowingPosts(req.user.id, query);
    }

    @Get(':id')
    async getPostById(@Param('id', ValidateObjectIdPipe) id: string, @Query('commentLimit', ParseIntPipe) commentLimit?: number, @Query('commentOffset', ParseIntPipe) commentOffset?: number) {
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
        const analysis = await this.perspectiveService.analyzeText(dto.message + ' ' + dto.title);

        if (analysis.toxicity > 0.75 || analysis.insult > 0.7) {
            throw new BadRequestException(
                'Your post seems harmful. Please rephrase it.'
            );
        }

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

        const analysis = await this.perspectiveService.analyzeText(dto.text);

        if (analysis.toxicity > 0.75 || analysis.insult > 0.7) {
            throw new BadRequestException(
                'Your comment seems harmful. Please rephrase it.'
            );
        }

        const post = await this.postsService.addComment(id, userId, dto);
        return buildResponse('Comment added successfully', post);
    }


    @UseGuards(AuthGuard('jwt'))
    @Patch(':postId/comments/:commentId')
    async updateComment(@Param('postId', ValidateObjectIdPipe) postId: string, @Param('commentId', ValidateObjectIdPipe) commentId: string, @Body() dto: UpdateCommentDto, @Req() req) {
        const userId = req.user.id;
        const analysis = await this.perspectiveService.analyzeText(dto.text);

        if (analysis.toxicity > 0.75 || analysis.insult > 0.7) {
            throw new BadRequestException(
                'Your comment seems harmful. Please rephrase it.'
            );
        }
        
        const post = await this.postsService.updateComment(postId, commentId, userId, dto);
        return buildResponse('Comment updated successfully', post);
    }

}
