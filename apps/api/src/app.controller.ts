import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthValidationService, ValidationResult } from './health-validation.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthValidationService: HealthValidationService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.1',
    };
  }

  /**
   * GET /health/validate - Comprehensive validation of all services
   * Tests: Database, LLM, pgvector, n8n, RAG pipeline
   */
  @Get('health/validate')
  async validateSetup(): Promise<ValidationResult> {
    return this.healthValidationService.validate();
  }
}
