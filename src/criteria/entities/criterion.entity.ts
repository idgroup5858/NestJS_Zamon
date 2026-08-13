import { Class } from "src/class/entities/class.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("criteria")
export class Criterion {

    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    

    @ManyToOne(() => Subject, subject => subject.criteria,{onDelete:"CASCADE"})
    subject: Subject;

    @ManyToOne(()=>Class,{nullable:true})
    classs:Class

}
