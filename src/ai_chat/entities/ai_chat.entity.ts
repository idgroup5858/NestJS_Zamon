import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// AI bilan suhbat (har bir user o'z suhbatlarini ko'radi)
@Entity()
export class AiChat {

    @PrimaryGeneratedColumn()
    id: number;

    // Berilmasa birinchi xabardan avtomatik qo'yiladi
    @Column({ type: "varchar", length: 255, nullable: true })
    title: string | null;

    // Suhbat egasi (bir tomonlama bog'lanish)
    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    // Har yangi xabarda yangilanadi - suhbatlar ro'yxati shu bo'yicha tartiblanadi
    @UpdateDateColumn()
    updatedAt: Date;
}
