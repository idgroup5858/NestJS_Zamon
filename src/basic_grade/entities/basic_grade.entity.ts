import { Student } from "src/student/entities/student.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BasicGradeItem } from "./basic_grade_item.entity";


@Entity()
export class BasicGrade {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.basicGrades)
    user: User;

    @ManyToOne(() => Student, student => student.basicGrades,{onDelete:"CASCADE"})
    student: Student;

    @ManyToOne(() => Subject, subject => subject.basicGrades)
    subject: Subject;

    @Column()
    theme: string;

    @Column()
    grade: number;

    @Column()
    comment: string;

    @CreateDateColumn()
    date: Date;


    @OneToMany(() => BasicGradeItem, item => item.basicGrade, {
        cascade: true,
    })
    items: BasicGradeItem[];

}
