import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Employee {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({ nullable: true })
    phone: string;

    // Qiymatlar UI'dagi dropdown'dan keladi (Qorovul, Oshpaz, Farrosh...)
    @Column({ length: 100 })
    position: string;

    // TypeORM "date" ustunini "2026-10-06" ko'rinishidagi string qilib qaytaradi
    @Column({ type: "date", nullable: true })
    hired_at: string;

    // Ishdan ketganda false qilinadi
    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
