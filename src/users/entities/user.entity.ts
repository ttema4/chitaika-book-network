import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Rating } from '../../ratings/entities/rating.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'supertokens_id', length: 128, nullable: true })
  supertokens_id: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatar_url: string;

  @Column({ name: 'books_read_count', default: 0 })
  booksReadCount: number;

  @Column({ default: 'user' })
  role: string;

  @ManyToMany(() => User, (user) => user.subscribers)
  @JoinTable({
    name: 'user_friends',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'friend_id', referencedColumnName: 'id' },
  })
  friends: User[];

  @ManyToMany(() => User, (user) => user.friends)
  subscribers: User[];

  // Relations (optional for now but good for ORM)
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];
}
