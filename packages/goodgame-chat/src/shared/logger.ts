import { Logger as NestjsLogger } from '@nestjs/common';
import { CONFIG } from '../config/config';

export class BasicLogger {
  private nestjsLogger = new NestjsLogger();

  constructor(
    private context: string,
  ) {
  }

  public log(message: any, enabled: boolean): void {
    if (!enabled || !CONFIG.logging.enabled) {
      return;
    }

    this.nestjsLogger.log(message, this.context);
  }
}
