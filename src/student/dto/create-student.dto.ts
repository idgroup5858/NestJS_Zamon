import { IsNumber, IsString } from "class-validator";

export class CreateStudentDto {


    @IsString()
    first_name: string;
    @IsString()
    last_name: string;
    @IsString()
    father_name: string;
    parent_phone: string;
    @IsNumber()
    classs_id: number;
    telegram_chat_id: string;
}
