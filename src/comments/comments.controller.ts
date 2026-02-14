import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createCommentDto: any, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.commentsService.create({ ...createCommentDto, user_id: userId });
  }

  @Get()
  findAll(@Query('bookId') bookId?: string) {
    return this.commentsService.findAll(bookId ? +bookId : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(+id);
  }
}
