import { IsOptional, IsString, IsIn, IsNumberString, IsBooleanString } from 'class-validator';

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

  @IsOptional()
  @IsBooleanString()
  showDeleted?: string; 
  
  @IsOptional()
  @IsBooleanString()
  userName?: string; 
}
