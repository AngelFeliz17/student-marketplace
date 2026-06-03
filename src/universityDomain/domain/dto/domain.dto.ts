import { IsNotEmpty, IsString, Matches } from "class-validator";

export class DomainDto {
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        { message: "Invalid domain format" }
    )
    domain: string

    @IsString()
    @IsNotEmpty()
    universityId: string
}