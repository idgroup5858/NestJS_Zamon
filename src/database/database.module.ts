import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({

    imports: [
        TypeOrmModule.forRoot({
            port: 3306,
            username: "zamonmak_a",
            password: "Dim@5858",
            database: "zamonmak_a",
            autoLoadEntities: true,
            synchronize: true
        })
    ]
})
export class DatabaseModule { }



/*

 host: "localhost",
                port: 3306,
                username: "zamonmak_a",
                password: "Dim@5858",
                database: "zamonmak_a",
                autoLoadEntities: true,
                synchronize: true




                host: "localhost",
                port: 3306,
                username: "root",
                password: "",
                database: "zamonmak_a",
                autoLoadEntities: true,
                synchronize: true

                */