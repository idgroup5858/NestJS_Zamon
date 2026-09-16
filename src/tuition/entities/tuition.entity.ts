import { Class } from "src/class/entities/class.entity";
import { Student } from "src/student/entities/student.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum DiscountType {
    NONE = "none",
    PERCENT = "percent",
    FIXED = "fixed",
}

@Entity()
export class Tuition {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("decimal", { precision: 15, scale: 2 })
    monthly_fee: number;

    @Column({ type: "enum", enum: DiscountType, default: DiscountType.NONE })
    discount_type: DiscountType;

    @Column("decimal", { precision: 15, scale: 2, nullable: true })
    discount_value: number;

    @UpdateDateColumn()
    updatedAt: Date;

    // Guruh uchun standart narx bo'lganda to'ldiriladi
    @ManyToOne(() => Class, { onDelete: "CASCADE", nullable: true })
    @JoinColumn({ name: "class_id" })
    classs: Class | null;

    // Faqat aynan shu o'quvchiga xos (istisno) narx bo'lganda to'ldiriladi
    @ManyToOne(() => Student, { onDelete: "CASCADE", nullable: true })
    @JoinColumn({ name: "student_id" })
    student: Student | null;
}
