import  { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common" 
import { EmailDto, SignInDto, SignUpDto, VerifyCodeDto } from "./dto"
import * as argon from "argon2"
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email/email.service";
import * as crypto from "crypto";

@Injectable()

export class AuthService{
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService, private sendEmail: EmailService ) {}

    async signUp(dto: SignUpDto) {
        const hash = await argon.hash(dto.password);

        const domain = dto.email.split('@')[1].toLowerCase();
        try {
            const uniDomain = await this.prisma.emailDomain.findUnique({ where: { domain } });
            if(!uniDomain) {
                throw new ForbiddenException("University domain not found");
            }

            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    universityId: uniDomain?.universityId,
                    password: hash
                }
            });

            try {
                return await this.generateCode(dto);
            } catch {
                throw new ForbiddenException("Error sending code, try again");
            }

        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if(error.code === "P2002") {
                    throw new ForbiddenException('Email already in use')
                }
            }
            throw error;
        }
    }

    async signIn(dto: SignInDto) {
        const user = await this.prisma.user.findUnique({ where: {
            email: dto.email
        }});

        if(!user) throw new ForbiddenException("Email not found");
        if(!user.verified) throw new ForbiddenException("You haven't verified your account, try again.");
        
        const verifyPass = await argon.verify(user.password, dto.password);
        if(!verifyPass) throw new ForbiddenException("Incorrect password");
        
        return this.signToken(user.id, user.email);
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

        return { msg: "Account verified", ...access_token };
    }
} 