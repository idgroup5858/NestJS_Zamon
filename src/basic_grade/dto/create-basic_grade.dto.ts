import { BasicGradeItem } from "../entities/basic_grade_item.entity";

export class CreateBasicGradeDto {


    user_id:number;
    student_id:number;
    subject_id:number;
    theme:string;
    items:CreateBasicGradeItemDto[];
    grade:number;
    comment:string;

}

export class CreateBasicGradeItemDto {
  criterion_id: number;
  grade: number;
  comment?: string;
}
