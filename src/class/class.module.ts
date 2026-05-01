import { Module } from '@nestjs/common';
import { ClassService } from './class.service';
import { ClassController } from './class.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports:[TypeOrmModule.forFeature([Class]),
  UserModule
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports:[ClassService]
})
export class ClassModule {}
