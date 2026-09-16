import { Test, TestingModule } from '@nestjs/testing';
import { SalaryPaymentController } from './salary_payment.controller';
import { SalaryPaymentService } from './salary_payment.service';

describe('SalaryPaymentController', () => {
  let controller: SalaryPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalaryPaymentController],
      providers: [SalaryPaymentService],
    }).compile();

    controller = module.get<SalaryPaymentController>(SalaryPaymentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
