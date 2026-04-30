import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Subject {

    @PrimaryGeneratedColumn()
    id:number;
    @Column()
    name:string;

    @CreateDateColumn()
    date:Date;


    //relations

    @ManyToMany(()=> User, user => user.subjects)
    users:User[];

}
