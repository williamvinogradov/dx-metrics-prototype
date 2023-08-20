/*
  Warnings:

  - You are about to drop the `trello_team_settings` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropTable
DROP TABLE [dbo].[trello_team_settings];

-- CreateTable
CREATE TABLE [dbo].[teams] (
    [id] INT NOT NULL IDENTITY(1,1),
    [created_time] DATETIME2 NOT NULL CONSTRAINT [teams_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [team_name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [teams_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [teams_team_name_key] UNIQUE NONCLUSTERED ([team_name])
);

-- CreateTable
CREATE TABLE [dbo].[team_settings] (
    [id] INT NOT NULL IDENTITY(1,1),
    [created_time] DATETIME2 NOT NULL CONSTRAINT [team_settings_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [team_id] INT NOT NULL,
    [trello_board_id] NVARCHAR(1000) NOT NULL,
    [trello_done_list_name_reg_exp] NVARCHAR(1000) NOT NULL,
    [trello_work_list_name_reg_exp] NVARCHAR(1000) NOT NULL,
    [trello_name_sc_ticket_reg_exp] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [team_settings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [team_settings_trello_board_id_key] UNIQUE NONCLUSTERED ([trello_board_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[team_settings] ADD CONSTRAINT [team_settings_team_id_fkey] FOREIGN KEY ([team_id]) REFERENCES [dbo].[teams]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
