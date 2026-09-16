import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TuitionService } from './tuition.service';
import { CreateTuitionDto } from './dto/create-tuition.dto';
import { UpdateTuitionDto } from './dto/update-tuition.dto';

@Controller('tuition')
export class TuitionController {
  constructor(private readonly tuitionService: TuitionService) {}

  @Post("add")
  create(@Body() createTuitionDto: CreateTuitionDto) {
    return this.tuitionService.create(createTuitionDto);
  }

  @Get("getall")
  findAll() {
    return this.tuitionService.findAll();
  }

  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.tuitionService.findOne(+id);
  }

  @Get('getby/student/:studentId')
  findEffectiveForStudent(@Param('studentId') studentId: string) {
    return this.tuitionService.findEffectiveForStudent(+studentId);
  }

  // GET http://localhost:3000/tuition/getfull?page=1&limit=10&search=Ali
  @Get("getfull")
  findAllPagSearch(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search?: string,
  ) {
    return this.tuitionService.findAllPagSearch(page, limit, search);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateTuitionDto: UpdateTuitionDto) {
    return this.tuitionService.update(+id, updateTuitionDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.tuitionService.remove(+id);
  }
}
