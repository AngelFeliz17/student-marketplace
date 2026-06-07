import  { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common" 
import { ChangeForgottenPasswordDto, ChangePasswordDto, EmailDto, ForgotPasswordDto, SignInDto, SignUpDto, VerifyCodeDto} from "./dto"
import * as argon from "argon2"
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { JsonWebTokenError, JwtService, TokenExpiredError } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";
import * as crypto from "crypto";
import { User } from "generated/prisma/browser";
import { DomainService } from "src/domain/domain.service";
import { UserService } from "src/user/user.service";

@Injectable()

export class AuthService{
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService, private sendEmail: EmailService, private domain: DomainService, private userService: UserService ) {}

    async signUp(dto: SignUpDto) {
        const hash = await argon.hash(dto.password);

        try {
            const domain = await this.domain.validateEmail(dto.email);
            if(!domain) {
                throw new ForbiddenException("University domain not found");
            }
            const existingUser = await this.prisma.user.findFirst({ where: { email: dto.email } });
            if(existingUser?.deletedAt) throw new UnauthorizedException('Account has been deleted. Sign in to restore');
            // if(!existingUser?.suspended) throw new UnauthorizedException("Account is suspended. Check your email for more information");

            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    universityId: domain.universityId,
                    password: hash
                },
                omit: { password: true }
            });

            try {
                await this.generateCode(dto);
            } catch(error) {
                console.log(error);
            }
            
            return user;
        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if(error.code === "P2002") {
                    throw new ConflictException('Email already in use')
                }
            }
            throw error;
        }
    }

    async signIn(dto: SignInDto) {
        const user = await this.prisma.user.findUnique({ where: {
            email: dto.email
        }});

        if(!user) throw new ForbiddenException("Invalid credentials");
        if(!user.verified) throw new UnauthorizedException("You haven't verified your account, try again.");
        // if(!user.suspended) throw new UnauthorizedException("Account is suspended. Check your email for more information");
        
        const verifyPass = await argon.verify(user.password, dto.password);
        if(!verifyPass) throw new ForbiddenException("Invalid credentials");
        if(user.deletedAt) {
            await this.userService.restore(user.id);   
        }
        
        return this.signToken(user.id, user.email);
    }

    async changePassword(loggedUser: User, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id: loggedUser.id } });
        if(!user) throw new ForbiddenException("Unable to process password change");

        const verifyCurrentPass = await argon.verify(user.password, dto.currentPassword);
        if(!verifyCurrentPass) throw new BadRequestException("Current password is incorrect");

        const verifyPasswordsNotTheSame = await argon.verify(user.password, dto.newPassword);
        if(verifyPasswordsNotTheSame) throw new BadRequestException("New password must be different from your current password")

        try {
            const hash = await argon.hash(dto.newPassword);
            await this.prisma.user.update({ where: { id: user.id }, data: { password: hash}})
            return { msg: "Password changed successfully"}
        } catch (error) {
            console.error(error)
            throw new InternalServerErrorException("Failed to update password");
        }
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { token: true } });
        if(!user) { 
            return { msg: "If an account exists, a reset link has been sent" }
        };
        if(user.token) {
            await this.prisma.forgotPasswordToken.delete({ where: { id: user.token.id } })
        }
        const token = await this.forgotPassToken(user.id, user.email);
        const expiresAt = new Date(Date.now() + 600000);

        const savedToken = await this.prisma.forgotPasswordToken.create({ data: {
            userId: user.id,
            token,
            expiresAt
        }});

        try {
            await this.sendEmail.sendVerificationToken(token, user.email);
        } catch (error) {
            await this.prisma.forgotPasswordToken.delete({ where: { id: savedToken.id } });
        }
        return { msg: "If an account exists, a reset link has been sent" };
    }

    async changeForgottenPassword(token: string, dto: ChangeForgottenPasswordDto) {
        if(dto.newPassword !== dto.newPasswordConfirmation) throw new BadRequestException("Passwords don't match");

        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.getOrThrow('JWT_SECRET')
            });

            const resetToken = await this.prisma.forgotPasswordToken.findUnique({ where: { userId: payload.sub }});
            if(!resetToken || resetToken.token !== token) throw new ForbiddenException("Invalid token");

            const hash = await argon.hash(dto.newPassword);
            await this.prisma.user.update({ where: { id: payload.sub }, data: {
                password: hash
            } });

            await this.prisma.forgotPasswordToken.delete({ where: { userId: payload.sub } });
            return { msg: "Password changed successfully" }
        } catch (error) {
            if(error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
                throw new ForbiddenException("Invalid or expired token");
            }
            throw error;
        }
    }

    async forgotPassToken(userId: string, email: string) {
        const payload = {
            sub: userId,
            email
        };
        const secret = this.config.get("JWT_SECRET");

        const token = await this.jwt.signAsync(payload, { expiresIn: "10m", secret});
        
        return token;
    }

    async signToken(userId: string, email: string): Promise<{access_token: string}> {
        const payload = {
            sub: userId,
            email
        };
        const secret = this.config.get("JWT_SECRET");

        const access_token = await this.jwt.signAsync(payload, { expiresIn: "7d", secret});
        return { access_token: access_token };
    }

    async generateCode(dto: EmailDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { code: true } });

        if(!user) throw new NotFoundException("Email not found");
        if(user.verified) throw new ForbiddenException("You are already verified");

        if(user.code) {
            await this.prisma.emailVerificationCode.delete({ where: { id: user.code.id } })
        }

        const codeDigits = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
        const hashedCode = await argon.hash(codeDigits);
        const expiresAt = new Date(Date.now() + 600000);

        await this.prisma.emailVerificationCode.create({ data: {
            userId: user.id,
            code: hashedCode,
            expiresAt
        }});

        await this.sendEmail.sendVerificationCode(user.email, user.firstName, codeDigits, expiresAt)
        return { msg: "Code has been sent" }
    }

    async verifyCode(dto: VerifyCodeDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { code: true } });

        if(!user) throw new NotFoundException("Email not found");
        if(user.deletedAt) throw new NotFoundException("Account has been deleted")
        if(user.verified) throw new ForbiddenException("You are already verified");
        if(!user.code) throw new ForbiddenException("You haven't requested a code");
        if(user.code.expiresAt.getTime() < Date.now()) { 
            await this.prisma.emailVerificationCode.delete({
                where: { id: user.code.id }
            });
            throw new ForbiddenException("Code has expired");
        }

        const validCode = await argon.verify(user.code.code, dto.code);

        if(!validCode) {
            throw new ForbiddenException("Invalid code");
        }

        await this.prisma.user.update({ where: { id: user.id }, data: { verified: true }});

        await this.prisma.emailVerificationCode.delete({ where: { id: user.code.id }});
        await this.sendEmail.sendWelcomingEmail(user.email, user.firstName);
        const access_token = await this.signToken(user.id, user.email);

        return { msg: "Account verified successfully", ...access_token };
    }
} 