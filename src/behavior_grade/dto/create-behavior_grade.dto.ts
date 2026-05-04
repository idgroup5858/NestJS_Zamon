import { BehaviorGradeItemDto } from "./create-behavior_grade_items.dto";

export class CreateBehaviorGradeDto {

    student_id: number;
    user_id: number;
    subject_id: number;
    overall_comment?: string;

    items: BehaviorGradeItemDto[];
}
