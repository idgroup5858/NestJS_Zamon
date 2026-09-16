import { User } from "src/user/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum PaymentType {
    ADVANCE = "advance",
    SALARY = "salary",
}

@Entity()
export class SalaryPayment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("decimal", { precision: 15, scale: 2 })
    base_salary_norm: number;

    @Column("decimal", { precision: 15, scale: 2 })
    amount: number;

    @Column({ type: "enum", enum: PaymentType })
    payment_type: PaymentType;

    @Column("tinyint")
    period_month: number;

    @Column("smallint")
    period_year: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    paid_at: Date;

    @Column("text", { nullable: true })
    comment: string;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;
}
