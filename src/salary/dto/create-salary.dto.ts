import { IsNumber, IsOptional } from "class-validator";

export class CreateSalaryDto {

    // user_id yoki employee_id - faqat bittasi yuboriladi
    @IsOptional()
    @IsNumber()
    user_id?:number

    @IsOptional()
    @IsNumber()
    employee_id?:number

 @IsNumber()
    current_salary: number;
}
