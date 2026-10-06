import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { PaymentType } from "../entities/salary_payment.entity";

export class CreateSalaryPaymentDto {

    // user_id yoki employee_id - faqat bittasi yuboriladi
    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsNumber()
    employee_id?: number;

    @IsNumber()
    base_salary_norm: number;

    @IsNumber()
    amount: number;

    @IsEnum(PaymentType)
    payment_type: PaymentType;

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
