import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAiChatDto {

    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;
}
