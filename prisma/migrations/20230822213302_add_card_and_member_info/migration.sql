/*
  Warnings:

  - Added the required column `name` to the `trello_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `short_url` to the `trello_cards` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[trello_cards] ADD [name] NVARCHAR(1000) NOT NULL,
[short_url] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[trello_members] ADD [salary_per_day] INT;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
