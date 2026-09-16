import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SalaryPaymentService } from './salary_payment.service';
import { CreateSalaryPaymentDto } from './dto/create-salary_payment.dto';
import { UpdateSalaryPaymentDto } from './dto/update-salary_payment.dto';

@Controller('salarypayment')
export class SalaryPaymentController {
  constructor(private readonly salaryPaymentService: SalaryPaymentService) {}

  @Post("add")
  create(@Body() createSalaryPaymentDto: CreateSalaryPaymentDto) {
    return this.salaryPaymentService.create(createSalaryPaymentDto);
  }

  @Get("getall")
  findAll() {
    return this.salaryPaymentService.findAll();
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.salaryPaymentService.findOne(+id);
  }

  @Get('getby/user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.salaryPaymentService.findByUserId(+userId);
  }

  // GET http://localhost:3000/salarypayment/status?month=9&year=2026&status=partial
  @Get('status')
  getUsersSalaryStatus(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('status') status?: 'not_paid' | 'partial' | 'fully_paid',
  ) {
    return this.salaryPaymentService.getUsersSalaryStatus(+month, +year, status);
  }

  // GET http://localhost:3000/salarypayment/dashboard?month=9&year=2026
  @Get('dashboard')
  getSalaryDashboard(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.salaryPaymentService.getSalaryDashboard(+month, +year);
  }

  // GET http://localhost:3000/salarypayment/getby/user/1/period?month=9&year=2026
  @Get('getby/user/:userId/period')
  findByUserAndPeriod(
    @Param('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.salaryPaymentService.findByUserAndPeriod(+userId, +month, +year);
  }

  // GET http://localhost:3000/salarypayment/getfull?page=1&limit=10&search=Ali
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return this.salaryPaymentService.findAllPagSearch(page, limit, search);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateSalaryPaymentDto: UpdateSalaryPaymentDto) {
    return this.salaryPaymentService.update(+id, updateSalaryPaymentDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.salaryPaymentService.remove(+id);
  }
}
