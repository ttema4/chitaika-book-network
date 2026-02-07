import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1707320000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Создаем таблицу USERS
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "username" VARCHAR(50) NOT NULL UNIQUE,
                "email" VARCHAR(100) NOT NULL UNIQUE,
                "password_hash" VARCHAR(255) NOT NULL
            )
        `);

        // 2. Создаем таблицу BOOKS
        await queryRunner.query(`
            CREATE TABLE "books" (
                "id" SERIAL PRIMARY KEY,
                "title" VARCHAR(255) NOT NULL,
                "author" VARCHAR(255) NOT NULL,
                "cover_url" TEXT,
                "text_url" TEXT NOT NULL
            )
        `);

        // 3. Создаем таблицу COMMENTS (с привязкой к тексту)
        await queryRunner.query(`
            CREATE TABLE "comments" (
                "id" SERIAL PRIMARY KEY,
                "content" TEXT NOT NULL,
                "start_offset" INTEGER NOT NULL,
                "end_offset" INTEGER NOT NULL,
                "created_at" TIMESTAMP DEFAULT now(),
                "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
                "book_id" INTEGER REFERENCES "books"("id") ON DELETE CASCADE
            )
        `);

        // 4. Создаем таблицу FAVORITES (Избранное)
        await queryRunner.query(`
            CREATE TABLE "favorites" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
                "book_id" INTEGER REFERENCES "books"("id") ON DELETE CASCADE,
                UNIQUE("user_id", "book_id")
            )
        `);

        // 5. Создаем таблицу RATINGS (Рейтинги и отзывы)
        await queryRunner.query(`
            CREATE TABLE "ratings" (
                "id" SERIAL PRIMARY KEY,
                "rating" INTEGER CHECK (rating >= 1 AND rating <= 5),
                "review" TEXT,
                "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
                "book_id" INTEGER REFERENCES "books"("id") ON DELETE CASCADE,
                UNIQUE("user_id", "book_id")
            )
        `);

        // --- ВСТАВКА МОК-ДАННЫХ ---

        // Добавляем пользователей (пароли захешированы "12345" для примера)
        await queryRunner.query(`
            INSERT INTO "users" (username, email, password_hash) VALUES 
            ('knigolub_42', 'test1@example.com', '$2b$10$ExmplHash1'),
            ('reader_master', 'test2@example.com', '$2b$10$ExmplHash2');
        `);

        // Добавляем книги
        await queryRunner.query(`
            INSERT INTO "books" (title, author, cover_url, text_url) VALUES 
            ('Преступление и наказание', 'Фёдор Достоевский', '/covers/dostoevsky.jpg', '/texts/crime_and_punishment.txt'),
            ('1984', 'Джордж Оруэлл', '/covers/1984.jpg', '/texts/1984.txt');
        `);

        // Добавляем пример комментария
        // Допустим, в 1984 (book_id: 2) кто-то выделил фразу "Big Brother is watching you"
        await queryRunner.query(`
            INSERT INTO "comments" (content, start_offset, end_offset, user_id, book_id) VALUES 
            ('Обожаю этот момент, очень жутко!', 450, 478, 1, 2);
        `);

        // Добавляем в избранное
        await queryRunner.query(`
            INSERT INTO "favorites" (user_id, book_id) VALUES (1, 1), (2, 2);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем таблицы в обратном порядке из-за зависимостей (FK)
        await queryRunner.query(`DROP TABLE "ratings"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
