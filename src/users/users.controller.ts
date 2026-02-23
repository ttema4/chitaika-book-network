import { Controller, Get, Post, Body, Patch, Param, Delete, Render, UseInterceptors, UploadedFile, Res, Req, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { CacheControl } from '../common/decorators/cache-control.decorator';
import { User } from './entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { UsersService } from './users.service';
import { FilesService } from '../files/files.service';
import { AuthGuard } from '../auth/auth.guard';
import { FavoritesService } from '../favorites/favorites.service';
import { UserBooksService } from '../user-books/user-books.service';
import { Observable, filter, map, tap } from 'rxjs';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly favoritesService: FavoritesService,
    private readonly userBooksService: UserBooksService,
  ) {}

  @Post(':id/avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    if ((req as any).user.id !== +id && (req as any).user.role !== 'admin') {
         return res.redirect(`/users/${id}`);
    }

    if (!file) {
        return res.redirect(`/users/${id}`);
    }

    try {
        const avatarUrl = await this.filesService.uploadFile(file, 'avatars');
        await this.usersService.update(+id, { avatar_url: avatarUrl });
    } catch (e) {
    }

    return res.redirect(`/users/${id}`);
  }

  @Post()
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get('readers')
  @Render('users/list')
  async readersPage(@Req() req: Request) {
      const allUsers = await this.usersService.findAll();
      const currentUserId = (req as any).user ? (req as any).user.id : null;
      let friends: User[] = [];
      if (currentUserId) {
          friends = await this.usersService.getFriends(currentUserId);
      }
      
      const usersWithStatus = allUsers.map(u => ({
          ...u,
          isFriend: friends.some(f => f.id === u.id),
          isMe: u.id === currentUserId
      })).filter(u => !u.isMe);
      
      return { users: usersWithStatus, friends, isAuthenticated: !!currentUserId };
  }

  @Post('friends/:friendId')
  @UseGuards(AuthGuard)
  async addFriend(@Param('friendId') friendId: string, @Req() req: Request, @Res() res: Response) {
      await this.usersService.addFriend((req as any).user.id, +friendId);
      
      if (req.headers['accept'] === 'application/json') {
          return res.status(200).json({ success: true, message: 'Friend added' });
      }
      return res.redirect('/users/readers');
  }

  @Post('friends/:friendId/remove')
  @UseGuards(AuthGuard)
  async removeFriend(@Param('friendId') friendId: string, @Req() req: Request, @Res() res: Response) {
      await this.usersService.removeFriend((req as any).user.id, +friendId);
      
      if (req.headers['accept'] === 'application/json') {
          return res.status(200).json({ success: true, message: 'Friend removed' });
      }
      return res.redirect('/users/readers');
  }
  @Get()
  @CacheControl('private, max-age=60')
  @Render('users/list')
  async findAll() {
    const users = await this.usersService.findAll();
    return { users };
  }

  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
      const user = (req as any).user;
      if (!user) {
          return res.redirect('/login');
      }
      return res.redirect(`/users/${user.id}`);
  }

  @Sse('notifications')
  notifications(@Req() req: Request): Observable<MessageEvent> {
      const user = (req as any).user;
      return UsersService.userSubscribed$.asObservable().pipe(
          filter((event: any) =>  {
             return !!user && Number(event.toUserId) === Number(user.id);
          }),
          map((event: any) => ({ data: { message: `Пользователь ${event.fromUser.username} подписался на вас` } } as MessageEvent))
      );
  }
  @Get(':id')
  @Render('users/profile')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = await this.usersService.findOne(+id);
    const currentUser = (req as any).user;
    const isOwner = currentUser && Number(currentUser.id) === Number(user.id);
    let isSubscribed = false;

    if (currentUser) {
        if (!isOwner) {
            isSubscribed = user.subscribers.some(sub => sub.id === currentUser.id);
        }

        if (user.favorites && user.favorites.length > 0) {
             const myFavs = await this.favoritesService.findAllByUser(currentUser.id);
             const myFavIds = new Set(myFavs.map(f => f.book.id));
             
             user.favorites = user.favorites.map(fav => {
                 fav.book = {
                     ...fav.book,
                     isFavorite: myFavIds.has(fav.book.id)
                 } as any;
                 return fav;
             });
        }
    }

    const userBooksState = await this.userBooksService.findAllByUser(+id);
    (user as any).reading = userBooksState.filter(ub => ub.status === 'reading').map(ub => ub.book);
    (user as any).planned = userBooksState.filter(ub => ub.status === 'planned').map(ub => ub.book);
    (user as any).readBooks = userBooksState.filter(ub => ub.status === 'read').map(ub => ub.book);

    let recommendations: any[] = [];
    if (user.friends && user.friends.length > 0) {
        const friendsIds = new Set(user.friends.map(f => f.id));
        const allActivity = await this.userBooksService.findLatestReading();
        
        recommendations = allActivity
            .filter(ub => friendsIds.has(ub.user.id))
            .map(ub => ({
                ...ub.book,
                recommender: ub.user
            }));
    }

    return { user, isOwner, isSubscribed, recommendations, isAuthenticated: !!currentUser };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
