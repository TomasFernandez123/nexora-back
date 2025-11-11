import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must be less than 100 characters' })
  title: string;

  @IsString()
  @MinLength(5, { message: 'Message must be at least 5 characters long' })
  @MaxLength(500, { message: 'Message must be less than 500 characters' })
  message: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  mediaType?: 'image' | 'video';
}
