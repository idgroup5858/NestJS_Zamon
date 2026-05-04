import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BehaviorGrade } from "./behavior_grade.entity";


@Entity()
export class BehaviorGradeItem {

 @PrimaryGeneratedColumn()
  id: number;

  // 🔗 qaysi behavior grade ga tegishli
  @ManyToOne(() => BehaviorGrade, (bg) => bg.items, {
    onDelete: 'CASCADE',
  })
  //@JoinColumn({ name: 'behavior_grade_id' })
  behaviorGrade: BehaviorGrade;

  // 📌 mezon turi (odobi, axloqi, faolligi...)
  @Column()
  criteria_type: string;

  // ⭐ baho
  @Column()
  grade: string; // yaxshi | ortacha | qoniqarli

  // 💬 comment
  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn()
  date: Date;
}
