import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1000000000000 implements MigrationInterface {
    name = 'InitialSchema1000000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL PRIMARY KEY,
                "username" VARCHAR(50) NOT NULL UNIQUE,
                "email" VARCHAR(100) NOT NULL UNIQUE,
                "supertokens_id" VARCHAR(128),
                "role" VARCHAR(20) NOT NULL DEFAULT 'user',
                "avatar_url" VARCHAR
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "books" (
                "id" SERIAL PRIMARY KEY,
                "title" VARCHAR(255) NOT NULL,
                "author" VARCHAR(255) NOT NULL,
                "cover_url" TEXT,
                "text_url" TEXT NOT NULL,
                "genre" VARCHAR(100),
                "description" TEXT
            )
        `);

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

        await queryRunner.query(`
            CREATE TABLE "favorites" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
                "book_id" INTEGER REFERENCES "books"("id") ON DELETE CASCADE,
                UNIQUE("user_id", "book_id")
            )
        `);

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

        await queryRunner.query(`
            CREATE TABLE "user_friends" (
                "user_id" INTEGER NOT NULL,
                "friend_id" INTEGER NOT NULL,
                CONSTRAINT "PK_user_friends" PRIMARY KEY ("user_id", "friend_id"),
                CONSTRAINT "FK_user_friends_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_friends_friend" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_books" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "book_id" INTEGER NOT NULL,
                "status" VARCHAR NOT NULL DEFAULT 'planned',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_user_books_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_user_books_book_id" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_books"`);
        await queryRunner.query(`DROP TABLE "user_friends"`);
        await queryRunner.query(`DROP TABLE "ratings"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}