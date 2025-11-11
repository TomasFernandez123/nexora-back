import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({message: 'Comment text cannot be empty'})
  text: string;
}
