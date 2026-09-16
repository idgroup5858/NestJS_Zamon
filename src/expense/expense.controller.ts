import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post("add")
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.create(createExpenseDto);
  }

  @Get("getall")
  findAll() {
    return this.expenseService.findAll();
  }

  // GET http://localhost:3000/expense/getby/period?month=9&year=2026
  @Get('getby/period')
  findByPeriod(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.expenseService.findByPeriod(+month, +year);
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.expenseService.findOne(+id);
  }

  // GET http://localhost:3000/expense/getfull?page=1&limit=10&search=gaz
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return this.expenseService.findAllPagSearch(page, limit, search);
  }

  // GET http://localhost:3000/expense/dashboard?month=9&year=2026
  @Get('dashboard')
  getExpenseDashboard(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.expenseService.getExpenseDashboard(+month, +year);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(+id, updateExpenseDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(+id);
  }
}
