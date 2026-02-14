import { Controller, Get, Render, Post, Body, UseInterceptors, UploadedFiles, Res, Param, Patch, Delete, Sse, MessageEvent, UseGuards, Req, Query, DefaultValuePipe, NotFoundException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { Observable, map } from 'rxjs';
import { BooksService } from './books.service';
import { FilesService } from '../files/files.service';
import { AuthGuard } from '../auth/auth.guard';
import { FavoritesService } from '../favorites/favorites.service';
import { UserBooksService } from '../user-books/user-books.service';
import { CommentsService } from '../comments/comments.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly filesService: FilesService,
    private readonly favoritesService: FavoritesService,
    private readonly userBooksService: UserBooksService,
    private readonly commentsService: CommentsService,
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
      throw new Error('Text file is required');
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
    const [books] = await this.booksService.findAll(0, 100);
    
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

  @Get(':id/read')
  @Render('books/read')
  async readPage(@Param('id') id: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    const book = await this.booksService.findOne(+id);
    if (!book) {
         throw new NotFoundException('Book not found');
    }
    
    let content = '';
    let error = '';
    
    if (book.text_url) {
        try {
            content = await this.filesService.getFileContent(book.text_url);
        } catch (e) {
            error = 'Не удалось загрузить книгу';
        }
    } else {
        error = 'Файл книги отсутствует';
    }
    
    const comments = await this.commentsService.findAll(+id);

    return { 
        book, 
        content, 
        commentsJson: JSON.stringify(comments),
        userJson: (req as any).user ? JSON.stringify((req as any).user) : 'null',
        error,
        user: (req as any).user
    };
  }

  @Get(':id')
  @Render('books/detail')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const book = await this.booksService.findOne(+id);
    let isFavorite = false;
    let userBookStatus = 'none';
    
    // @ts-ignore
    if (req.user) {
         // @ts-ignore
         const userId = req.user.id;
         isFavorite = await this.favoritesService.isFavorite(userId, +id);
         const userBook = await this.userBooksService.findOne(userId, +id);
         if (userBook) {
             userBookStatus = userBook.status;
         }
    }

    return { 
        book: { ...book, isFavorite, userBookStatus },
        user: (req as any).user
    };
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
