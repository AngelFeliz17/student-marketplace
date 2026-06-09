import { IsNotEmpty, IsString } from "class-validator";
import { Trim } from "src/decorator";

export class ReportDto {
    @IsString()
    @IsNotEmpty()
    @Trim()
    reason: string;
}