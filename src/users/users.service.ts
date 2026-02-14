import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Subject } from 'rxjs';

@Injectable()
export class UsersService {
  public static readonly userSubscribed$ = new Subject<{ type: string, toUserId: number, fromUser: User }>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const user = this.usersRepository.create(createUserDto as Partial<User>);
    return await this.usersRepository.save(user); 
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findAllWithPagination(skip: number = 0, take: number = 10): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      skip,
      take,
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ 
        where: { id },
        relations: ['favorites', 'favorites.book', 'subscribers', 'friends'] 
    });
    if (!user) {
        throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
      return this.usersRepository.findOne({ where: { email } });
  }

  async findBySuperTokensId(stId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { supertokens_id: stId } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async update(id: number, updateUserDto: any): Promise<User> {
    const user = await this.findOne(id);
    this.usersRepository.merge(user, updateUserDto);
    const saved = await this.usersRepository.save(user);
    return saved;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async addFriend(userId: number, friendId: number): Promise<void> {
    if (userId === friendId) return;
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['friends'] });
    const friend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!user || !friend) throw new NotFoundException('User not found');
    
    if (!user.friends) user.friends = [];
    if (!user.friends.find(f => f.id === friend.id)) {
        user.friends.push(friend);
        await this.usersRepository.save(user);

        console.log(`[UsersService] Emitting subscription event. From: ${user.id} To: ${friend.id}`);
        UsersService.userSubscribed$.next({ 
            type: 'subscription',
            toUserId: friend.id, 
            fromUser: user 
        });
    }
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['friends'] });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.friends) {
        user.friends = user.friends.filter(f => f.id !== friendId);
        await this.usersRepository.save(user);
    }
  }
  
  async getFriends(userId: number): Promise<User[]> {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['friends'] });
      return user ? user.friends : [];
  }
}
