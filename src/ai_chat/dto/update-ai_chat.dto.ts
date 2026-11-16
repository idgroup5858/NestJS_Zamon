import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateAiChatDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;
}
