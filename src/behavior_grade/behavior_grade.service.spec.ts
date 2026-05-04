import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorGradeService } from './behavior_grade.service';

describe('BehaviorGradeService', () => {
  let service: BehaviorGradeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BehaviorGradeService],
    }).compile();

    service = module.get<BehaviorGradeService>(BehaviorGradeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
