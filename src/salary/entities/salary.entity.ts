import { Employee } from "src/employee/entities/employee.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";




@Entity()
export class Salary {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    current_salary: number;

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;

    // Maosh yo user'ga (akkaunti bor xodim), yo employee'ga (qorovul, oshpaz...) tegishli bo'ladi
    @OneToOne(()=>User,{onDelete:"CASCADE"})
    @JoinColumn({name:"user_id"})
    @Index({ unique: true })
    user:User

    @OneToOne(()=>Employee,{onDelete:"CASCADE"})
    @JoinColumn({name:"employee_id"})
    @Index({ unique: true })
    employee:Employee
}



/*

-- 1. SALARIES JADVALI (Xodimning hozirgi oylik stavkasi)
CREATE TABLE salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_salary DECIMAL(15, 2) NOT NULL, -- Hozirgi belgilangan oyligi (Masalan: 6000000.00)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. SALARY_PAYMENTS JADVALI (To'lovlar tarixi va osha oydagi oylik normasi)
CREATE TABLE salary_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    base_salary_norm DECIMAL(15, 2) NOT NULL, -- Osha oydagi umumiy oylik normasi (Snapshot/Muhrlangan maosh)
    amount DECIMAL(15, 2) NOT NULL,            -- Aynan shu tranzaksiyada berilgan pul (Avans yoki Qoldiq)
    payment_type ENUM('advance', 'salary') NOT NULL, -- 'advance' (avans) yoki 'salary' (oylikning qolgani)
    period_month TINYINT NOT NULL,             -- Qaysi oy uchun (1-12)
    period_year SMALLINT NOT NULL,             -- Qaysi yil uchun (Masalan: 2026)
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT NULL,                         -- Izoh (Masalan: "Sentabr oyi avansi")
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


*/