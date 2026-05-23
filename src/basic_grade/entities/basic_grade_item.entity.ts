


import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Criterion } from "src/criteria/entities/criterion.entity";
import { BasicGrade } from "./basic_grade.entity";

@Entity()
export class BasicGradeItem {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BasicGrade, grade => grade.items, {
    onDelete: 'CASCADE',
  })
  basicGrade: BasicGrade;

  @ManyToOne(() => Criterion)
  criterion: Criterion;

  @Column()
  grade: number; // 1-5 yoki 0-100

  @Column({ nullable: true })
  comment: string;
}