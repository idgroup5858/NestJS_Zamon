import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Student } from 'src/student/entities/student.entity';
import { Class } from 'src/class/entities/class.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { BasicGrade } from 'src/basic_grade/entities/basic_grade.entity';
import { BasicGradeItem } from 'src/basic_grade/entities/basic_grade_item.entity';
import { BehaviorGrade } from 'src/behavior_grade/entities/behavior_grade.entity';
import { BehaviorGradeItem } from 'src/behavior_grade/entities/behavior_grade_items.entity';

type Period = 'week' | 'month' | 'year';

// Davr bo'yicha guruhlash formatlari. SQL ga faqat shu ro'yxatdagi qiymatlar qo'yiladi
const PERIOD_FORMATS: Record<Period, string> = {
  week: '%x-W%v', // 2026-W46 (ISO hafta, dushanbadan boshlanadi)
  month: '%Y-%m', // 2026-11
  year: '%Y',     // 2026
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const DATE_PARAMS = {
  start_date: { type: 'string', description: "Boshlanish sanasi, YYYY-MM-DD (shu kun ham kiradi). Berilmasa boshidan beri olinadi." },
  end_date: { type: 'string', description: "Tugash sanasi, YYYY-MM-DD (shu kun ham kiradi). Berilmasa bugungacha olinadi." },
};

const GROUP_BY_PARAM = {
  type: 'string',
  enum: ['week', 'month', 'year'],
  description: "Natijani qaysi davr bo'yicha guruhlash: week (haftalik), month (oylik), year (yillik).",
};

// Funksiya ichidagi kutilgan xatoliklar - AI ga matn sifatida qaytariladi
class ToolError extends Error { }

const round = (value: any): number | null =>
  value === null || value === undefined ? null : Math.round(Number(value) * 100) / 100;

// AI chaqira oladigan funksiyalar. Hammasi faqat o'qiydi; to'lov, maosh, telefon raqamlarga kirish yo'q
@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(BasicGrade)
    private readonly basicGradeRepository: Repository<BasicGrade>,
    @InjectRepository(BasicGradeItem)
    private readonly basicGradeItemRepository: Repository<BasicGradeItem>,
    @InjectRepository(BehaviorGrade)
    private readonly behaviorGradeRepository: Repository<BehaviorGrade>,
    @InjectRepository(BehaviorGradeItem)
    private readonly behaviorGradeItemRepository: Repository<BehaviorGradeItem>,
  ) { }

  // Gemini'ga yuboriladigan funksiyalar tavsifi
  readonly declarations = [
    {
      name: 'search_students',
      description: "O'quvchini ismi, familiyasi, otasining ismi yoki sinfi bo'yicha qidiradi. O'quvchi haqida savol berilsa avval shu funksiya bilan uning id sini toping. Sinfdagi o'quvchilar ro'yxati uchun faqat class_name bering.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Ism va/yoki familiya, masalan 'Ali Valiyev'" },
          class_name: { type: 'string', description: "Sinf nomi yoki uning bir qismi, masalan '7-A'" },
          include_inactive: { type: 'boolean', description: "Maktabdan ketgan (faol bo'lmagan) o'quvchilar ham kerak bo'lsa true" },
        },
      },
    },
    {
      name: 'list_classes',
      description: "Barcha sinflar: id, nomi, sinf rahbari va faol o'quvchilar soni.",
    },
    {
      name: 'list_subjects',
      description: "Barcha fanlar: id va nomi.",
    },
    {
      name: 'get_student_grade_trend',
      description: "O'quvchining fanlar bo'yicha baholari dinamikasi: har bir davr (hafta/oy/yil) uchun o'rtacha, eng past, eng yuqori baho va baholar soni. O'sish yoki pasayishni ko'rish uchun ishlating.",
      parameters: {
        type: 'object',
        properties: {
          student_id: { type: 'integer', description: "O'quvchi id si" },
          group_by: GROUP_BY_PARAM,
          subject_id: { type: 'integer', description: "Faqat bitta fan kerak bo'lsa uning id si" },
          ...DATE_PARAMS,
        },
        required: ['student_id'],
      },
    },
    {
      name: 'get_student_grades',
      description: "O'quvchining batafsil baholari (eng yangisidan boshlab): sana, fan, o'qituvchi, mavzu, umumiy baho, izoh va kriteriyalar bo'yicha baholar.",
      parameters: {
        type: 'object',
        properties: {
          student_id: { type: 'integer', description: "O'quvchi id si" },
          subject_id: { type: 'integer', description: "Faqat bitta fan kerak bo'lsa uning id si" },
          limit: { type: 'integer', description: "Nechta baho kerak (standart 50, ko'pi bilan 100)" },
          ...DATE_PARAMS,
        },
        required: ['student_id'],
      },
    },
    {
      name: 'get_student_criteria_stats',
      description: "O'quvchining har bir fan ichida kriteriyalar bo'yicha o'rtacha baholari. Kuchli va zaif tomonlarini aniqlash uchun ishlating.",
      parameters: {
        type: 'object',
        properties: {
          student_id: { type: 'integer', description: "O'quvchi id si" },
          subject_id: { type: 'integer', description: "Faqat bitta fan kerak bo'lsa uning id si" },
          ...DATE_PARAMS,
        },
        required: ['student_id'],
      },
    },
    {
      name: 'get_student_behavior',
      description: "O'quvchining xulq-atvor baholari: har bir mezon (odobi, axloqi, faolligi va h.k.) bo'yicha nechta yaxshi/o'rtacha/qoniqarli olgani, davrlar bo'yicha dinamikasi va oxirgi izohlar.",
      parameters: {
        type: 'object',
        properties: {
          student_id: { type: 'integer', description: "O'quvchi id si" },
          subject_id: { type: 'integer', description: "Faqat bitta fan kerak bo'lsa uning id si" },
          group_by: GROUP_BY_PARAM,
          ...DATE_PARAMS,
        },
        required: ['student_id'],
      },
    },
    {
      name: 'get_ranking',
      description: "O'quvchilar reytingi o'rtacha baho bo'yicha (faqat faol o'quvchilar). class_id berilsa sinf ichida, berilmasa butun maktab bo'yicha. Eng yaxshi yoki eng past o'zlashtirganlarni topish uchun.",
      parameters: {
        type: 'object',
        properties: {
          class_id: { type: 'integer', description: "Sinf id si (berilmasa butun maktab)" },
          subject_id: { type: 'integer', description: "Faqat bitta fan bo'yicha reyting kerak bo'lsa uning id si" },
          order: { type: 'string', enum: ['best', 'worst'], description: "best - eng yaxshilar, worst - eng past o'zlashtirganlar" },
          limit: { type: 'integer', description: "Nechta o'quvchi (standart 10, ko'pi bilan 50)" },
          ...DATE_PARAMS,
        },
      },
    },
    {
      name: 'get_school_overview',
      description: "Butun maktab (yoki bitta sinf/fan) bo'yicha umumiy o'zlashtirish: umumiy o'rtacha baho, sinflar kesimida, fanlar kesimida. group_by berilsa fanlar bo'yicha davrlar dinamikasi ham qaytadi.",
      parameters: {
        type: 'object',
        properties: {
          class_id: { type: 'integer', description: "Faqat bitta sinf kerak bo'lsa uning id si" },
          subject_id: { type: 'integer', description: "Faqat bitta fan kerak bo'lsa uning id si" },
          group_by: GROUP_BY_PARAM,
          ...DATE_PARAMS,
        },
      },
    },
  ];

  // AI so'ragan funksiyani bajaradi. Xatolik bo'lsa ham AI tushunadigan javob qaytaradi
  async execute(name: string, args: Record<string, any> = {}): Promise<Record<string, any>> {
    this.logger.log(`AI funksiya chaqirdi: ${name} ${JSON.stringify(args)}`);
    try {
      switch (name) {
        case 'search_students': return await this.searchStudents(args);
        case 'list_classes': return await this.listClasses();
        case 'list_subjects': return await this.listSubjects();
        case 'get_student_grade_trend': return await this.getStudentGradeTrend(args);
        case 'get_student_grades': return await this.getStudentGrades(args);
        case 'get_student_criteria_stats': return await this.getStudentCriteriaStats(args);
        case 'get_student_behavior': return await this.getStudentBehavior(args);
        case 'get_ranking': return await this.getRanking(args);
        case 'get_school_overview': return await this.getSchoolOverview(args);
        default: return { error: `Noma'lum funksiya: ${name}` };
      }
    } catch (error) {
      if (error instanceof ToolError) return { error: error.message };
      this.logger.error(`AI funksiyasida xatolik (${name}): ${error.message}`);
      return { error: "Ma'lumotni olishda xatolik yuz berdi" };
    }
  }

  // ===================== FUNKSIYALAR =====================

  private async searchStudents(args: Record<string, any>) {
    const qb = this.studentRepository.createQueryBuilder('st')
      .leftJoin('st.classs', 'c')
      .select('st.id', 'id')
      .addSelect('st.first_name', 'first_name')
      .addSelect('st.last_name', 'last_name')
      .addSelect('st.father_name', 'father_name')
      .addSelect('c.id', 'class_id')
      .addSelect('c.name', 'class_name')
      .addSelect('st.active', 'active');

    // "Ali Valiyev" -> har bir so'z ism/familiya/otasining ismidan birida bo'lishi kerak
    const words = String(args.query ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 4);
    words.forEach((word, i) => {
      qb.andWhere(
        `(st.first_name LIKE :w${i} OR st.last_name LIKE :w${i} OR st.father_name LIKE :w${i})`,
        { [`w${i}`]: `%${word}%` },
      );
    });

    if (args.class_name) {
      qb.andWhere('c.name LIKE :class_name', { class_name: `%${args.class_name}%` });
    }
    if (!args.include_inactive) {
      qb.andWhere('st.active = :active', { active: true });
    }

    const LIMIT = 50;
    const rows = await qb
      .orderBy('st.last_name', 'ASC')
      .addOrderBy('st.first_name', 'ASC')
      .limit(LIMIT + 1)
      .getRawMany();

    return {
      count: Math.min(rows.length, LIMIT),
      truncated: rows.length > LIMIT,
      students: rows.slice(0, LIMIT).map((r) => ({
        id: r.id,
        full_name: `${r.last_name} ${r.first_name} ${r.father_name ?? ''}`.trim(),
        class_id: r.class_id,
        class_name: r.class_name,
        active: Boolean(Number(r.active)),
      })),
    };
  }

  private async listClasses() {
    const rows = await this.classRepository.createQueryBuilder('c')
      .leftJoin('c.users', 'u')
      .leftJoin('c.students', 'st', 'st.active = :active', { active: true })
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('u.first_name', 'teacher_first_name')
      .addSelect('u.last_name', 'teacher_last_name')
      .addSelect('COUNT(st.id)', 'students_count')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('u.id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('c.name', 'ASC')
      .getRawMany();

    return {
      classes: rows.map((r) => ({
        id: r.id,
        name: r.name,
        class_teacher: r.teacher_first_name ? `${r.teacher_first_name} ${r.teacher_last_name}` : null,
        students_count: Number(r.students_count),
      })),
    };
  }

  private async listSubjects() {
    const subjects = await this.subjectRepository.find({
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });
    return { subjects };
  }

  private async getStudentGradeTrend(args: Record<string, any>) {
    const studentId = this.toId(args.student_id, 'student_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');
    const period = this.toPeriod(args.group_by);
    const student = await this.studentBrief(studentId);

    const qb = this.basicGradeRepository.createQueryBuilder('g')
      .innerJoin('g.student', 'st')
      .innerJoin('g.subject', 'sub')
      .select('sub.id', 'subject_id')
      .addSelect('sub.name', 'subject')
      .addSelect(this.periodExpr('g.date', period), 'period_key')
      .addSelect('AVG(g.grade)', 'avg_grade')
      .addSelect('MIN(g.grade)', 'min_grade')
      .addSelect('MAX(g.grade)', 'max_grade')
      .addSelect('COUNT(g.id)', 'grades_count')
      .where('st.id = :studentId', { studentId });
    if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
    this.applyRange(qb, 'g.date', args);

    const rows = await qb
      .groupBy('sub.id')
      .addGroupBy('sub.name')
      .addGroupBy('period_key')
      .orderBy('sub.name', 'ASC')
      .addOrderBy('period_key', 'ASC')
      .getRawMany();

    const bySubject = new Map<number, { subject_id: number; subject: string; periods: any[] }>();
    for (const r of rows) {
      if (!bySubject.has(r.subject_id)) {
        bySubject.set(r.subject_id, { subject_id: r.subject_id, subject: r.subject, periods: [] });
      }
      bySubject.get(r.subject_id)!.periods.push({
        period: r.period_key,
        avg_grade: round(r.avg_grade),
        min_grade: Number(r.min_grade),
        max_grade: Number(r.max_grade),
        grades_count: Number(r.grades_count),
      });
    }

    const subjects = Array.from(bySubject.values()).map((s) => {
      const totalCount = s.periods.reduce((sum, p) => sum + p.grades_count, 0);
      const weighted = s.periods.reduce((sum, p) => sum + p.avg_grade * p.grades_count, 0);
      const first = s.periods[0];
      const last = s.periods[s.periods.length - 1];
      return {
        ...s,
        overall_avg: totalCount ? round(weighted / totalCount) : null,
        // Birinchi davrdan oxirgi davrgacha o'rtacha baho qanchaga o'zgargani (+ o'sish, - pasayish)
        change_first_to_last: s.periods.length > 1 ? round(last.avg_grade - first.avg_grade) : null,
      };
    });

    return { student, group_by: period, range: this.rangeEcho(args), subjects };
  }

  private async getStudentGrades(args: Record<string, any>) {
    const studentId = this.toId(args.student_id, 'student_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');
    const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
    const student = await this.studentBrief(studentId);

    const qb = this.basicGradeRepository.createQueryBuilder('g')
      .innerJoin('g.student', 'st')
      .leftJoinAndSelect('g.subject', 'sub')
      .leftJoin('g.user', 'u')
      .addSelect(['u.id', 'u.first_name', 'u.last_name']) // parol va boshqa ma'lumotlar olinmaydi
      .leftJoinAndSelect('g.items', 'i')
      .leftJoinAndSelect('i.criterion', 'cr')
      .where('st.id = :studentId', { studentId });
    if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
    this.applyRange(qb, 'g.date', args);

    const [grades, total] = await qb
      .orderBy('g.date', 'DESC')
      .take(limit)
      .getManyAndCount();

    return {
      student,
      range: this.rangeEcho(args),
      total,
      returned: grades.length,
      grades: grades.map((g) => ({
        date: this.formatDate(g.date),
        subject: g.subject?.name ?? null,
        teacher: g.user ? `${g.user.first_name} ${g.user.last_name}` : null,
        theme: g.theme,
        grade: g.grade,
        comment: g.comment || null,
        criteria: (g.items ?? []).map((i) => ({
          name: i.criterion?.name ?? "o'chirilgan kriteriya",
          grade: i.grade,
          comment: i.comment || null,
        })),
      })),
    };
  }

  private async getStudentCriteriaStats(args: Record<string, any>) {
    const studentId = this.toId(args.student_id, 'student_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');
    const student = await this.studentBrief(studentId);

    const qb = this.basicGradeItemRepository.createQueryBuilder('i')
      .innerJoin('i.basicGrade', 'g')
      .innerJoin('g.student', 'st')
      .innerJoin('g.subject', 'sub')
      .leftJoin('i.criterion', 'cr')
      .select('sub.name', 'subject')
      .addSelect('cr.name', 'criterion')
      .addSelect('AVG(i.grade)', 'avg_grade')
      .addSelect('MIN(i.grade)', 'min_grade')
      .addSelect('MAX(i.grade)', 'max_grade')
      .addSelect('COUNT(i.id)', 'grades_count')
      .where('st.id = :studentId', { studentId });
    if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
    this.applyRange(qb, 'g.date', args);

    const rows = await qb
      .groupBy('sub.id')
      .addGroupBy('sub.name')
      .addGroupBy('cr.id')
      .addGroupBy('cr.name')
      .orderBy('sub.name', 'ASC')
      .addOrderBy('avg_grade', 'DESC')
      .getRawMany();

    return {
      student,
      range: this.rangeEcho(args),
      criteria: rows.map((r) => ({
        subject: r.subject,
        criterion: r.criterion ?? "o'chirilgan kriteriya",
        avg_grade: round(r.avg_grade),
        min_grade: Number(r.min_grade),
        max_grade: Number(r.max_grade),
        grades_count: Number(r.grades_count),
      })),
    };
  }

  private async getStudentBehavior(args: Record<string, any>) {
    const studentId = this.toId(args.student_id, 'student_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');
    const student = await this.studentBrief(studentId);

    const itemsQuery = () => {
      const qb = this.behaviorGradeItemRepository.createQueryBuilder('i')
        .innerJoin('i.behaviorGrade', 'bg')
        .innerJoin('bg.student', 'st')
        .innerJoin('bg.subject', 'sub')
        .where('st.id = :studentId', { studentId });
      if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
      this.applyRange(qb, 'bg.date', args);
      return qb;
    };

    // Har bir mezon bo'yicha qaysi bahodan nechta
    const distRows = await itemsQuery()
      .select('i.criteria_type', 'criteria_type')
      .addSelect('i.grade', 'grade')
      .addSelect('COUNT(i.id)', 'grades_count')
      .groupBy('i.criteria_type')
      .addGroupBy('i.grade')
      .orderBy('i.criteria_type', 'ASC')
      .getRawMany();

    const byCriteria = new Map<string, Record<string, number>>();
    for (const r of distRows) {
      const grades = byCriteria.get(r.criteria_type) ?? {};
      grades[r.grade] = Number(r.grades_count);
      byCriteria.set(r.criteria_type, grades);
    }

    // Davrlar bo'yicha dinamika (faqat group_by berilsa)
    let by_period: any[] | undefined;
    if (args.group_by) {
      const period = this.toPeriod(args.group_by);
      const periodRows = await itemsQuery()
        .select(this.periodExpr('bg.date', period), 'period_key')
        .addSelect('i.grade', 'grade')
        .addSelect('COUNT(i.id)', 'grades_count')
        .groupBy('period_key')
        .addGroupBy('i.grade')
        .orderBy('period_key', 'ASC')
        .getRawMany();

      const byPeriod = new Map<string, Record<string, number>>();
      for (const r of periodRows) {
        const grades = byPeriod.get(r.period_key) ?? {};
        grades[r.grade] = Number(r.grades_count);
        byPeriod.set(r.period_key, grades);
      }
      by_period = Array.from(byPeriod.entries()).map(([p, grades]) => ({ period: p, grades }));
    }

    // Oxirgi 10 ta xulq-atvor bahosi izohlari bilan
    const recentQuery = this.behaviorGradeRepository.createQueryBuilder('bg')
      .innerJoin('bg.student', 'st')
      .leftJoinAndSelect('bg.subject', 'sub')
      .leftJoinAndSelect('bg.items', 'i')
      .where('st.id = :studentId', { studentId });
    if (subjectId) recentQuery.andWhere('sub.id = :subjectId', { subjectId });
    this.applyRange(recentQuery, 'bg.date', args);

    const [recent, total] = await recentQuery
      .orderBy('bg.date', 'DESC')
      .take(10)
      .getManyAndCount();

    return {
      student,
      range: this.rangeEcho(args),
      total_records: total,
      distribution: Array.from(byCriteria.entries()).map(([criteria_type, grades]) => ({ criteria_type, grades })),
      ...(by_period ? { by_period } : {}),
      recent: recent.map((bg) => ({
        date: this.formatDate(bg.date),
        subject: bg.subject?.name ?? null,
        overall_comment: bg.overall_comment || null,
        items: (bg.items ?? []).map((i) => ({
          criteria_type: i.criteria_type,
          grade: i.grade,
          comment: i.comment || null,
        })),
      })),
    };
  }

  private async getRanking(args: Record<string, any>) {
    const classId = this.optionalId(args.class_id, 'class_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');
    const order = args.order === 'worst' ? 'ASC' : 'DESC';
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);

    const qb = this.basicGradeRepository.createQueryBuilder('g')
      .innerJoin('g.student', 'st')
      .innerJoin('g.subject', 'sub')
      .leftJoin('st.classs', 'c')
      .select('st.id', 'student_id')
      .addSelect('st.first_name', 'first_name')
      .addSelect('st.last_name', 'last_name')
      .addSelect('c.name', 'class_name')
      .addSelect('AVG(g.grade)', 'avg_grade')
      .addSelect('COUNT(g.id)', 'grades_count')
      .where('st.active = :active', { active: true });
    if (classId) qb.andWhere('c.id = :classId', { classId });
    if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
    this.applyRange(qb, 'g.date', args);

    const rows = await qb
      .groupBy('st.id')
      .addGroupBy('st.first_name')
      .addGroupBy('st.last_name')
      .addGroupBy('c.name')
      .orderBy('avg_grade', order)
      .addOrderBy('grades_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return {
      filter: { class_id: classId ?? null, subject_id: subjectId ?? null, order: order === 'DESC' ? 'best' : 'worst' },
      range: this.rangeEcho(args),
      students: rows.map((r, index) => ({
        place: index + 1,
        student_id: r.student_id,
        full_name: `${r.last_name} ${r.first_name}`,
        class_name: r.class_name,
        avg_grade: round(r.avg_grade),
        grades_count: Number(r.grades_count),
      })),
    };
  }

  private async getSchoolOverview(args: Record<string, any>) {
    const classId = this.optionalId(args.class_id, 'class_id');
    const subjectId = this.optionalId(args.subject_id, 'subject_id');

    const gradesQuery = () => {
      const qb = this.basicGradeRepository.createQueryBuilder('g')
        .innerJoin('g.student', 'st')
        .innerJoin('g.subject', 'sub')
        .leftJoin('st.classs', 'c');
      if (classId) qb.andWhere('c.id = :classId', { classId });
      if (subjectId) qb.andWhere('sub.id = :subjectId', { subjectId });
      this.applyRange(qb, 'g.date', args);
      return qb;
    };

    const overall = await gradesQuery()
      .select('AVG(g.grade)', 'avg_grade')
      .addSelect('COUNT(g.id)', 'grades_count')
      .addSelect('COUNT(DISTINCT st.id)', 'students_count')
      .getRawOne();

    const byClass = await gradesQuery()
      .select('c.id', 'class_id')
      .addSelect('c.name', 'class_name')
      .addSelect('AVG(g.grade)', 'avg_grade')
      .addSelect('COUNT(g.id)', 'grades_count')
      .addSelect('COUNT(DISTINCT st.id)', 'students_count')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('avg_grade', 'DESC')
      .getRawMany();

    const bySubject = await gradesQuery()
      .select('sub.id', 'subject_id')
      .addSelect('sub.name', 'subject')
      .addSelect('AVG(g.grade)', 'avg_grade')
      .addSelect('COUNT(g.id)', 'grades_count')
      .groupBy('sub.id')
      .addGroupBy('sub.name')
      .orderBy('avg_grade', 'DESC')
      .getRawMany();

    // Fanlar bo'yicha davrlar dinamikasi (faqat group_by berilsa)
    let trend: any[] | undefined;
    let trendTruncated = false;
    if (args.group_by) {
      const period = this.toPeriod(args.group_by);
      const TREND_LIMIT = 500;
      const trendRows = await gradesQuery()
        .select(this.periodExpr('g.date', period), 'period_key')
        .addSelect('sub.name', 'subject')
        .addSelect('AVG(g.grade)', 'avg_grade')
        .addSelect('COUNT(g.id)', 'grades_count')
        .groupBy('period_key')
        .addGroupBy('sub.id')
        .addGroupBy('sub.name')
        .orderBy('period_key', 'ASC')
        .addOrderBy('sub.name', 'ASC')
        .limit(TREND_LIMIT + 1)
        .getRawMany();

      trendTruncated = trendRows.length > TREND_LIMIT;
      trend = trendRows.slice(0, TREND_LIMIT).map((r) => ({
        period: r.period_key,
        subject: r.subject,
        avg_grade: round(r.avg_grade),
        grades_count: Number(r.grades_count),
      }));
    }

    return {
      filter: { class_id: classId ?? null, subject_id: subjectId ?? null },
      range: this.rangeEcho(args),
      overall: {
        avg_grade: round(overall?.avg_grade),
        grades_count: Number(overall?.grades_count ?? 0),
        students_count: Number(overall?.students_count ?? 0),
      },
      by_class: byClass.map((r) => ({
        class_id: r.class_id,
        class_name: r.class_name ?? 'Sinfsiz',
        avg_grade: round(r.avg_grade),
        grades_count: Number(r.grades_count),
        students_count: Number(r.students_count),
      })),
      by_subject: bySubject.map((r) => ({
        subject_id: r.subject_id,
        subject: r.subject,
        avg_grade: round(r.avg_grade),
        grades_count: Number(r.grades_count),
      })),
      ...(trend ? { trend, trend_truncated: trendTruncated } : {}),
    };
  }

  // ===================== YORDAMCHI =====================

  private async studentBrief(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { classs: true },
    });
    if (!student) throw new ToolError(`#${id} raqamli o'quvchi topilmadi`);
    return {
      id: student.id,
      full_name: `${student.last_name} ${student.first_name} ${student.father_name ?? ''}`.trim(),
      class_name: student.classs?.name ?? null,
      active: student.active,
    };
  }

  private toId(value: any, field: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new ToolError(`${field} noto'g'ri yoki berilmagan`);
    return id;
  }

  private optionalId(value: any, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return this.toId(value, field);
  }

  private toPeriod(value: any): Period {
    return value === 'week' || value === 'year' ? value : 'month';
  }

  private periodExpr(column: string, period: Period): string {
    return `DATE_FORMAT(${column}, '${PERIOD_FORMATS[period]}')`;
  }

  // Sana oralig'i: kunlar to'liq kiradi (00:00:00 dan 23:59:59 gacha)
  private applyRange(qb: SelectQueryBuilder<any>, column: string, args: Record<string, any>) {
    const { start_date, end_date } = args;
    if (start_date) {
      if (!DATE_RE.test(start_date)) throw new ToolError("start_date YYYY-MM-DD formatida bo'lishi kerak");
      qb.andWhere(`${column} >= :start_date`, { start_date: `${start_date} 00:00:00` });
    }
    if (end_date) {
      if (!DATE_RE.test(end_date)) throw new ToolError("end_date YYYY-MM-DD formatida bo'lishi kerak");
      qb.andWhere(`${column} <= :end_date`, { end_date: `${end_date} 23:59:59.999` });
    }
  }

  private rangeEcho(args: Record<string, any>) {
    return { start_date: args.start_date || null, end_date: args.end_date || null };
  }

  private formatDate(value: Date | string): string {
    if (typeof value === 'string') return value.slice(0, 10);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
}
