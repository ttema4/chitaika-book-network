import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

@Entity({ name: 'ratings' })
@Unique(['user_id', 'book_id'])
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  review: string;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ name: 'book_id' })
  book_id: number;

  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
