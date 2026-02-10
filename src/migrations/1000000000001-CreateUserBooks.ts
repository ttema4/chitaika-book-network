import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserBooks1000000000001 implements MigrationInterface {
    name = 'CreateUserBooks1000000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
    }
}
