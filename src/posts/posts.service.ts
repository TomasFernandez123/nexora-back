import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-post.dto';
import { UsersService } from 'src/users/users.service';
import { CreateCommentDto } from './dto/create-comment';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<Post>) {}

    async createPost(dto: CreatePostDto, authorId: string): Promise<Post> {
        const post = await this.postModel.create({...dto, author: authorId});

        return post.populate('author', 'username photo');
    }

    async getAllPosts(query: QueryPostsDto) {
        const filters: any = { deleted: false };

        if (query.userId) {
            filters.author = query.userId;
        }

        const sort: Record<string, SortOrder> =
            query.sort === 'likes'
            ? { likeCount: -1 }
            : { createdAt: -1 };

        const limit = Number(query.limit) || 10;
        const offset = Number(query.offset) || 0;

        const total = await this.postModel.countDocuments(filters);

        const posts = await this.postModel
            .find(filters)
            .populate('author', 'username photo')
            .sort(sort)
            .skip(offset)
            .limit(limit);

        return { total, limit, offset, posts };
    }

    async getPostById(id: string): Promise<Post | null> {
        const post = await this.postModel.findById(id);
        if (!post) throw new NotFoundException(`Post with ID ${id} not found`);

        return post.populate('author', 'username photo');
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
        };

        post.comments.push(newComment);
        await post.save();

        return post.populate('author', 'username photo');
    }


}
