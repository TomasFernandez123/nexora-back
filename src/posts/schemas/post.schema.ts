import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: String, default: null })
  photo?: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  likes: Types.ObjectId[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: false })
  deleted: boolean;

  @Prop([
    {
      _id: false,
      author: { type: Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ])
  comments: {
    author: Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  shareCount: number; 

  @Prop({ default: 0 })
  saveCount: number; 
}

export const PostSchema = SchemaFactory.createForClass(Post);
