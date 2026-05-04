import { BasicGrade } from "src/basic_grade/entities/basic_grade.entity";
import { BehaviorGrade } from "src/behavior_grade/entities/behavior_grade.entity";
import { Class } from "src/class/entities/class.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";



@Entity()
export class User {

     @PrimaryGeneratedColumn()
     id: number;

     @Column()
     first_name: string;

     @Column()
     last_name: string;

     @Column()
     phone: string;

     @Column()
     email: string;

     @Column()
     password: string;

     @Column()
     role: string;

     @CreateDateColumn()
     date: Date;

     //Relations

     @ManyToMany(() => Subject, subject => subject.users)
     @JoinTable()
     subjects:Subject[];



     @OneToMany(()=> Class, classs => classs.users)
     classs:Class[]


     @OneToMany(()=> BasicGrade, basicGrade => basicGrade.user)
     basicGrades:BasicGrade[]


     @OneToMany(() => BehaviorGrade, (bg) => bg.user)
     behaviorGrades: BehaviorGrade[];






}
