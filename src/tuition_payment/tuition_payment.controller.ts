import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TuitionPaymentService } from './tuition_payment.service';
import { CreateTuitionPaymentDto } from './dto/create-tuition_payment.dto';
import { UpdateTuitionPaymentDto } from './dto/update-tuition_payment.dto';

@Controller('tuitionpayment')
export class TuitionPaymentController {
  constructor(private readonly tuitionPaymentService: TuitionPaymentService) {}

  @Post("add")
  create(@Body() createTuitionPaymentDto: CreateTuitionPaymentDto) {
    return this.tuitionPaymentService.create(createTuitionPaymentDto);
  }

  @Get("getall")
  findAll() {
    return this.tuitionPaymentService.findAll();
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.tuitionPaymentService.findOne(+id);
  }

  @Get('getby/student/:studentId')
  findByStudentId(@Param('studentId') studentId: string) {
    return this.tuitionPaymentService.findByStudentId(+studentId);
  }

  // GET http://localhost:3000/tuitionpayment/getby/student/1/period?month=9&year=2026
  @Get('getby/student/:studentId/period')
  findByStudentAndPeriod(
    @Param('studentId') studentId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.tuitionPaymentService.findByStudentAndPeriod(+studentId, +month, +year);
  }

  // GET http://localhost:3000/tuitionpayment/getfull?page=1&limit=10&search=Ali
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return this.tuitionPaymentService.findAllPagSearch(page, limit, search);
  }

  // GET http://localhost:3000/tuitionpayment/dashboard?month=9&year=2026
  @Get('dashboard')
  getTuitionDashboard(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.tuitionPaymentService.getTuitionDashboard(+month, +year);
  }

  // GET http://localhost:3000/tuitionpayment/status?month=9&year=2026&status=partial
  @Get('status')
  getStudentsTuitionStatus(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('status') status?: 'not_paid' | 'partial' | 'fully_paid',
  ) {
    return this.tuitionPaymentService.getStudentsTuitionStatus(+month, +year, status);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateTuitionPaymentDto: UpdateTuitionPaymentDto) {
    return this.tuitionPaymentService.update(+id, updateTuitionPaymentDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.tuitionPaymentService.remove(+id);
  }
}
