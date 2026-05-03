import { Test, TestingModule } from '@nestjs/testing';
import { BasicGradeController } from './basic_grade.controller';
import { BasicGradeService } from './basic_grade.service';

describe('BasicGradeController', () => {
  let controller: BasicGradeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasicGradeController],
      providers: [BasicGradeService],
    }).compile();

    controller = module.get<BasicGradeController>(BasicGradeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
