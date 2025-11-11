import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
