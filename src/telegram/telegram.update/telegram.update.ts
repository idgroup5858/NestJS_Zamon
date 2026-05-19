import { Update, Start, Help, On, Ctx } from 'nestjs-telegraf';
import { ClassService } from 'src/class/class.service';
import { StudentService } from 'src/student/student.service';
import { Context, Markup } from 'telegraf';

@Update()
export class TelegramUpdate {


    constructor(

        private readonly classService: ClassService,
        private readonly studentService: StudentService
    ) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        await ctx.reply(
            `Salom! Kerakli bo'limni tanlang:`,
            Markup.keyboard([
                ['👤 Profil'],
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

        // 5. BAHOLAR
        else if (text === '📊 Baholar') {
            await ctx.reply('📊 Joriy chorakdagi baholaringiz...');
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
