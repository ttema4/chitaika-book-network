import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Req, UseInterceptors, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';
import type { Request } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
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
  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=30')
  findAll(@Query('bookId') bookId?: string) {
    return this.commentsService.findAll(bookId ? +bookId : undefined);
  }

  @UseInterceptors(CacheInterceptor)
  @CacheControl('public, max-age=60')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const comment = await this.commentsService.findOne(+id);
    if (!comment) {
        throw new NotFoundException('Comment not found');
    }
    const user = (req as any).user;
    if (comment.user.id !== user.id && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own comments');
    }
    return this.commentsService.remove(+id);
  }
}
