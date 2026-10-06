import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateEmployeeDto {

    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    position: string;

    @IsOptional()
    @IsDateString()
    hired_at?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
