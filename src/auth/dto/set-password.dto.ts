import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).*$/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;
}
