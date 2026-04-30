import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { SubjectService } from 'src/subject/subject.service';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly subjectService: SubjectService
  ) { }

  async create(createUserDto: CreateUserDto) {
    const checkUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (checkUser) throw new ConflictException("User already exists");
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword
    });

    const isPasswordValid = await bcrypt.compare(createUserDto.password, hashedPassword,);
    console.log(isPasswordValid);

    await this.userRepository.save(user);
    return user;
  }


  //AUTH
  async login(loginDto: LoginDto) {

    const user = await this.userRepository.findOneBy({
      email: loginDto.email,
    });

    if (!user) throw new NotFoundException("User not found");


    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) throw new NotFoundException("Invalid password");

    const accessTokenPayload = {
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      tokenType: 'access',
    };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '15d',
    });

    //Generate refresh token
    const refreshTokenPayload = {
      id: user.id,
      first_name: user.first_name,
      email: user.email,
      tokenType: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '30d',
    });



    return {
      user,
      accessToken,
      exspiresIn_accessToken: "15d",
      refreshToken,
      exspiresIn_refreshToken: "30d",
    };




  }

  async findAll() {
    return this.userRepository.find({
      relations:["subjects","classs"]
    });
  }


  async findAllPagSearch(page: number, limit: number, search?: string) {
    page = page > 0 ? page : 1;
    limit = limit > 0 ? limit : 10;

    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder('user')
    .leftJoinAndSelect('user.subjects', 'subjects')
    .leftJoinAndSelect('user.classs', 'classs')
    // .leftJoinAndSelect('sale.items', 'items')
    // .leftJoinAndSelect('sale.payments', 'payments')
    // .leftJoinAndSelect('sale.user', 'user')
    // .leftJoinAndSelect('items.warehouse', 'warehouse')
    // .leftJoinAndSelect('items.product', 'product')
    // .leftJoinAndSelect('sale.customer', 'customer');


    if (search) {
      query.where(
        'user.first_name LIKE :search OR user.last_name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('user.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  }


  async findOne(id: number) {
    const checkUser = await this.userRepository.findOne(
      {
        where: { id: id },
        relations:["subjects","classs"]   
      });
    if (!checkUser) throw new NotFoundException("User not found");

    return checkUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const checkUser = await this.userRepository.findOneBy({ id });
    if (!checkUser) throw new NotFoundException("User not found");

    let hashedPassword = checkUser.password;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
      password: hashedPassword
    });

    if (!user) throw new NotFoundException()

    await this.userRepository.save(user)

    return user;
  }

  async remove(id: number) {
    const checkUser = await this.userRepository.findOneBy({ id });
    if (!checkUser) throw new NotFoundException("User not found");
    await this.userRepository.remove(checkUser);
    return { message: "User deleted" };
  }

  verifyToken(token: string) {
    try {
      const tokenVerify = this.jwtService.verify<JwtPayload>(token);
      const expDate = new Date(Number(tokenVerify.exp) * 1000); //milli second

      const remainingTime = (expDate.getTime() - new Date().getTime()); //ms
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      //expDate millisecondga o`tkazilib keyin tekshirildi
      if (expDate < new Date()) {
        return { message: "Token expired", date: new Date().toLocaleString() };
      }
      return {
        expDate: expDate.toLocaleString("uz-UZ"),
        dateNow: new Date().toLocaleString("uz-UZ"),
        remainingTime: `${hours}:${minutes}:${seconds}`,
        id: tokenVerify.id,
        username: tokenVerify.username,
        email: tokenVerify.email,
        tokenType: tokenVerify.tokenType
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async refreshToken(token: string) {

    try {
      //const refreshTokenVerify = this.jwtService.verify<JwtPayload>(token);
      const refreshTokenVerify = await this.jwtService.verifyAsync<JwtPayload>(token);
      if (new Date(Number(Number(refreshTokenVerify.exp) * 1000)) < new Date()) {
        console.log(true);
      }

      if (refreshTokenVerify.tokenType !== "refresh") {
        throw new UnauthorizedException(); //return {message:"Only refresh token required"}
      }

      const accessTokenPayload = {
        id: refreshTokenVerify.id,
        username: refreshTokenVerify.username,
        email: refreshTokenVerify.email,
        tokenType: 'access',
      };
      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: '15d',
      });


      // const refreshTokenPayload = {
      //   id: refreshTokenVerify.id,
      //   username: refreshTokenVerify.username,
      //   email: refreshTokenVerify.email,
      //   tokenType: 'refresh',
      // };
      // const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      //   expiresIn: '30d',
      // });




      return { accessToken }
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }


  async addSubject(userId: number, subjectId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subjects'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subject = await this.subjectService.findOne(subjectId)

    const exists = user.subjects.some(s => s.id === subjectId);
    

    if (!exists) {
      user.subjects.push(subject);
      await this.userRepository.save(user);
    }else{
      
    }

    return user;
  }

  async removeSubject(userId: number, subjectId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subjects'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const subject = await this.subjectService.findOne(subjectId)

    user.subjects = user.subjects.filter(
      (subject) => subject.id !== subjectId,
    );

    return this.userRepository.save(user);
  }







}




export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  tokenType: string;

  // iat, exp optional
  iat?: number;
  exp?: number;
}


/*


async addSubjects(userId: number, dto: AddSubjectsDto) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['subjects'],
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const subjects = await this.subjectRepository.findBy({
    id: In(dto.subject_ids),
  });

  // eski + yangi merge
  const merged = [...user.subjects, ...subjects];

  // duplicate yo‘qotish
  const map = new Map();
  merged.forEach(s => map.set(s.id, s));

  user.subjects = Array.from(map.values());

  return this.userRepository.save(user);
}

*/



/*

// CREATE / WRITE
const userEntity = repository.create(dto);          // DTO -> Entity mapping qiladi, DB ga yozmaydi
await repository.save(userEntity);                  // Insert yoki update qiladi, DB ga yozadi
await repository.insert(dto);                       // Tez insert, lifecycle hook ishlamaydi
await repository.update(id, dto);                  // ID yoki condition bo‘yicha update
await repository.upsert(dto, ['email']);           // Insert yoki update (Postgres/MySQL 8+)
const preloadedUser = await repository.preload({ id, ...dto }); // Update qilish uchun entityni tayyorlaydi
repository.merge(userEntity, dto);                 // Entity ustiga fieldlarni qo‘shadi

// READ / TEKSHIRISH
const oneUserByEmail = await repository.findOneBy({ email: dto.email });                // Shart bo‘yicha 1ta entity faqat where
const oneUserWithRelations = await repository.findOne({ where: { email: dto.email }, relations: ['posts'] }); // Filter + relations bilan 1ta entity
const activeUsers = await repository.findBy({ isActive: true });                        // Filter bilan list
const allUsers = await repository.find();                                               // Hammasini list bilan
const emailExists = await repository.exist({ where: { email: dto.email } });           // Boolean qaytaradi, faqat bor-yo‘qligini tekshiradi
const adminCount = await repository.countBy({ role: 'admin' });                        // Filter bilan count
const totalCount = await repository.count();                                           // Hammasini count

// DELETE / O‘CHIRISH
await repository.delete(id);          // ID yoki condition bo‘yicha o‘chiradi
await repository.softDelete(id);      // DeletedAt bilan o‘chiradi
await repository.restore(id);         // Soft deleted entity ni tiklaydi
await repository.clear();             // Hammasini o‘chiradi

// RAW QUERY / TRANSACTION
const rawUsers = await repository.query('SELECT * FROM user'); // Raw SQL query ishlatish
await repository.manager.save(userEntity);                     // Transaction ichida ishlash

*/