import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BasicGradeService } from './basic_grade.service';
import { CreateBasicGradeDto } from './dto/create-basic_grade.dto';
import { UpdateBasicGradeDto } from './dto/update-basic_grade.dto';

@Controller('basicgrade')
export class BasicGradeController {
  constructor(private readonly basicGradeService: BasicGradeService) { }

  @Post("add")
  create(@Body() createBasicGradeDto: CreateBasicGradeDto) {
    return this.basicGradeService.create(createBasicGradeDto);
  }

  @Get("getall")
  findAll() {
    return this.basicGradeService.findAll();
  }

  @Get("getfullrange")
  findAllPagSearchRange(
    @Query('page') page: number,
  @Query('limit') limit: number,
  @Query('search') search?: string,
  @Query('class_name') class_name?: string,
  @Query('start') startDate?: string,
  @Query('end') endDate?: string,
) {
  return this.basicGradeService.findAllPagSearchRange(
    Number(page),
    Number(limit),
    search,
    class_name,
    startDate,
    endDate
  );
  }

  @Get("getfull")
  findAllPagSearch(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("search") search: string
  ) {
    return this.basicGradeService.findAllPagSearch(+page, +limit, search);
  }


  @Get("allrange")
    findAllWithRange(
     @Query("start") startDate:string,
     @Query("end") endDate:string
    ) {
      return this.basicGradeService.findAllWithRange(startDate,endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.basicGradeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBasicGradeDto: UpdateBasicGradeDto) {
    return this.basicGradeService.update(+id, updateBasicGradeDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.basicGradeService.remove(+id);
  }
}
