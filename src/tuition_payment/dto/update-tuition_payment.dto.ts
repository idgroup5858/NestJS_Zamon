import { PartialType } from '@nestjs/mapped-types';
import { CreateTuitionPaymentDto } from './create-tuition_payment.dto';

export class UpdateTuitionPaymentDto extends PartialType(CreateTuitionPaymentDto) {}
