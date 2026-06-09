import { IsOptional, IsString, IsNumberString } from "class-validator";
import { Trim } from "src/decorator";

export class FilterDto {
    @IsOptional()
    @IsString()
    @Trim()
    categoryId?: string;

    @IsOptional()
    @IsString()
    @Trim()
    condition?: string;

    @IsOptional()
    @IsNumberString()
    @Trim()
    minPrice?: string;

    @IsOptional()
    @IsNumberString()
    @Trim()
    maxPrice?: string;

    @IsOptional()
    @IsString()
    @Trim()
    search?: string;
}