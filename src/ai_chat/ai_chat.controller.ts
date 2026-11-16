import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiChatService } from './ai_chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateAiChatDto } from './dto/create-ai_chat.dto';
import { UpdateAiChatDto } from './dto/update-ai_chat.dto';

// Hammasi token bilan ishlaydi (Authorization: Bearer <accessToken>), user tokendan olinadi
@UseGuards(AuthGuard('jwt'))
@Controller('aichat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  // POST http://localhost:3001/aichat/send   { "message": "...", "chat_id": 5 }  (chat_id berilmasa yangi suhbat ochiladi)
  @Post('send')
  send(@Req() req: any, @Body() sendMessageDto: SendMessageDto) {
    return this.aiChatService.send(Number(req.user.id), sendMessageDto);
  }

  @Post('add')
  create(@Req() req: any, @Body() createAiChatDto: CreateAiChatDto) {
    return this.aiChatService.create(Number(req.user.id), createAiChatDto);
  }

  @Get('getall')
  findAll(@Req() req: any) {
    return this.aiChatService.findAll(Number(req.user.id));
  }

  @Get('getby/:id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.aiChatService.findOne(Number(req.user.id), id);
  }

  @Patch('update/:id')
  update(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() updateAiChatDto: UpdateAiChatDto) {
    return this.aiChatService.update(Number(req.user.id), id, updateAiChatDto);
  }

  @Delete('delete/:id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.aiChatService.remove(Number(req.user.id), id);
  }
}
