import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy/jwt.strategy";
import { EmailService } from "../email/email.service";
import { EmailModule } from '../email/email.module';
import { DomainService } from "src/domain/domain.service";
import { DomainModule } from "src/domain/domain.module";
import { UserModule } from "src/user/user.module";
import { UserService } from "src/user/user.service";

@Module({
    imports: [ JwtModule.register({}), EmailModule, DomainModule, UserModule ],
    controllers: [ AuthController ],
    providers: [ AuthService, JwtStrategy, EmailService, DomainService, UserService ]
})

export class AuthModule{}