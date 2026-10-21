import { PaymentMethod } from "src/salary_payment/entities/salary_payment.entity";
import { Student } from "src/student/entities/student.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class TuitionPayment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("decimal", { precision: 15, scale: 2 })
    amount: number;

    // Shu to'lov paytidagi chegirmadan keyingi oylik narx (Snapshot/Muhrlangan)
    @Column("decimal", { precision: 15, scale: 2 })
    net_fee_norm: number;

    // To'lov qaysi oy uchun ekanligi (to'lov sanasidan mustaqil, kechiktirilgan to'lovlarni to'g'ri oyga bog'lash uchun)
    @Column("tinyint")
    period_month: number;

    @Column("smallint")
    period_year: number;

    @Column({ type: "enum", enum: PaymentMethod, default: PaymentMethod.CASH })
    payment_method: PaymentMethod;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    paid_at: Date;

    @Column("text", { nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Student, { onDelete: "CASCADE" })
    @JoinColumn({ name: "student_id" })
    student: Student;
}
