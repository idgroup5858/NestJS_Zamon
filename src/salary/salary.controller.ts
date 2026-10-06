import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post("add")
  create(@Body() createSalaryDto: CreateSalaryDto) {
    return this.salaryService.create(createSalaryDto);
  }

  @Get("getall")
  findAll() {
    return this.salaryService.findAll();
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(+id);
  }

   
  @Get('getby/user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.salaryService.findByUserId(+userId);
  }

  @Get('getby/employee/:employeeId')
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.salaryService.findByEmployeeId(+employeeId);
  }


    // GET http://localhost:3000/salary?page=1&limit=10&search=Ali
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return this.salaryService.findAllPagSearch(page, limit, search);
  }


  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto) {
    return this.salaryService.update(+id, updateSalaryDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.salaryService.remove(+id);
  }
}
