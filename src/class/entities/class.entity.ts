import { Student } from "src/student/entities/student.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Class {

    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    name: string;

    @CreateDateColumn()
    date: Date;



    //relations

    @ManyToOne(()=> User, user => user.classs,{nullable:true})
    users:User|null;

    @OneToMany(()=> Student, student => student.classs)
    students:Student[];



}
