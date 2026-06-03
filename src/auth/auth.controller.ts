import { Body, Controller, Post, Put } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { EmailDto, SignInDto, SignUpDto, VerifyCodeDto } from "./dto";

@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService) {}

    @Post('signup')
    signUp(@Body() dto: SignUpDto){
        return this.authService.signUp(dto);
    }

    @Post('signin')
    signIn(@Body() dto: SignInDto){
        return this.authService.signIn(dto);
    }

    @Post('generate-code')
    generateCode(@Body() dto: EmailDto) {
        return this.authService.generateCode(dto);
    }

    @Put('verify-code')
    verifyCode(@Body() dto: VerifyCodeDto) {
        return this.authService.verifyCode(dto);
    }
}