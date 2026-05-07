import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post("add")
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }


  @Get("getfull")
  findAllPagSearch(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("search") search: string
  ) {
    return this.studentService.findAllPagSearch(+page, +limit, search);
  }

  @Get("getall")
  findAll() {
    return this.studentService.findAll();
  }
  @Get('getby/:id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(+id);
  }


  @Get('getbyphone')
  findOneByPhone(
    @Query("phone") phone: string,
  ) {
    return this.studentService.findByPhone(phone);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(+id, updateStudentDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(+id);
  }


  
  @Post('movestudent/:studentId/:classsId')
  assignTeacher(
    @Param('studentId') studentId: string,
    @Param('classsId') classsId: string
  ) {
    return this.studentService.moveStudent(+studentId, +classsId);
  }
}
