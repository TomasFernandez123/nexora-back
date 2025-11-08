import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {

    constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

    async createPost(dto: CreatePostDto, authorId: string): Promise<Post> {
        const post = await this.postModel.create({...dto, author: authorId});

        return post;
    }

    async getAllPosts(): Promise<Post[]> {
        return await this.postModel.find();
    }

    async getPostById(id: string): Promise<Post | null> {
        const post = await this.postModel.findById(id);
        if (!post) throw new NotFoundException(`Post with ID ${id} not found`);

        return post;
    }

    async delete(id: string): Promise<Post | null> {
        const result = await this.postModel.findByIdAndDelete(id);
        if (!result) throw new NotFoundException(`Post with ID ${id} not found`);
        return result;
    }
}
