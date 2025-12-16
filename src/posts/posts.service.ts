import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, SortOrder } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-post.dto';
import { CreateCommentDto } from './dto/create-comment';
import { User } from 'src/users/schemas/user.schema';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) {}

    async createPost(dto: CreatePostDto, authorId: string): Promise<Post> {
        const post = await this.postModel.create({...dto, author: authorId});

        return post.populate([
            { path: 'author', select: 'username photo' },
            { path: 'comments.author', select: 'username photo' }
        ]);
    }

    async getAllPosts(query: QueryPostsDto) {
        const filters: any = {};

        if (!query.showDeleted) {
            filters.deleted = false;
        }

        if (query.userId) {
            filters.author = query.userId;
        }

        if (query.userName) {
            const users = await this.userModel.find({
                username: { $regex: query.userName, $options: 'i' },
            }).select('_id');

            const userIds = users.map((u) => (u._id as mongoose.Types.ObjectId).toString());

            if (userIds.length > 0) {
                filters.author = { $in: userIds };
            } else {
                return { total: 0, limit: Number(query.limit) || 10, offset: 0, posts: [] };
            }
        }

        const sort: Record<string, SortOrder> =
            query.sort === 'likes'
            ? { likeCount: -1 }
            : { createdAt: -1 };

        const limit = Number(query.limit) || 10;
        const offset = Number(query.offset) || 0;
        const commentLimit = Number(query.commentLimit) || 0;
        const commentOffset = Number(query.commentOffset) || 0;

        const total = await this.postModel.countDocuments(filters);

        const posts = await this.postModel
            .find(filters)
            .populate([
                { path: 'author', select: 'username photo' },
            ])
            .sort(sort)
            .skip(offset)
            .limit(limit);

        const postsWithLimitedComments = posts.map(post => {
            const postObj = post.toObject();
            const totalComments = postObj.comments.length || 0;

            const sortedComments = [...postObj.comments].sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const paginatedComments = sortedComments?.slice(commentOffset, commentOffset + commentLimit) || [];
                
            
            return {
                ...postObj,
                comments: paginatedComments,
                commentsPagination: {
                    total: totalComments,
                    limit: commentLimit,
                    offset: commentOffset,
                    hasMore: commentOffset + commentLimit < totalComments
                }
            }
        });

        await this.userModel.populate(postsWithLimitedComments, {
            path: 'comments.author',
            select: 'username photo'
        });

        return { total, limit, offset, posts: postsWithLimitedComments };
    }

    async getPostById(id: string, commentLimit = 10, commentOffset = 0) {
        const post = await this.postModel.findById(id).populate('author', 'username photo').populate('comments.author', 'username photo');
        if (!post) throw new NotFoundException(`Post with ID ${id} not found`);

        const postObj = post.toObject();
        const totalComments = postObj.comments.length || 0;

        const sortedComments = [...postObj.comments].sort(
            (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const paginatedComments = sortedComments
            ?.slice(commentOffset, commentOffset + commentLimit) || [];

        return {
            ...postObj,
            comments: paginatedComments,
            commentsPagination: {
                total: totalComments,
                limit: commentLimit,
                offset: commentOffset,
                hasMore: commentOffset + commentLimit < totalComments
            }
        };
    }

    async delete(id: string): Promise<Post | null> {
        const result = await this.postModel.findByIdAndUpdate(id, { deleted: true }, { new: true });
        if (!result) throw new NotFoundException(`Post with ID ${id} not found`);
        return result;
    }

    async likePost(postId: string, userId: string) {
        const post = await this.postModel.findOne({ _id: postId, likes: userId });

        if (post) {
            return this.postModel.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId }, $inc: { likeCount: -1 } },
            { new: true }
            ).populate('author', 'username photo');
        } else {
            return this.postModel.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
            { new: true }
            ).populate('author', 'username photo');
        }
    }

    async addComment(postId: string, userId: string, dto: CreateCommentDto) {
        const post = await this.postModel.findById(postId);
        if (!post) throw new NotFoundException('Post not found');

        const newComment = {
            author: userId as any,
            text: dto.text,
            createdAt: new Date(),
            edited: false
        };

        post.comments.push(newComment);
        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        return post.populate([
            { path: 'author', select: 'username photo' },
            { path: 'comments.author', select: 'username photo' }
        ]);
    }

    async updateComment(postId: string, commentId: string, userId: string, dto: UpdateCommentDto) {
        const post = await this.postModel.findById(postId);
        
        if (!post) throw new NotFoundException('Post not found');

        const comment: any = post.comments.find((c: any) => c._id.toString() === commentId);

        if (!comment) throw new NotFoundException('Comment not found');

        if (userId.toString() !== comment.author.toString()) {
            throw new UnauthorizedException('You can only edit your own comments');
        }

        comment.text = dto.text;
        comment.edited = true;
        await post.save();

        return post.populate([
            { path: 'author', select: 'username photo' },
            { path: 'comments.author', select: 'username photo' }
        ]);
    }


}
