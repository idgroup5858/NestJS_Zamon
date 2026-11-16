import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatController } from './ai_chat.controller';
import { AiChatService } from './ai_chat.service';
import { AiToolsService } from './ai_tools.service';
import { AiChat } from './entities/ai_chat.entity';
import { AiMessage } from './entities/ai_message.entity';
import { Student } from 'src/student/entities/student.entity';
import { Class } from 'src/class/entities/class.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { BasicGrade } from 'src/basic_grade/entities/basic_grade.entity';
import { BasicGradeItem } from 'src/basic_grade/entities/basic_grade_item.entity';
import { BehaviorGrade } from 'src/behavior_grade/entities/behavior_grade.entity';
import { BehaviorGradeItem } from 'src/behavior_grade/entities/behavior_grade_items.entity';

// GEMINI_API_KEY va GEMINI_MODEL .env dan o'qiladi (ConfigModule global)
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiChat,
      AiMessage,
      Student,
      Class,
      Subject,
      BasicGrade,
      BasicGradeItem,
      BehaviorGrade,
      BehaviorGradeItem,
    ]),
  ],
  controllers: [AiChatController],
  providers: [AiChatService, AiToolsService],
})
export class AiChatModule {}
