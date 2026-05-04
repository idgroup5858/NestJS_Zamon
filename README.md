


                npm install @nestjs/typeorm typeorm mysql2
                npm install class-validator class-transformer
                npm install @nestjs/jwt bcrypt
                npm install @types/bcrypt --save-dev
                npm install @nestjs/config


                for payload token

                npm install @nestjs/passport passport passport-jwt @nestjs/jwt
                npm install -D @types/passport-jwt

                from mac
                STUDENT (1) ──────── (N) BASIC_GRADE
                TEACHER (1) ──────── (N) BASIC_GRADE
                SUBJECT (1) ──────── (N) BASIC_GRADE

                | Entity     | Relation               |
                | ---------- | ---------------------- |
                | Student    | OneToMany → BasicGrade |
                | Teacher    | OneToMany → BasicGrade |
                | Subject    | OneToMany → BasicGrade |
                | BasicGrade | ManyToOne → hammasiga  |


                @OneToMany(() => BehaviorGradeItem, item => item.behaviorGrade)
                items: BehaviorGradeItem[];


                @ManyToOne(() => BehaviorGrade, bg => bg.items)
                behaviorGrade: BehaviorGrade;

                {
                    "student_id": 25,
                    "teacher_id": 3,
                    "subject_id": 1,
                    "date": "2026-05-04",
                    "overall_comment": "Umuman yaxshi",
                    "items": [
                        {
                        "criteria_type": "odobi",
                        "grade": "yaxshi",
                        "comment": "Juda hurmatli"
                        },
                        {
                        "criteria_type": "axloqi",
                        "grade": "ortacha",
                        "comment": "Ba’zan shovqin"
                        },
                        {
                        "criteria_type": "faolligi",
                        "grade": "yaxshi",
                        "comment": "Aktiv"
                        },
                        {
                        "criteria_type": "munosabati",
                        "grade": "qoniqarli",
                        "comment": "O‘rtacha"
                        }
                    ]
                }

                async create(dto: CreateBehaviorGradeDto) {
                        const { student_id, teacher_id, subject_id, overall_comment, items } = dto;

                        // 1. validation
                        if (!items || items.length === 0) {
                            throw new BadRequestException('Items required');
                        }

                        const student = await this.studentService.findOne(student_id);
                        if (!student) throw new NotFoundException('Student not found');

                        const teacher = await this.userService.findOne(teacher_id);
                        if (!teacher) throw new NotFoundException('Teacher not found');

                        const subject = await this.subjectService.findOne(subject_id);
                        if (!subject) throw new NotFoundException('Subject not found');

                        // 2. TRANSACTION
                        return await this.dataSource.transaction(async (manager) => {

                            // 3. BehaviorGrade
                            const behaviorGrade = manager.create(BehaviorGrade, {
                            student,
                            teacher,
                            subject,
                            overall_comment,
                            });

                            const savedGrade = await manager.save(behaviorGrade);

                            // 4. Items
                            const behaviorItems = items.map(item =>
                            manager.create(BehaviorGradeItem, {
                                behaviorGrade: savedGrade,
                                criteria_type: item.criteria_type,
                                grade: item.grade,
                                comment: item.comment,
                            })
                            );

                            await manager.save(behaviorItems);

                            // 5. return
                            return {
                            ...savedGrade,
                            items: behaviorItems,
                            };
                        });
                        }




                        async update(id: number, dto: UpdateBehaviorGradeDto) {

                            const { student_id, teacher_id, subject_id, overall_comment, items } = dto;

                            // 1. eski BehaviorGrade ni topamiz
                            const existing = await this.behaviorGradeRepository.findOne({
                                where: { id },
                                relations: ['items']
                            });

                            if (!existing) throw new NotFoundException('Not found');

                            // 2. relationlarni tekshirish (agar kelgan bo‘lsa)
                            let student = existing.student;
                            let teacher = existing.teacher;
                            let subject = existing.subject;

                            if (student_id) {
                                student = await this.studentService.findOne(student_id);
                            }

                            if (teacher_id) {
                                teacher = await this.userService.findOne(teacher_id);
                            }

                            if (subject_id) {
                                subject = await this.subjectService.findOne(subject_id);
                            }

                            // 3. TRANSACTION
                            return await this.dataSource.transaction(async (manager) => {

                                // 4. BehaviorGrade update
                                existing.student = student;
                                existing.teacher = teacher;
                                existing.subject = subject;
                                existing.overall_comment = overall_comment ?? existing.overall_comment;

                                const updatedGrade = await manager.save(existing);

                                // 5. AGAR items kelsa → eski itemsni o‘chiramiz
                                if (items) {

                                // eski itemsni delete qilamiz
                                await manager.delete(BehaviorGradeItem, {
                                    behaviorGrade: { id }
                                });

                                // yangi items
                                const newItems = items.map(item =>
                                    manager.create(BehaviorGradeItem, {
                                    behaviorGrade: updatedGrade,
                                    criteria_type: item.criteria_type,
                                    grade: item.grade,
                                    comment: item.comment,
                                    })
                                );

                                await manager.save(newItems);

                                return {
                                    ...updatedGrade,
                                    items: newItems,
                                };
                                }

                                return updatedGrade;
                            });
                            }
