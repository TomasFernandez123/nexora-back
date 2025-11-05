import { Prop, Schema, SchemaFactory} from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true}) 
export class Post extends Document {
@Prop({ required: true, trim: true })
  titulo: string;

  @Prop({ required: true, trim: true })
  mensaje: string;

  @Prop()
  imagenUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  meGusta: Types.ObjectId[];

  @Prop({ default: false })
  eliminado: boolean;

  @Prop({ default: 0 })
  cantidadMeGusta: number;
}