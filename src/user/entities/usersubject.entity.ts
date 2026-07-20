import { Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { Class } from 'src/class/entities/class.entity';
import { Subject } from 'src/subject/entities/subject.entity';


@Entity()
export class UserSubject {
    @PrimaryGeneratedColumn()
    id: number;

    // Ustoz
    @ManyToOne(() => User, (user) => user.userSubjects, { onDelete: 'CASCADE' })
    user: User;

    // Fan
    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    subject: Subject;

    // Shu fanga tegishli sinflar (Bir tomonlama ManyToMany)
    @ManyToMany(() => Class)
    @JoinTable({ name: 'user_subject_classes' })
    classes: Class[];
}
