import { IsEmail, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateUserDto {
    @IsString({ message: 'Name must be a string' }) 
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    name: string;
    @IsString({ message: 'Last name must be a string' }) 
    @MinLength(2, { message: 'Last name must be at least 2 characters long' })
    lastName: string;
    @IsEmail({}, { message: 'Email must be a valid email address' }) 
    email: string;
    @IsString({ message: 'Username must be a string' }) 
    @MinLength(3, { message: 'Username must be at least 3 characters long' })
    username: string;
    @IsString({ message: 'Password must be a string' }) 
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;
    @IsString({ message: 'Date of birth must be a string in ISO format' }) 
    dateOfBirth: string;

    @IsOptional() @IsString()
    description?: string;

    @IsOptional() @IsString()
    photo?: string;
}