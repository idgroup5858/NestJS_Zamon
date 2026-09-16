import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { DiscountType } from "../entities/tuition.entity";

export class CreateTuitionDto {

    @IsOptional()
    @IsNumber()
    class_id?: number;

    @IsOptional()
    @IsNumber()
    student_id?: number;

    @IsNumber()
    monthly_fee: number;

    @IsOptional()
    @IsEnum(DiscountType)
    discount_type?: DiscountType;

    @IsOptional()
    @IsNumber()
    discount_value?: number;
}
