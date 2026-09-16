import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateTuitionPaymentDto {

    @IsNumber()
    student_id: number;

    @IsNumber()
    amount: number;

    @IsInt()
    @Min(1)
    @Max(12)
    period_month: number;

    @IsInt()
    period_year: number;

    @IsOptional()
    @IsString()
    comment?: string;
}
