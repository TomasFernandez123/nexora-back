import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ required: true, minlength: 2, maxlength: 100 })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true, minlength: 3, maxlength: 30 })
  username: string;

  @Prop({
    required: false,
    minlength: 8,
    maxlength: 100,
    match: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/,
  })
  password?: string;

  @Prop({ default: 'local', enum: ['local', 'google', 'github'] })
  provider: string;

  @Prop({ required: false })
  providerId?: string;

  @Prop({ required: false, type: Date })
  dateOfBirth?: Date;

  @Prop({ required: false, default: '' })
  description: string;

  @Prop({
    required: true,
    default: 'https://res.cloudinary.com/.../default-avatar.png',
  })
  photo: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  following: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
