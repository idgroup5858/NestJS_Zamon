import { Student } from "src/student/entities/student.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class BasicGrade {

    @PrimaryGeneratedColumn()
    id:number;

    @ManyToOne(()=> User, user => user.basicGrades)
    user:User;

    @ManyToOne(()=> Student, student => student.basicGrades)
    student:Student;

    @ManyToOne(()=> Subject, subject => subject.basicGrades)
    subject:Subject;

    

    @Column()
    grade:number;

    @Column()
    comment:string;

    @CreateDateColumn()
    date:Date;

}
