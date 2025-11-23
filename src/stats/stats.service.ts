import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from 'src/posts/schemas/post.schema';
import { DateRangeDto } from './dto/date-range.dto';
import { PostsPerUserDto } from './dto/post-per-user.dto';

@Injectable()
export class StatsService {
    constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

    async getPostsPerUser(postDto: PostsPerUserDto) {
        const { fromDate, toDate } = this.parseRange(postDto);
        
        const { limit } = postDto;

        const [result] = await this.postModel.aggregate([
        {
            $match: {
            createdAt: { $gte: fromDate, $lte: toDate },
            deleted: { $ne: true },
            },
        },
        {
            $group: {
            _id: '$author',              
            postCount: { $sum: 1 },
            },
        },
        { $sort: { postCount: -1 } },

        {
            $addFields: {
            authorObjectId: { $toObjectId: '$_id' },
            },
        },

        {
            $lookup: {
            from: 'users',
            localField: 'authorObjectId',  
            foreignField: '_id',
            as: 'author',
            },
        },
        { $unwind: '$author' },
        {
            $project: {
            _id: 0,
            userId: '$author._id',
            username: '$author.username', 
            name: '$author.name',
            lastName: '$author.lastName',
            postCount: 1,
            },
        },
        {
            $facet: {
            top: [{ $limit: limit }],
            others: [
                { $skip: limit },
                {
                $group: {
                    _id: null,
                    postCount: { $sum: '$postCount' },
                },
                },
            ],
            },
        },
        ]);

        const top = result?.top || [];
        const othersCount = result?.others?.[0]?.postCount || 0;

        return {
            fromDate,
            toDate,
            limit,
            top,
            others: othersCount,
        };
    }

    async getCommentsOverTime(dateRangeDto: DateRangeDto) {
        const { fromDate, toDate } = this.parseRange(dateRangeDto);

        const points = await this.postModel.aggregate([
        {
            $match: {
            deleted: { $ne: true },
            'comments.createdAt': { $gte: fromDate, $lte: toDate },
            },
        },
        { $unwind: '$comments' },
        {
            $match: {
            'comments.createdAt': { $gte: fromDate, $lte: toDate },
            },
        },
        {
            $group: {
            _id: {
                $dateToString: {
                format: '%Y-%m-%d',
                date: '$comments.createdAt',
                },
            },
            commentCount: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
            _id: 0,
            date: '$_id',
            commentCount: 1,
            },
        },
        ]);

        return {
            fromDate,
            toDate,
            points,
        };
    }

    async getCommentsPerPost(postDto: PostsPerUserDto) {
        const { fromDate, toDate } = this.parseRange(postDto);
        
        const { limit } = postDto;

        const [result] = await this.postModel.aggregate([
        {
            $match: {
            deleted: { $ne: true },
            'comments.createdAt': { $gte: fromDate, $lte: toDate },
            },
        },
        { $unwind: '$comments' },
        {
            $match: {
            'comments.createdAt': { $gte: fromDate, $lte: toDate },
            },
        },
        {
            $group: {
            _id: {
                postId: '$_id',
                title: '$title',
            },
            commentCount: { $sum: 1 },
            },
        },
        { $sort: { commentCount: -1 } },
        {
            $facet: {
            top: [{ $limit: limit }],
            others: [
                { $skip: limit },
                {
                $group: {
                    _id: null,
                    commentCount: { $sum: '$commentCount' },
                },
                },
            ],
            },
        },
        ]);

        const rawTop = result?.top || [];
        const othersCount = result?.others?.[0]?.commentCount || 0;

        const top = rawTop.map((item: any) => ({
            postId: item._id.postId,
            title: item._id.title,
            commentCount: item.commentCount,
        }));

        return {
            fromDate,
            toDate,
            limit,
            top,
            others: othersCount,
        };
    }

    private parseRange(dateRangeDto: DateRangeDto) {
        const { from, to } = dateRangeDto;

        if (!from || !to) {
            throw new BadRequestException('from and to query params are required');
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid date format');
        }

        toDate.setHours(23, 59, 59, 999);

        return { fromDate, toDate };
    }
}
