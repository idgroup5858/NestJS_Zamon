import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Expense {

    @PrimaryGeneratedColumn()
    id: number;

    // Xarajat turi (masalan: "ovqat", "gaz", "svet", "tok", "ijara" va h.k.)
    @Column()
    category: string;

    @Column("decimal", { precision: 15, scale: 2 })
    amount: number;

    @Column("tinyint")
    period_month: number;

    @Column("smallint")
    period_year: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    expense_date: Date;

    @Column("text", { nullable: true })
    comment: string;
}
