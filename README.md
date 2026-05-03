


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
