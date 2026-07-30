import { BasicGrade } from "src/basic_grade/entities/basic_grade.entity";
import { BehaviorGrade } from "src/behavior_grade/entities/behavior_grade.entity";
import { Class } from "src/class/entities/class.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Student {



    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    father_name: string;

    @Column({ nullable: true })
    parent_phone: string;

    @Column({ nullable: true })
    parent_phone2: string;

    @Column({ nullable: true })
    telegram_phone: string;

    @Column({ nullable: true })
    telegram_chat_id: string;

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn()
    date: Date;

    @ManyToOne(() => Class, classs => classs.students, { nullable: true })
    classs: Class | null;



    @OneToMany(() => BasicGrade, basicGrade => basicGrade.student)
    basicGrades: BasicGrade[];


    @OneToMany(() => BehaviorGrade, (bg) => bg.student)
    behaviorGrades: BehaviorGrade[];


}
