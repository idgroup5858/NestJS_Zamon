import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { PaymentMethod } from "src/salary_payment/entities/salary_payment.entity";

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

    // Yuborilmasa bazada "cash" bo'ladi
    @IsOptional()
    @IsEnum(PaymentMethod)
    payment_method?: PaymentMethod;

    @IsOptional()
    @IsString()
    comment?: string;
}
