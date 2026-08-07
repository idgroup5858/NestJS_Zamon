import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { BasicGradeService } from 'src/basic_grade/basic_grade.service';
import { ClassService } from 'src/class/class.service';
import { StudentService } from 'src/student/student.service';
import { SubjectService } from 'src/subject/subject.service';







@Injectable()
export class TelegramService implements OnModuleInit {
    public bot: TelegramBot;
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly classService: ClassService,
        private readonly studentService: StudentService,
        private readonly subjectService: SubjectService,
        private readonly basicGradeService: BasicGradeService
    ) { }

    onModuleInit() {
        const token = this.configService.get<string>('BOT_TOKEN');
        if (!token) {
            throw new Error('BOT_TOKEN is not defined in .env file');
        }

        // Botni polling rejimida ishga tushiramiz
        this.bot = new TelegramBot(token, { polling: true });

       

        // Event listener-larni bog'laymiz
        this.initializeBotListeners();

        this.logger.log('Telegram bot toza node-telegram-bot-api-da muvaffaqiyatli start bo‘ldi 🚀');
    }

    async goMessage(chatId:string|number,message:string){
         try {
        await this.bot.sendMessage(chatId, message);
    } catch (error: any) {
        this.logger.error(`Xabar yuborishda xatolik (ChatID: ${chatId}): ${error.message}`);
    }
    }

    private initializeBotListeners() {
        // 1. /start buyrug'i
        this.bot.onText(/\/start/, async (msg) => {
            await this.sendMainMenu(msg.chat.id);
        });

        // 2. /help buyrug'i
        this.bot.onText(/\/help/, async (msg) => {
            await this.bot.sendMessage(msg.chat.id, 'Yordam bo‘limi.');
        });

        // 3. Kontakt (Telefon raqam) yuborilganda eshitish
        this.bot.on('contact', async (msg) => {
            await this.handleContact(msg);
        });

        // 4. Barcha matnli xabarlarni markaziy boshqarish (Telegraf-dagi @Hears va @On('text') o'rniga)
        this.bot.on('message', async (msg) => {
            // Agar xabar buyruq bo'lsa (masalan /start) yoki kontakt bo'lsa, bu yerda ishlamaydi
            if (!msg.text || msg.text.startsWith('/')) return;

            await this.handleTextMessage(msg);
        });
    }

    // Asosiy menyuni chiqarish funksiyasi
    private async sendMainMenu(chatId: number) {
        await this.bot.sendMessage(chatId, "Salom! Kerakli bo'limni tanlang:", {
            reply_markup: {
                keyboard: [
                    [{ text: '👤 Profil' }, { text: '📊 Baholar' }],
                    [{ text: "📱 Royhatdan o'tish", request_contact: true }]
                ],
                resize_keyboard: true
            }
        });
    }

    // Matnli xabarlarni tahlil qilish (Main Router)
    private async handleTextMessage(msg: any) {
        const chatId = msg.chat.id;
        const text = msg.text;

        switch (text) {
            case '👤 Profil':
                await this.bot.sendMessage(chatId, `👤 Profilingiz:\n\nIsm: ${msg.from?.first_name}\nID: ${chatId}`);
                break;

            case '📊 Baholar':
                await this.handleGradesMenu(chatId);
                break;

            case '⬅️ Orqaga':
                await this.bot.sendMessage(chatId, 'Asosiy menyu', {
                    reply_markup: {
                        keyboard: [
                            [{ text: '👤 Profil' }, { text: '📊 Baholar' }],
                            [{ text: "📱 Royhatdan o'tish", request_contact: true }]
                        ],
                        resize_keyboard: true
                    }
                });
                break;

            case '📦 Buyurtmalar':
                await this.bot.sendMessage(chatId, '📦 Buyurtmalar ro‘yxati bo‘sh.');
                break;

            case '📚 Fanlar':
                await this.bot.sendMessage(chatId, '📚 Siz o‘qiydigan fanlar ro‘yxati...');
                break;

            case '🏫 Sinf':
                await this.handleClassList(chatId);
                break;

            case 'ℹ️ Yordam':
                await this.bot.sendMessage(chatId, 'ℹ️ Savollar bo‘lsa @admin ga murojaat qiling.');
                break;

            default:
                // Agar bosilgan matn biron bir fanning nomi bo'lsa (Dinamik tekshirish)
                await this.handleSubjectSelection(chatId, text);
                break;
        }
    }

    // Fanlar tugmalarini chiqarish (📊 Baholar bosilganda)
    private async handleGradesMenu(chatId: number) {
        const subjects = await this.subjectService.findAll();

        // Telegraf map-iga o'xshash tugmalar massivini shakllantiramiz
        const keyboard = subjects.map(subject => [{ text: subject.name }]);
        keyboard.push([{ text: '⬅️ Orqaga' }]);

        await this.bot.sendMessage(chatId, 'Fanni tanlang:', {
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true
            }
        });
    }

    // Fan tanlanganda uning haftalik hisobotini chiqarish
    private async handleSubjectSelection(chatId: number, subjectName: string) {
        const data = await this.basicGradeService.findLastWeekBySubject(
            String(chatId),
            subjectName
        );

        if (!data || !data.length) {
            // Agar bu matn fan ham bo'lmasa, default javob qaytaradi
            const subjects = await this.subjectService.findAll();
            const isSubject = subjects.some(s => s.name === subjectName);

            if (isSubject) {
                await this.bot.sendMessage(chatId, 'Bu fan bo‘yicha ma’lumot topilmadi.');
            } else {
                await this.bot.sendMessage(chatId, `Noma'lum buyruq: ${subjectName}`);
            }
            return;
        }

        const student = data[0].student;
        let text = `📊 ${subjectName} - Haftalik hisobot\n\n`;
        text += `👤 O‘quvchi: ${student.first_name} ${student.last_name}\n\n`;

        let total = 0;

        data.forEach((item, i) => {
            total += item.grade;
            text += `📅 ${i + 1}. ${new Date(item.date).toLocaleDateString()}\n`;
            text += `📘 Mavzu: ${item.theme}\n`;
            text += `⭐ Umumiy baho: ${item.grade}\n`;

            if (item.items?.length) {
                text += `📌 Kriteriyalar:\n`;
                item.items.forEach((it: any) => {
                    text += `   🧠 ${it.criterion?.name || '-'}: ${it.grade}\n`;
                    if (it.comment) {
                        text += `      📝 ${it.comment}\n`;
                    }
                });
            }
            text += `📝 Umumiy izoh: ${item.comment || '-'}\n\n`;
        });

        const avg = total / data.length;
        text += `📊 O‘rtacha baho: ${avg.toFixed(1)}\n`;

        await this.bot.sendMessage(chatId, text);
    }

    // Sinf ro'yxatini shakllantirish (🏫 Sinf)
    private async handleClassList(chatId: number) {
        const classes = await this.classService.findAll();

        if (!classes || classes.length === 0) {
            await this.bot.sendMessage(chatId, "Hozircha hech qanday sinf topilmadi.");
            return;
        }

        let response = "🏫 Mavjud sinflar ro'yxati:\n\n";
        classes.forEach((c, index) => {
            response += `${index + 1}. ${c.name || 'Nomsiz sinf'} O'quvchilar soni: ${c.students?.length || 0}\n`;
        });

        await this.bot.sendMessage(chatId, response);
    }

    // Kontakt qabul qilib, foydalanuvchini bazaga bog'lash
    private async handleContact(msg: any) {
        const chatId = msg.chat.id;
        const contact = msg.contact;

        if (!contact) return;

        const phone = contact.phone_number;
        const telegram_chat_id = String(msg.from?.id);

        const student = await this.studentService.findByPhone(phone);

        if (!student) {
            await this.bot.sendMessage(chatId, "❌ Bu raqam bazada topilmadi.");
            return;
        }

        await this.studentService.update(student.id, { telegram_chat_id });
        await this.bot.sendMessage(chatId, `${student.first_name} ✅ Telegram account muvaffaqiyatli bog'landi.`);
    }
}
