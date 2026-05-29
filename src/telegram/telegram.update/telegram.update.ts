import { Update, Start, Help, On, Ctx, Hears } from 'nestjs-telegraf';
import { BasicGradeService } from 'src/basic_grade/basic_grade.service';
import { ClassService } from 'src/class/class.service';
import { StudentService } from 'src/student/student.service';
import { SubjectService } from 'src/subject/subject.service';
import { Context, Markup } from 'telegraf';

@Update()
export class TelegramUpdate {


    constructor(
        private readonly classService: ClassService,
        private readonly studentService: StudentService,
        private readonly subjectService: SubjectService,
        private readonly basicGradeService: BasicGradeService

    ) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        await ctx.reply(
            `Salom! Kerakli bo'limni tanlang:`,
            Markup.keyboard([
                ['👤 Profil', "📊 Baholar"],
                [
                    Markup.button.contactRequest("📱 Royhatdan o'tish")
                ]
            ]).resize()
        );
    }

    @Hears('📊 Baholar')
    async subjects(@Ctx() ctx: Context) {
        const subjects = await this.subjectService.findAll();

        const buttons = subjects.map(subject => [subject.name]);

        buttons.push(['⬅️ Orqaga']);

        await ctx.reply(
            'Fanni tanlang:',
            Markup.keyboard(buttons).resize()
        );
    }

    @Hears(/.+/)
    async onSubjectSelect(@Ctx() ctx: Context) {
        const msg = ctx.message as any;
        const subjectName = msg?.text;

        if (!subjectName) return;

        if (subjectName === '⬅️ Orqaga') {
            ctx.reply(
                'Menu',
                Markup.keyboard([['📊 Baholar']]).resize()
            );
            return;
        }

        const chatId = ctx.from?.id;
        if (!chatId) return;

        const data = await this.basicGradeService.findLastWeekBySubject(
            String(chatId),
            subjectName,
        );

        if (!data.length) {
            ctx.reply('Bu fan bo‘yicha ma’lumot topilmadi.');
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

        ctx.reply(text);
    }


    @Hears('⬅️ Orqaga')
    async back(@Ctx() ctx: Context) {
        await ctx.reply(
            "Asosiy menyu",
            Markup.keyboard([
                ['👤 Profil', "📊 Baholar"],
                [
                    Markup.button.contactRequest("📱 Royhatdan o'tish")
                ]
            ]).resize()
        );
    }

    @On('text')
    async onText(@Ctx() ctx: Context) {
        const msg = ctx.message as any;
        const text = msg?.text;

        if (!text) return;

        // 1. PROFIL
        if (text === '👤 Profil') {
            const user = ctx.from;
            await ctx.reply(`👤 Profilingiz:\n\nIsm: ${user?.first_name}\nID: ${user?.id}`);
        }

        // 2. BUYURTMALAR
        else if (text === '📦 Buyurtmalar') {
            await ctx.reply('📦 Buyurtmalar ro‘yxati bo‘sh.');
        }

        // 3. FANLAR
        else if (text === '📚 Fanlar') {
            await ctx.reply('📚 Siz o‘qiydigan fanlar ro‘yxati...');
        }

        // 4. SINF
        else if (text === '🏫 Sinf') {

            const classes = await this.classService.findAll();

            if (!classes || classes.length === 0) {
                await ctx.reply("Hozircha hech qanday sinf topilmadi.");
                return;
            }

            let response = "🏫 Mavjud sinflar ro'yxati:\n\n O'quvchilar soni  \n\n";
            classes.forEach((c, index) => {
                // Bu yerda 'c.name' o'rniga sizning bazangizdagi ustun nomi bo'lishi kerak
                response += `${index + 1}. ${c.name || 'Nomsiz sinf'} O'quvchilar soni: ${c.students.length}\n`;
            });



            await ctx.reply(response);
        }



        // 6. YORDAM
        else if (text === 'ℹ️ Yordam') {
            await ctx.reply('ℹ️ Savollar bo‘lsa @admin ga murojaat qiling.');
        }

        // 7. DEFAULT (Boshqa har qanday matn uchun)
        else {
            await ctx.reply(`Noma'lum buyruq: ${text}`);
        }
    }

    @Help()
    async help(@Ctx() ctx: Context) {
        await ctx.reply('Yordam bo‘limi.');
    }



    @On('contact')
    async onContact(@Ctx() ctx: Context) {

        const contact = (ctx.message as any).contact;


        //const phone = contact.phone_number.replace('+', '');
        const phone = contact.phone_number

        // Telegram user chat id
        const telegram_chat_id = ctx.from?.id + "";

        // studentni telefon orqali topish
        const student = await this.studentService.findByPhone(phone);

        if (!student) {
            await ctx.reply("❌ Bu raqam bazada topilmadi.");
            return;
        }


        // update qilish
        await this.studentService.update(student.id, {
            telegram_chat_id
        });

        await ctx.reply("✅ Telegram account muvaffaqiyatli bog'landi.");
    }

}
