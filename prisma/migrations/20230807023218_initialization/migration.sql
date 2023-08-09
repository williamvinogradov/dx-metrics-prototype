BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[trello_team_settings] (
    [id] INT NOT NULL IDENTITY(1,1),
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_team_settings_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [board_id] NVARCHAR(1000) NOT NULL,
    [done_list_name_reg_exp] NVARCHAR(1000) NOT NULL,
    [work_list_name_reg_exp] NVARCHAR(1000) NOT NULL,
    [trello_name_sc_ticket_reg_exp] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_team_settings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [trello_team_settings_board_id_key] UNIQUE NONCLUSTERED ([board_id])
);

-- CreateTable
CREATE TABLE [dbo].[tasks] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [tasks_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    CONSTRAINT [tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_cards] (
    [trello_id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_cards_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [task_id] NVARCHAR(1000) NOT NULL,
    [board_id] NVARCHAR(1000) NOT NULL,
    [score] INT,
    [done_time] DATETIME2 NOT NULL,
    [duration_minutes] INT NOT NULL,
    CONSTRAINT [trello_cards_pkey] PRIMARY KEY CLUSTERED ([trello_id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_labels] (
    [trello_id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_labels_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [trello_board_id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_labels_pkey] PRIMARY KEY CLUSTERED ([trello_id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_members] (
    [trello_id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_members_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [trello_name] NVARCHAR(1000) NOT NULL,
    [full_name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_members_pkey] PRIMARY KEY CLUSTERED ([trello_id]),
    CONSTRAINT [trello_members_trello_name_key] UNIQUE NONCLUSTERED ([trello_name]),
    CONSTRAINT [trello_members_full_name_key] UNIQUE NONCLUSTERED ([full_name])
);

-- CreateTable
CREATE TABLE [dbo].[trello_lists] (
    [trello_id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_lists_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [trello_board_id] NVARCHAR(1000) NOT NULL,
    [type] INT NOT NULL,
    [is_processed] BIT NOT NULL,
    CONSTRAINT [trello_lists_pkey] PRIMARY KEY CLUSTERED ([trello_id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_card_history] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_card_history_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [trello_card_id] NVARCHAR(1000) NOT NULL,
    [trello_list_id] NVARCHAR(1000) NOT NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2,
    [duration_minutes] INT,
    CONSTRAINT [trello_card_history_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_card_label_relation] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_card_label_relation_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [trello_card_id] NVARCHAR(1000) NOT NULL,
    [trello_label_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_card_label_relation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [trello_card_label_relation_trello_card_id_trello_label_id_key] UNIQUE NONCLUSTERED ([trello_card_id],[trello_label_id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_card_member_relation] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_card_member_relation_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [trello_card_id] NVARCHAR(1000) NOT NULL,
    [trello_member_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_card_member_relation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [trello_card_member_relation_trello_card_id_trello_member_id_key] UNIQUE NONCLUSTERED ([trello_card_id],[trello_member_id])
);

-- CreateTable
CREATE TABLE [dbo].[sc_ticket_data] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [sc_ticket_data_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [ticket_number] NVARCHAR(1000) NOT NULL,
    [tasks_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [sc_ticket_data_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sc_ticket_data_ticket_number_key] UNIQUE NONCLUSTERED ([ticket_number]),
    CONSTRAINT [sc_ticket_data_tasks_id_key] UNIQUE NONCLUSTERED ([tasks_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[trello_cards] ADD CONSTRAINT [trello_cards_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_history] ADD CONSTRAINT [trello_card_history_trello_card_id_fkey] FOREIGN KEY ([trello_card_id]) REFERENCES [dbo].[trello_cards]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_history] ADD CONSTRAINT [trello_card_history_trello_list_id_fkey] FOREIGN KEY ([trello_list_id]) REFERENCES [dbo].[trello_lists]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_label_relation] ADD CONSTRAINT [trello_card_label_relation_trello_card_id_fkey] FOREIGN KEY ([trello_card_id]) REFERENCES [dbo].[trello_cards]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_label_relation] ADD CONSTRAINT [trello_card_label_relation_trello_label_id_fkey] FOREIGN KEY ([trello_label_id]) REFERENCES [dbo].[trello_labels]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_member_relation] ADD CONSTRAINT [trello_card_member_relation_trello_card_id_fkey] FOREIGN KEY ([trello_card_id]) REFERENCES [dbo].[trello_cards]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_member_relation] ADD CONSTRAINT [trello_card_member_relation_trello_member_id_fkey] FOREIGN KEY ([trello_member_id]) REFERENCES [dbo].[trello_members]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sc_ticket_data] ADD CONSTRAINT [sc_ticket_data_tasks_id_fkey] FOREIGN KEY ([tasks_id]) REFERENCES [dbo].[tasks]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
