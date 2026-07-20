import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './entities/jwt.strategy';
import { SubjectModule } from 'src/subject/subject.module';
import { UserSubject } from './entities/usersubject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,UserSubject]),
  JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.get<string>('JWT_ACCESS_SECRET'),
    }), // for genereted token
  }),
   SubjectModule],
  controllers: [UserController],
  providers: [UserService,JwtStrategy], //JwtStrategy for token authhorization  @UseGuards(AuthGuard("jwt"))
  exports:[UserService]
})
export class UserModule { }
