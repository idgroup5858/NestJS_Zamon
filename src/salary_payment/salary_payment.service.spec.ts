import { Test, TestingModule } from '@nestjs/testing';
import { SalaryPaymentService } from './salary_payment.service';

describe('SalaryPaymentService', () => {
  let service: SalaryPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalaryPaymentService],
    }).compile();

    service = module.get<SalaryPaymentService>(SalaryPaymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
