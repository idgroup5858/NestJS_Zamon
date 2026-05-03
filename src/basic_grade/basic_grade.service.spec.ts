import { Test, TestingModule } from '@nestjs/testing';
import { BasicGradeService } from './basic_grade.service';

describe('BasicGradeService', () => {
  let service: BasicGradeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicGradeService],
    }).compile();

    service = module.get<BasicGradeService>(BasicGradeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
