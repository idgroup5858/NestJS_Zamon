import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AiChat } from "./ai_chat.entity";

export enum AiMessageRole {
    USER = "user",
    ASSISTANT = "assistant",
}

@Entity()
export class AiMessage {

    @PrimaryGeneratedColumn()
    id: number;

    // Suhbat o'chirilsa xabarlari ham o'chadi (bir tomonlama bog'lanish)
    @ManyToOne(() => AiChat, { onDelete: "CASCADE" })
    @JoinColumn({ name: "chat_id" })
    chat: AiChat;

    @Column({ type: "enum", enum: AiMessageRole })
    role: AiMessageRole;

    // AI javobi Markdown formatida saqlanadi
    @Column("text")
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
