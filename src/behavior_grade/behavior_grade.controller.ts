import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BehaviorGradeService } from './behavior_grade.service';
import { CreateBehaviorGradeDto } from './dto/create-behavior_grade.dto';
import { UpdateBehaviorGradeDto } from './dto/update-behavior_grade.dto';

@Controller('behaviorgrade')
export class BehaviorGradeController {
  constructor(private readonly behaviorGradeService: BehaviorGradeService) {}

  @Post("add")
  create(@Body() createBehaviorGradeDto: CreateBehaviorGradeDto) {
    return this.behaviorGradeService.create(createBehaviorGradeDto);
  }
 @Get("getall")
  findAll() {
    return this.behaviorGradeService.findAll();
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
  return this.behaviorGradeService.findAllPagSearchRange(
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
    return this.behaviorGradeService.findAllPagSearch(+page, +limit, search);
  }


  @Get("allrange")
    findAllWithRange(
     @Query("start") startDate:string,
     @Query("end") endDate:string
    ) {
      return this.behaviorGradeService.findAllWithRange(startDate,endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.behaviorGradeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBehaviorGradeDto: UpdateBehaviorGradeDto) {
    return this.behaviorGradeService.update(+id, updateBehaviorGradeDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.behaviorGradeService.remove(+id);
  }
}
