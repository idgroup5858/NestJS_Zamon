import { IsNumber } from "class-validator";

export class CreateSalaryDto {

    @IsNumber()
    user_id:number

 @IsNumber()
    current_salary: number;
}
