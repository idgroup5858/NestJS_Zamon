import { BasicGrade } from "src/basic_grade/entities/basic_grade.entity";
import { BehaviorGrade } from "src/behavior_grade/entities/behavior_grade.entity";
import { Criterion } from "src/criteria/entities/criterion.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity,  ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Subject {

    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;

    @CreateDateColumn()
    date: Date;


    //relations

    @ManyToMany(() => User, user => user.subjects)
    users: User;

    @OneToMany(() => BasicGrade, basicGrade => basicGrade.subject)
    basicGrades: BasicGrade[];


    @OneToMany(() => BehaviorGrade, (bg) => bg.subject)
    behaviorGrades: BehaviorGrade[];


    @OneToMany(()=> Criterion, criterion => criterion.subject)
    criteria:Criterion[]

}
