import { Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, minlength: 2, maxlength: 100 })
    name: string
    
    @Prop({ required: true, minlength: 2, maxlength: 100 })
    lastName: string

    @Prop({ required: true, unique: true })
    email: string

    @Prop({ required: true, unique: true, minlength: 3, maxlength: 30 })
    username: string

    @Prop({ required: true, minlength: 8, maxlength: 100, match: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/ })
    password: string

    @Prop({ required: true, type: Date })
    dateOfBirth: Date

    @Prop({ required: false, default: '' })
    description: string

    @Prop({ required: true, default: 'https://res.cloudinary.com/.../default-avatar.png' })
    photo: string;

    @Prop({ default: 'user', enum: ['user', 'admin'] })
    role: string
}

export const UserSchema = SchemaFactory.createForClass(User);