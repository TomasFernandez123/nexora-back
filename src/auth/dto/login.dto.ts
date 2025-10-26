import { IsString, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';

export class LoginDto {
    @ValidateIf(o => !o.username)
    @IsNotEmpty({ message: 'Email is required when username is not provided' })
    @IsString()
    @IsOptional()
    email?: string;

    @ValidateIf(o => !o.email)
    @IsNotEmpty({ message: 'Username is required when email is not provided' })
    @IsString()
    @IsOptional()
    username?: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    password: string;
}
