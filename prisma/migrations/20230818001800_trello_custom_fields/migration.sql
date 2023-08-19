BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[trello_custom_fields] (
    [trello_id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_custom_fields_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [trello_custom_fields_pkey] PRIMARY KEY CLUSTERED ([trello_id])
);

-- CreateTable
CREATE TABLE [dbo].[trello_card_custom_field_data] (
    [id] NVARCHAR(1000) NOT NULL,
    [created_time] DATETIME2 NOT NULL CONSTRAINT [trello_card_custom_field_data_created_time_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_time] DATETIME2 NOT NULL,
    [field_id] NVARCHAR(1000) NOT NULL,
    [trello_card_id] NVARCHAR(1000) NOT NULL,
    [value_number] INT,
    CONSTRAINT [trello_card_custom_field_data_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_custom_field_data] ADD CONSTRAINT [trello_card_custom_field_data_field_id_fkey] FOREIGN KEY ([field_id]) REFERENCES [dbo].[trello_custom_fields]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[trello_card_custom_field_data] ADD CONSTRAINT [trello_card_custom_field_data_trello_card_id_fkey] FOREIGN KEY ([trello_card_id]) REFERENCES [dbo].[trello_cards]([trello_id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
