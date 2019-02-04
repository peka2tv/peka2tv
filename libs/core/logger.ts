import { Logger as NestjsLogger } from '@nestjs/common';

export class BasicLogger {
  private nestjsLogger = new NestjsLogger();

  constructor(
    private context: string,
    private enabled = true,
  ) {
  }

  public log(message: any, enabled: boolean): void {
    if (!enabled || !this.enabled) {
      return;
    }

    this.nestjsLogger.log(message, this.context);
  }
}
