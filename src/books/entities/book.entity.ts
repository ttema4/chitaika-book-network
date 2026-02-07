import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Comment } from '../../comments/entities/comment.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { Rating } from '../../ratings/entities/rating.entity';

@Entity({ name: 'books' })
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255 })
  author: string;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  cover_url: string;

  @Column({ name: 'text_url', type: 'text' })
  text_url: string;

  @OneToMany(() => Comment, (comment) => comment.book)
  comments: Comment[];

  @OneToMany(() => Favorite, (favorite) => favorite.book)
  favorites: Favorite[];

  @OneToMany(() => Rating, (rating) => rating.book)
  ratings: Rating[];
}
