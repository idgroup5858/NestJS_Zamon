import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class SendMessageDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;

    // Berilmasa yangi suhbat ochiladi
    @IsOptional()
    @IsInt()
    chat_id?: number;
}
