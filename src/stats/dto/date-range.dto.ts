import { IsOptional, IsString, IsIn, IsNumberString, IsBooleanString } from 'class-validator';

export class DateRangeDto {
    @IsString()
    from: string;
    
    @IsString()
    to: string;
}