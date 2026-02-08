import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: any) {
    return this.commentsService.create(createCommentDto);
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
