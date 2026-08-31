import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Length(1, 254)
  email!: string;

  @IsString()
  @Length(1, 72)
  password!: string;
}
