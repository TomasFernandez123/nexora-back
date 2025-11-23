import { IsOptional, IsString, IsIn, IsNumberString, IsBooleanString } from 'class-validator';
import { DateRangeDto } from './date-range.dto';

export class PostsPerUserDto extends DateRangeDto{
    @IsNumberString()
    limit: number;
}