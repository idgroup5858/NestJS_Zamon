import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post("add")
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get("getall")
  findAll() {
    return this.employeeService.findAll();
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(+id);
  }

  // GET http://localhost:3000/employee/getfull?page=1&limit=10&search=Ali&active=true
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    const activeFilter = active === undefined ? undefined : active === 'true';
    return this.employeeService.findAllPagSearch(+page, +limit, search, activeFilter);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(+id, updateEmployeeDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(+id);
  }
}
