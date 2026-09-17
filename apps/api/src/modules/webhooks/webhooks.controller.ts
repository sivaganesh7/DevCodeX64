import {
  Controller,
  Post,
  Headers,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() payload: any,
  ) {
    if (!event) {
      event = 'pull_request';
    }

    // Verify HMAC-SHA256 signature if configured
    const isValid = this.webhooksService.validateSignature(
      JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid GitHub webhook signature');
    }

    return this.webhooksService.handleWebhook(event, payload);
  }
}
