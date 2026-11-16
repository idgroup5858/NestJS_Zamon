import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiChat } from './entities/ai_chat.entity';
import { AiMessage, AiMessageRole } from './entities/ai_message.entity';
import { AiToolsService } from './ai_tools.service';
import { CreateAiChatDto } from './dto/create-ai_chat.dto';
import { UpdateAiChatDto } from './dto/update-ai_chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const HISTORY_LIMIT = 20;        // AI ga yuboriladigan oxirgi xabarlar soni
const MAX_TOOL_STEPS = 6;        // Bitta savol uchun funksiya chaqirish bosqichlari chegarasi
const REQUEST_TIMEOUT_MS = 45_000;
const EMPTY_ANSWER = "Kechirasiz, bu savolga javob tayyorlay olmadim. Savolni boshqacha yozib ko'ring.";
const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

type GeminiContent = { role: string; parts: any[] };

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    @InjectRepository(AiChat)
    private readonly chatRepository: Repository<AiChat>,
    @InjectRepository(AiMessage)
    private readonly messageRepository: Repository<AiMessage>,
    private readonly aiToolsService: AiToolsService,
    private readonly configService: ConfigService,
  ) { }

  // ===================== SUHBATLAR =====================

  async create(userId: number, dto: CreateAiChatDto) {
    const chat = this.chatRepository.create({
      title: dto.title?.trim() || null,
      user: { id: userId } as any,
    });
    const saved = await this.chatRepository.save(chat);
    return this.toChatResponse(saved);
  }

  async findAll(userId: number) {
    return await this.chatRepository.find({
      where: { user: { id: userId } },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(userId: number, id: number) {
    const chat = await this.getOwnedChat(userId, id);
    const messages = await this.messageRepository.find({
      where: { chat: { id: chat.id } },
      order: { id: 'ASC' },
    });
    return {
      ...this.toChatResponse(chat),
      messages: messages.map((m) => this.toMessageResponse(m)),
    };
  }

  async update(userId: number, id: number, dto: UpdateAiChatDto) {
    const chat = await this.getOwnedChat(userId, id);
    chat.title = dto.title.trim();
    const saved = await this.chatRepository.save(chat);
    return this.toChatResponse(saved);
  }

  async remove(userId: number, id: number): Promise<{ message: string }> {
    const chat = await this.getOwnedChat(userId, id);
    await this.chatRepository.remove(chat); // xabarlari ham o'chadi (CASCADE)
    return { message: `#${id} raqamli suhbat muvaffaqiyatli o'chirildi.` };
  }

  // ===================== XABAR YUBORISH =====================

  async send(userId: number, dto: SendMessageDto) {
    const text = dto.message.trim();
    if (!text) throw new BadRequestException("Xabar bo'sh bo'lmasligi kerak!");

    let chat: AiChat | null = null;
    let history: AiMessage[] = [];
    if (dto.chat_id) {
      chat = await this.getOwnedChat(userId, dto.chat_id);
      history = (await this.messageRepository.find({
        where: { chat: { id: chat.id } },
        order: { id: 'DESC' },
        take: HISTORY_LIMIT,
      })).reverse();
    }

    // Avval AI javobini olamiz - xatolik bo'lsa bazaga hech narsa yozilmaydi
    const answer = await this.runAgent(this.buildContents(history, text));

    if (!chat) {
      chat = await this.chatRepository.save(
        this.chatRepository.create({ title: this.makeTitle(text), user: { id: userId } as any }),
      );
    } else {
      // Nomi bo'lmasa birinchi xabardan qo'yiladi; updatedAt ham yangilanadi (ro'yxat tepasiga chiqadi)
      chat.title = chat.title || this.makeTitle(text);
      await this.chatRepository.update(chat.id, { title: chat.title });
    }

    const userMessage = await this.messageRepository.save(
      this.messageRepository.create({ chat: { id: chat.id } as any, role: AiMessageRole.USER, content: text }),
    );
    const assistantMessage = await this.messageRepository.save(
      this.messageRepository.create({ chat: { id: chat.id } as any, role: AiMessageRole.ASSISTANT, content: answer }),
    );

    return {
      chat_id: chat.id,
      title: chat.title,
      userMessage: this.toMessageResponse(userMessage),
      assistantMessage: this.toMessageResponse(assistantMessage),
    };
  }

  // ===================== GEMINI =====================

  // AI funksiya so'rasa - bajarib natijasini qaytaramiz, matnli javob berguncha davom etadi
  private async runAgent(contents: GeminiContent[]): Promise<string> {
    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const content = await this.generate(contents, true);
      const calls = content.parts.filter((p) => p.functionCall);
      if (!calls.length) return this.extractText(content);

      // Model javobini o'zgartirmasdan qo'shamiz (thoughtSignature saqlanishi kerak)
      contents.push(content);

      const responses: any[] = [];
      for (const part of calls) {
        const { id, name, args } = part.functionCall;
        const result = await this.aiToolsService.execute(name, args ?? {});
        responses.push({ functionResponse: { ...(id ? { id } : {}), name, response: result } });
      }
      contents.push({ role: 'user', parts: responses });
    }

    // Bosqichlar tugadi - funksiyasiz yakuniy javob so'raymiz
    this.logger.warn(`AI ${MAX_TOOL_STEPS} bosqichda javob bermadi, yakuniy javob so'ralmoqda`);
    return this.extractText(await this.generate(contents, false));
  }

  private async generate(contents: GeminiContent[], allowTools: boolean): Promise<GeminiContent> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException("AI sozlanmagan: .env faylida GEMINI_API_KEY topilmadi!");
    }
    const model = (this.configService.get<string>('GEMINI_MODEL') || DEFAULT_MODEL).trim().replace(/^models\//, '');

    const body: Record<string, any> = {
      systemInstruction: { parts: [{ text: this.buildSystemPrompt() }] },
      contents,
      tools: [{ functionDeclarations: this.aiToolsService.declarations }],
      generationConfig: { temperature: 0.3 },
    };
    if (!allowTools) {
      body.toolConfig = { functionCallingConfig: { mode: 'NONE' } };
    }

    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error(`Gemini'ga ulanib bo'lmadi: ${error.message}`);
      throw new ServiceUnavailableException("AI xizmatiga ulanib bo'lmadi, birozdan keyin qayta urinib ko'ring.");
    }

    const data: any = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = data?.error?.message ?? response.statusText;
      this.logger.error(`Gemini xatosi (${response.status}): ${reason}`);
      if (response.status === 429) {
        throw new HttpException("AI so'rovlar limiti tugadi, birozdan keyin qayta urinib ko'ring.", HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new BadGatewayException(`AI xizmatidan javob olishda xatolik: ${reason}`);
    }

    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts) || !parts.length) {
      const reason = data?.promptFeedback?.blockReason ?? candidate?.finishReason ?? 'UNKNOWN';
      this.logger.warn(`Gemini bo'sh javob qaytardi: ${reason}`);
      return { role: 'model', parts: [{ text: EMPTY_ANSWER }] };
    }
    return { ...candidate.content, role: candidate.content.role ?? 'model' };
  }

  private buildSystemPrompt(): string {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' }); // YYYY-MM-DD
    const weekday = WEEKDAYS[new Date(`${today}T00:00:00Z`).getUTCDay()];

    return [
      "Siz Zamon maktabining o'quv tahlili bo'yicha AI yordamchisisiz. Sizdan maktab xodimlari (rahbariyat, o'qituvchilar) foydalanadi.",
      `Bugun: ${today}, ${weekday} (Toshkent vaqti).`,
      "",
      "Vazifangiz: o'quvchilar, ularning baholari va o'zlashtirishi (haftalik, oylik, yillik dinamikasi), fanlar va kriteriyalar bo'yicha kuchli/zaif tomonlari, xulq-atvori, sinflar va butun maktab bo'yicha o'zlashtirish haqidagi savollarga javob berish.",
      "",
      "Qoidalar:",
      "1. Faqat funksiyalardan olingan ma'lumotlarga tayaning. Hech qachon raqam, ism yoki baho to'qimang. Ma'lumot topilmasa, buni ochiq ayting.",
      "2. O'quvchi nomi aytilsa, avval search_students bilan uni toping. Bir nechta o'quvchi mos kelsa, ro'yxatni ko'rsatib qaysi biri ekanini so'rang. Sinf yoki fan nomi aytilsa, id sini list_classes / list_subjects orqali toping.",
      "3. \"Shu hafta\", \"o'tgan oy\", \"bu yil\" kabi iboralarni bugungi sanadan kelib chiqib aniq sanalarga (YYYY-MM-DD) aylantiring. Hafta dushanbadan boshlanadi.",
      "4. Baho sanasi - o'qituvchi bahoni tizimga kiritgan kun.",
      "5. Baholar sonli. Shkalani taxmin qilmang: o'sish/pasayish, fanlar va davrlar orasidagi farq, eng past va eng yuqori baholarni solishtirib tahlil qiling. Baholar soni kam bo'lsa (1-2 ta), xulosa ishonchli emasligini ayting.",
      "6. Xulq-atvor baholari matnli: yaxshi, o'rtacha, qoniqarli.",
      "7. To'lovlar, maosh, xarajatlar, telefon raqamlar va boshqa shaxsiy ma'lumotlarga kirishingiz yo'q - bunday savollarda bu ma'lumot sizda yo'qligini ayting. O'qishga aloqasi yo'q savollarda faqat o'quv masalalarida yordam bera olishingizni qisqa ayting.",
      "8. Foydalanuvchi qaysi tilda yozsa, o'sha tilda javob bering (odatda o'zbek tilida, lotin yozuvida).",
      "9. Javobni Markdown formatida yozing: qisqa va aniq, kerak bo'lsa jadval va ro'yxatlar bilan. Tahlil oxirida o'qituvchi yoki ota-ona uchun 1-3 ta amaliy tavsiya bering.",
      "10. Ichki id raqamlarni foydalanuvchiga ko'rsatmang (faqat bir xil ismli o'quvchilarni ajratish kerak bo'lsa ko'rsatish mumkin).",
    ].join('\n');
  }

  // ===================== YORDAMCHI =====================

  private buildContents(history: AiMessage[], text: string): GeminiContent[] {
    const contents: GeminiContent[] = history.map((m) => ({
      role: m.role === AiMessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
    // Tarix user xabaridan boshlanishi kerak
    while (contents.length && contents[0].role !== 'user') contents.shift();
    contents.push({ role: 'user', parts: [{ text }] });
    return contents;
  }

  private extractText(content: GeminiContent): string {
    const text = (content.parts ?? [])
      .filter((p) => typeof p.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join('')
      .trim();
    return text || EMPTY_ANSWER;
  }

  private makeTitle(text: string): string {
    const line = text.replace(/\s+/g, ' ').trim();
    return line.length > 60 ? `${line.slice(0, 60)}...` : line;
  }

  private async getOwnedChat(userId: number, id: number): Promise<AiChat> {
    const chat = await this.chatRepository.findOne({ where: { id, user: { id: userId } } });
    if (!chat) throw new NotFoundException(`#${id} raqamli suhbat topilmadi!`);
    return chat;
  }

  private toChatResponse(chat: AiChat) {
    return { id: chat.id, title: chat.title, createdAt: chat.createdAt, updatedAt: chat.updatedAt };
  }

  private toMessageResponse(message: AiMessage) {
    return { id: message.id, role: message.role, content: message.content, createdAt: message.createdAt };
  }
}
