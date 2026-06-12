import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Trim } from "src/decorator";

export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  @Trim()
  email: string;
  
  @MinLength(8)
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  @Trim()
  name: string;
}

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  @Trim()
  email: string;

  @IsNotEmpty()
  @IsString() 
  password: string;
}

export class ChangePasswordDto {
    @IsNotEmpty()
    @IsString()
    currentPassword: string

    @MinLength(8)
    @IsNotEmpty()
    @IsString()
    newPassword: string
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @Trim()
  email: string
}

export class ChangeForgottenPasswordDto {
  @IsNotEmpty()
  @IsString()
  newPassword: string

  @IsNotEmpty()
  @IsString()
  newPasswordConfirmation: string
}

export class EmailDto {
  @IsNotEmpty()
  @IsEmail()
  @Trim()
  email: string;
}

export class VerifyCodeDto {
  @IsNotEmpty()
  @IsEmail()
  @Trim()
  email: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}