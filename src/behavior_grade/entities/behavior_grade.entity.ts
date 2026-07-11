import { Student } from "src/student/entities/student.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BehaviorGradeItem } from "./behavior_grade_items.entity";

@Entity()
export class BehaviorGrade {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.behaviorGrades)
    user: User;

    @ManyToOne(() => Student, student => student.behaviorGrades,{onDelete:"CASCADE"})
    student: Student;

    @ManyToOne(() => Subject, subject => subject.behaviorGrades)
    subject: Subject;

    @OneToMany(() => BehaviorGradeItem, (item) => item.behaviorGrade, {
        cascade: true,
    })
    items: BehaviorGradeItem[];

   

    @Column({nullable:true})
    overall_comment: string;

    @CreateDateColumn()
    date: Date;


}
