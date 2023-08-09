import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Logger } from 'winston';

export abstract class Command {
  // NOTE: This field used for logs.
  cmdName = this.constructor.name;
}

export abstract class CommandHandler<T extends Command> {
  protected constructor(protected readonly logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }
  async handle(command: T): Promise<boolean> {
    try {
      this.logger.log('info', 'Handle command...');
      await this.handleImplementation(command);
      this.logger.log('info', 'Complete command');

      return true;
    } catch (error) {
      this.logger.log('error', 'Command execution failed: ', error);

      return false;
    }
  }

  protected abstract handleImplementation(command: T): Promise<void>;
}

@Injectable()
export class Dispatcher {
  private queue: Command[] = [];
  private isBusy = false;

  constructor(private moduleRef: ModuleRef, private logger: Logger) {
    this.logger.defaultMeta = { service: this.constructor.name };
  }

  dispatch<T extends Command>(command: T): void {
    this.logger.log('info', `Received command: ${JSON.stringify(command)}`);
    this.queue.unshift(command);

    if (!this.isBusy) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.logger.log('info', 'Launch command processing...');
    this.isBusy = true;

    while (true) {
      const command = this.queue.pop();

      if (!command) {
        break;
      }

      this.logger.log(
        'info',
        `Start processing command: ${JSON.stringify(command)}`,
      );
      const commandSuccess = await this.handleCommand(command);

      if (commandSuccess) {
        this.logger.log(
          'info',
          `Complete processing command: ${JSON.stringify(command)}`,
        );
      } else {
        this.logger.log(
          'warn',
          `Command wasn't completed successfully: ${JSON.stringify(command)}`,
        );
      }
    }

    this.isBusy = false;
    this.logger.log(
      'info',
      'Complete command processing. Waiting for new commands...',
    );
  }

  private async handleCommand<T extends Command>(command: T): Promise<boolean> {
    const handler: CommandHandler<T> = await this.moduleRef.resolve(
      command.constructor.name,
    );
    return handler.handle(command);
  }
}
