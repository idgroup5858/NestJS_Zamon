import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  @Post("add")
  create(@Body() createClassDto: CreateClassDto) {
    return this.classService.create(createClassDto);
  }


  @Get("getfull")
  findAllPagSearch(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("search") search: string
  ) {
    return this.classService.findAllPagSearch(+page, +limit, search);
  }

  @Get("getall")
  findAll() {
    return this.classService.findAll();
  }
  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.classService.findOne(+id);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classService.update(+id, updateClassDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.classService.remove(+id);
  }


  @Post('adduser/:userId/:classsId')
  assignTeacher(
    @Param('userId') userIdxyz: string,
    @Param('classsId') classsId: string
  ) {
    return this.classService.assignTeacher(+userIdxyz, +classsId);
  }

  @Post('removeuser/:classsId/')
  removeTeacher(
    @Param('classsId') classsId: string,
    
  ) {
    return this.classService.removeTeacher(+classsId);
  }
}
