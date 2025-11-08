import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class QueryPostsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['date', 'likes'])
  sort?: 'date' | 'likes'; 

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
