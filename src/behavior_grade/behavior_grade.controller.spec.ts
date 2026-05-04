import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorGradeController } from './behavior_grade.controller';
import { BehaviorGradeService } from './behavior_grade.service';

describe('BehaviorGradeController', () => {
  let controller: BehaviorGradeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BehaviorGradeController],
      providers: [BehaviorGradeService],
    }).compile();

    controller = module.get<BehaviorGradeController>(BehaviorGradeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
