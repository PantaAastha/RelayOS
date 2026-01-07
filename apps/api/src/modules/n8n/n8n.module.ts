// n8n Integration Module
// Provides optional workflow automation via n8n webhooks
// Only loads if N8N_ENABLED=true

import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { N8nService } from './n8n.service';
import { N8nController } from './n8n.controller';

@Global()
@Module({})
export class N8nModule {
    static forRoot(): DynamicModule {
        return {
            module: N8nModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: 'N8N_ENABLED',
                    useFactory: (configService: ConfigService) => {
                        const enabled = configService.get<string>('N8N_ENABLED')?.toLowerCase() === 'true';
                        if (enabled) {
                            console.log('🔗 n8n integration enabled');
                        }
                        return enabled;
                    },
                    inject: [ConfigService],
                },
                {
                    provide: N8nService,
                    useFactory: (configService: ConfigService, enabled: boolean) => {
                        if (!enabled) {
                            // Return a no-op service when disabled
                            return new N8nService(configService, false);
                        }
                        return new N8nService(configService, true);
                    },
                    inject: [ConfigService, 'N8N_ENABLED'],
                },
            ],
            controllers: [N8nController],
            exports: [N8nService, 'N8N_ENABLED'],
        };
    }
}
