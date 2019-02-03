import { Logger as NestjsLogger, Injectable } from '@nestjs/common';
import { CONFIG } from '../../config/config';

@Injectable()
export class LoggerService extends NestjsLogger {
  public log(message: any, context?: string): void {
    if (!CONFIG.logging.enabled) {
      return;
    }

    super.log(message, context);
  }
}
