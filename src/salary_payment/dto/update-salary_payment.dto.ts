import { PartialType } from '@nestjs/mapped-types';
import { CreateSalaryPaymentDto } from './create-salary_payment.dto';

export class UpdateSalaryPaymentDto extends PartialType(CreateSalaryPaymentDto) {}
