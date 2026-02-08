import { Controller, Get, Render, Post, Body, UseInterceptors, UploadedFiles, Res, Param, Patch, Delete, Sse, MessageEvent, UseGuards, Req } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { Observable, map } from 'rxjs';
import { BooksService } from './books.service';
import { FilesService } from '../files/files.service';
import { AuthGuard } from '../auth/auth.guard';
import { FavoritesService } from '../favorites/favorites.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly filesService: FilesService,
    private readonly favoritesService: FavoritesService,
  ) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.booksService.bookCreated$.pipe(
      map((book) => ({ data: { title: book.title, author: book.author } } as MessageEvent)),
    );
  }

  @Get('test-notification')
  triggerTestNotification() {
      this.booksService.bookCreated$.next({ 
          title: "Тестовая книга " + new Date().toLocaleTimeString(), 
          author: "Система" 
      } as any);
      return "Notification sent!";
  }

  @Get('create')
  @UseGuards(AuthGuard)
  @Render('books/create')
  createPage() {
    return {};
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cover', maxCount: 1 },
    { name: 'text', maxCount: 1 },
  ]))
  async create(
    @Body() body: { title: string; author: string; genre?: string; description?: string },
    @UploadedFiles() files: { cover?: Express.Multer.File[]; text?: Express.Multer.File[] },
    @Res() res: Response,
  ) {
    const { title, author, genre, description } = body;
    const coverFile = files.cover ? files.cover[0] : null;
    const textFile = files.text ? files.text[0] : null;

    let coverUrl: string | null = null;
    if (coverFile) {
      try {
        coverUrl = await this.filesService.uploadFile(coverFile, 'covers');
      } catch (e) {
      }
    }

    let textUrl = '';
    if (textFile) {
      try {
        textUrl = await this.filesService.uploadFile(textFile, 'texts');
      } catch (e) {
      }
    }

    if (!textUrl) {
       // In a real app we might validate before upload
    }

    await this.booksService.create({
      title,
      author,
      genre,     
      description,
      cover_url: coverUrl,
      text_url: textUrl,
    });

    return res.redirect('/books');
  }

  @Get()
  @Render('books/list')
  async findAll(@Req() req: Request) {
    const books = await this.booksService.findAll();
    
    if ((req as any).user) {
        const userFavorites = await this.favoritesService.findAllByUser((req as any).user.id);
        const favIds = new Set(userFavorites.map(f => f.book.id));
        
        const booksWithFav = books.map(b => ({
            ...b,
            isFavorite: favIds.has(b.id)
        }));
        return { books: booksWithFav };
    }

    return { books };
  }

  @Get(':id')
  @Render('books/detail')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const book = await this.booksService.findOne(+id);
    
    if ((req as any).user) {
         const isFav = await this.favoritesService.isFavorite((req as any).user.id, +id);
         return { book: { ...book, isFavorite: isFav } };
    }

    return { book };
  }

  @Get(':id/edit')
  @UseGuards(AuthGuard)
  @Render('books/edit')
  async editPage(@Param('id') id: string) {
    const book = await this.booksService.findOne(+id);
    return { book };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cover', maxCount: 1 },
    { name: 'text', maxCount: 1 },
  ]))
  async update(
    @Param('id') id: string,
    @Body() body: { title: string; author: string; genre?: string; description?: string },
    @UploadedFiles() files: { cover?: Express.Multer.File[]; text?: Express.Multer.File[] },
    @Res() res: Response,
  ) {
    const { title, author, genre, description } = body;
    const coverFile = files.cover ? files.cover[0] : null;
    const textFile = files.text ? files.text[0] : null;

    const updateData: any = { title, author, genre, description };
    
    if (coverFile) {
        try {
            updateData.cover_url = await this.filesService.uploadFile(coverFile, 'covers');
        } catch (e) {
        }
    }
    
    if (textFile) {
        try {
            updateData.text_url = await this.filesService.uploadFile(textFile, 'texts');
        } catch (e) {
        }
    }

    await this.booksService.update(+id, updateData);
    return res.redirect(`/books/${id}`);
  }
  
  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.booksService.remove(+id);
    return res.redirect('/books');
  }
}
